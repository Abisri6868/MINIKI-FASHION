const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const razorpayInstance = require('../config/razorpay');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const Notification = require('../models/Notification');
const { sendOrderEmail } = require('../utils/emailService');

// @desc    Create a Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Invalid amount');
  }

  const options = {
    amount: Math.round(amount * 100), // amount in paise
    currency,
    receipt: receipt || `receipt_${Date.now()}`,
  };

  const razorpayOrder = await razorpayInstance.orders.create(options);

  res.json({
    success: true,
    order: razorpayOrder,
    key: process.env.RAZORPAY_KEY_ID,
  });
});

// @desc    Verify Razorpay payment signature
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error('Missing payment verification details');
  }

  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    // Record failure if we can associate an order
    if (req.body.orderId) {
      const order = await Order.findById(req.body.orderId).populate('user', 'name email');
      if (order) {
        await Payment.create({
          order: order._id, user: order.user._id, method: 'razorpay',
          razorpay_order_id, amount: order.totalPrice, status: 'failed',
          failureReason: 'Signature mismatch',
        });
        sendOrderEmail('paymentFailed', order);
      }
    }
    res.status(400);
    throw new Error('Payment verification failed. Signature mismatch.');
  }

  res.json({ success: true, message: 'Payment verified successfully' });
});

// @desc    Retry payment for an existing (unpaid) order — issues a fresh Razorpay order
// @route   POST /api/payment/retry/:orderId
// @access  Private
const retryPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }
  if (order.isPaid) {
    res.status(400);
    throw new Error('Order is already paid');
  }

  const razorpayOrder = await razorpayInstance.orders.create({
    amount: Math.round(order.totalPrice * 100),
    currency: 'INR',
    receipt: `retry_${order.orderNumber}_${Date.now()}`,
  });

  await Payment.create({
    order: order._id, user: order.user._id, method: 'razorpay',
    razorpay_order_id: razorpayOrder.id, amount: order.totalPrice, status: 'attempted',
    retryCount: 1,
  });

  res.json({ success: true, order: razorpayOrder, key: process.env.RAZORPAY_KEY_ID });
});

// @desc    Mark order as paid after a successful retry
// @route   PUT /api/payment/confirm/:orderId
// @access  Private
const confirmRetryPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const order = await Order.findById(req.params.orderId).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error('Payment verification failed');
  }

  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentResult = { razorpay_order_id, razorpay_payment_id, razorpay_signature, status: 'success' };
  await order.save();

  await Payment.create({
    order: order._id, user: order.user._id, method: 'razorpay',
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
    amount: order.totalPrice, status: 'success',
  });

  await Notification.create({
    user: order.user._id, audience: 'customer', type: 'payment_success',
    title: 'Payment Successful', message: `Payment received for order #${order.orderNumber}.`, order: order._id,
  });
  sendOrderEmail('paymentSuccess', order);

  res.json({ success: true, message: 'Payment confirmed', order });
});

// @desc    Get logged-in user's payment history
// @route   GET /api/payment/history
// @access  Private
const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id }).populate('order', 'orderNumber totalPrice orderStatus').sort('-createdAt');
  res.json({ success: true, count: payments.length, payments });
});

// @desc    Initiate a refund for an order (Admin) — creates a refund-ready record; wire to Razorpay Refunds API for live mode
// @route   POST /api/payment/refund/:orderId
// @access  Private/Admin
const initiateRefund = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (!order.isPaid) {
    res.status(400);
    throw new Error('Order was not paid — nothing to refund');
  }

  const amount = req.body.amount || order.totalPrice;
  let razorpayRefundId = '';

  // Attempt live Razorpay refund when we have a captured payment id
  const paymentId = order.paymentResult?.razorpay_payment_id;
  if (paymentId) {
    try {
      const refund = await razorpayInstance.payments.refund(paymentId, { amount: Math.round(amount * 100) });
      razorpayRefundId = refund.id;
    } catch (err) {
      console.error('[refund] Razorpay refund API error:', err.message);
      // fall through — refund stays "Pending" for manual processing
    }
  }

  const refundDoc = await Refund.create({
    order: order._id,
    user: order.user._id,
    amount,
    reason: req.body.reason || 'Admin initiated refund',
    status: razorpayRefundId ? 'Processing' : 'Pending',
    razorpay_refund_id: razorpayRefundId,
  });

  order.refundStatus = razorpayRefundId ? 'Processing' : 'Pending';
  order.refundAmount = amount;
  await order.save();

  await Notification.create({
    user: order.user._id, audience: 'customer', type: 'refund_initiated',
    title: 'Refund Initiated', message: `A refund of ₹${amount} has been initiated for order #${order.orderNumber}.`, order: order._id,
  });
  sendOrderEmail('refundInitiated', order, amount);

  res.json({ success: true, message: 'Refund initiated', refund: refundDoc });
});

// @desc    Get all refunds (Admin)
// @route   GET /api/payment/refunds
// @access  Private/Admin
const getAllRefunds = asyncHandler(async (req, res) => {
  const refunds = await Refund.find().populate('order', 'orderNumber totalPrice').populate('user', 'name email').sort('-createdAt');
  res.json({ success: true, count: refunds.length, refunds });
});

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  retryPayment,
  confirmRetryPayment,
  getPaymentHistory,
  initiateRefund,
  getAllRefunds,
};
