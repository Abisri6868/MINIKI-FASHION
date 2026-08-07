const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const Notification = require('../models/Notification');
const { calculateDelivery } = require('../utils/deliveryCalculator');
const { sendOrderEmail } = require('../utils/emailService');

// @desc    Create new order (COD or after Razorpay verification)
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    shippingAddress,
    paymentMethod,
    deliveryMethod,
    itemsPrice,
    shippingPrice,
    discountAmount,
    couponCode,
    totalPrice,
    paymentResult,
  } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No order items provided');
  }

  // Validate stock and decrement
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.name}`);
    }
    if (product.variants && product.variants.length > 0 && item.variant) {
      const variant = product.variants.find(
        (v) => v.size === item.variant.size && v.color === item.variant.color
      );
      if (variant) {
        if (variant.stock < item.quantity) {
          res.status(400);
          throw new Error(`Insufficient stock for ${item.name}`);
        }
        variant.stock -= item.quantity;
      }
    } else if (product.totalStock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${item.name}`);
    }
    product.totalStock = Math.max(0, product.totalStock - item.quantity);
    product.numSold += item.quantity;
    await product.save();
  }

  // Estimate delivery based on Admin Shipping Settings
  const estimate = await calculateDelivery({
    deliveryMethod: deliveryMethod || 'Standard',
    pincode: shippingAddress?.pincode,
  });

  const order = await Order.create({
    user: req.user._id,
    items,
    shippingAddress,
    paymentMethod: paymentMethod || 'razorpay',
    deliveryMethod: deliveryMethod || 'Standard',
    estimatedDeliveryDays: estimate.days,
    estimatedDeliveryDate: estimate.estimatedDeliveryDate,
    itemsPrice,
    shippingPrice: shippingPrice ?? estimate.shippingCharge,
    discountAmount: discountAmount || 0,
    couponCode: couponCode || '',
    totalPrice,
    isPaid: paymentMethod === 'razorpay',
    paidAt: paymentMethod === 'razorpay' ? Date.now() : undefined,
    paymentResult: paymentResult || {},
    orderStatus: 'Pending Approval',
    adminApproval: 'Pending',
    trackingHistory: [{ status: 'Order Placed', note: 'Order placed successfully, awaiting admin approval' }],
  });

  // Payment history record
  if (paymentMethod === 'razorpay' && paymentResult) {
    await Payment.create({
      order: order._id,
      user: req.user._id,
      method: 'razorpay',
      razorpay_order_id: paymentResult.razorpay_order_id,
      razorpay_payment_id: paymentResult.razorpay_payment_id,
      razorpay_signature: paymentResult.razorpay_signature,
      amount: totalPrice,
      status: 'success',
    });
  } else {
    await Payment.create({
      order: order._id,
      user: req.user._id,
      method: 'cod',
      amount: totalPrice,
      status: 'pending',
    });
  }

  // Clear the items purchased from the user's cart
  await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });

  await Notification.create({
    user: req.user._id,
    audience: 'customer',
    type: 'order_placed',
    title: 'Order Placed',
    message: `Your order #${order.orderNumber} has been placed successfully.`,
    order: order._id,
  });
  await Notification.create({
    audience: 'admin',
    type: 'order_placed',
    title: 'New Order Received',
    message: `New order #${order.orderNumber} needs your approval.`,
    order: order._id,
  });

  const populatedOrder = await Order.findById(order._id).populate('user', 'name email');
  sendOrderEmail('orderPlaced', populatedOrder);
  if (order.isPaid) sendOrderEmail('paymentSuccess', populatedOrder);

  res.status(201).json({ success: true, message: 'Order placed successfully', order });
});

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.json({ success: true, count: orders.length, orders });
});

// @desc    Get single order by id (owner or admin)
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json({ success: true, order });
});

// @desc    Cancel an order (customer, or admin at any pre-shipping stage)
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  if (['Shipped', 'Out for Delivery', 'Delivered'].includes(order.orderStatus)) {
    res.status(400);
    throw new Error('This order can no longer be cancelled');
  }

  order.orderStatus = 'Cancelled';
  order.adminApproval = order.adminApproval === 'Pending' ? 'Rejected' : order.adminApproval;
  order.cancelReason = req.body.reason || 'Cancelled by customer';
  order.trackingHistory.push({ status: 'Cancelled', note: order.cancelReason });

  if (order.isPaid) {
    order.refundStatus = 'Pending';
    order.refundAmount = order.totalPrice;
    await Refund.create({
      order: order._id,
      user: order.user._id,
      amount: order.totalPrice,
      reason: order.cancelReason,
      status: 'Pending',
    });
  }

  // Restock items
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      if (product.variants?.length && item.variant) {
        const variant = product.variants.find((v) => v.size === item.variant.size && v.color === item.variant.color);
        if (variant) variant.stock += item.quantity;
      }
      product.totalStock += item.quantity;
      await product.save();
    }
  }

  await order.save();

  await Notification.create({
    user: order.user._id,
    audience: 'customer',
    type: 'order_cancelled',
    title: 'Order Cancelled',
    message: `Order #${order.orderNumber} has been cancelled.`,
    order: order._id,
  });
  sendOrderEmail('orderCancelled', order);

  res.json({ success: true, message: 'Order cancelled successfully', order });
});

// @desc    Reorder — re-adds a previous order's items to the cart (accounts for price/stock changes)
// @route   POST /api/orders/:id/reorder
// @access  Private
const reorderItems = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const user = await User.findById(req.user._id);
  const unavailable = [];

  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      unavailable.push(item.name);
      continue;
    }
    user.cart.push({ product: item.product, variant: item.variant, quantity: item.quantity });
  }
  await user.save();

  res.json({
    success: true,
    message: unavailable.length
      ? `Added to cart. ${unavailable.length} item(s) no longer available: ${unavailable.join(', ')}`
      : 'All items added to cart',
    unavailable,
  });
});

// ---------------- ADMIN ----------------

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;
  const filter = {};
  if (status) filter.orderStatus = status;
  if (search) filter.orderNumber = { $regex: search, $options: 'i' };

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .populate('user', 'name email phone')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, count: orders.length, total, page: Number(page), pages: Math.ceil(total / limit), orders });
});

// @desc    Accept a pending order — kicks off Processing -> Packed -> Shipped -> Out for Delivery -> Delivered
// @route   PUT /api/orders/:id/accept
// @access  Private/Admin
const acceptOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.adminApproval !== 'Pending') {
    res.status(400);
    throw new Error(`Order was already ${order.adminApproval.toLowerCase()}`);
  }

  const estimate = await calculateDelivery({
    deliveryMethod: order.deliveryMethod,
    pincode: order.shippingAddress?.pincode,
    fromDate: new Date(),
  });

  order.adminApproval = 'Accepted';
  order.orderStatus = 'Processing';
  order.acceptedAt = new Date();
  order.estimatedDeliveryDays = estimate.days;
  order.estimatedDeliveryDate = estimate.estimatedDeliveryDate;
  order.trackingHistory.push({ status: 'Processing', note: 'Order accepted by admin' });
  await order.save();

  await Notification.create({
    user: order.user._id,
    audience: 'customer',
    type: 'order_accepted',
    title: 'Order Accepted',
    message: `Order #${order.orderNumber} has been accepted and is being processed.`,
    order: order._id,
  });
  sendOrderEmail('orderAccepted', order);

  res.json({ success: true, message: 'Order accepted', order });
});

// @desc    Reject/cancel an order before it's accepted
// @route   PUT /api/orders/:id/reject
// @access  Private/Admin
const rejectOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.adminApproval !== 'Pending') {
    res.status(400);
    throw new Error(`Order was already ${order.adminApproval.toLowerCase()}`);
  }

  order.adminApproval = 'Rejected';
  order.orderStatus = 'Cancelled';
  order.cancelReason = req.body.reason || 'Cancelled by admin';
  order.trackingHistory.push({ status: 'Cancelled', note: order.cancelReason });

  if (order.isPaid) {
    order.refundStatus = 'Pending';
    order.refundAmount = order.totalPrice;
    await Refund.create({ order: order._id, user: order.user._id, amount: order.totalPrice, reason: order.cancelReason, status: 'Pending' });
  }

  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      if (product.variants?.length && item.variant) {
        const variant = product.variants.find((v) => v.size === item.variant.size && v.color === item.variant.color);
        if (variant) variant.stock += item.quantity;
      }
      product.totalStock += item.quantity;
      await product.save();
    }
  }

  await order.save();

  await Notification.create({
    user: order.user._id,
    audience: 'customer',
    type: 'order_cancelled',
    title: 'Order Cancelled',
    message: `Order #${order.orderNumber} was cancelled by our team.`,
    order: order._id,
  });
  sendOrderEmail('orderCancelled', order);

  res.json({ success: true, message: 'Order rejected/cancelled', order });
});

// @desc    Update order status manually (Admin) — Processing/Packed/Shipped/Out for Delivery/Delivered/Returned
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.orderStatus = status;
  order.trackingHistory.push({ status, note: note || '' });

  if (status === 'Delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  await order.save();

  const typeMap = {
    Processing: 'processing', Packed: 'packed', Shipped: 'shipped',
    'Out for Delivery': 'out_for_delivery', Delivered: 'delivered',
  };

  await Notification.create({
    user: order.user._id,
    audience: 'customer',
    type: typeMap[status] || 'general',
    title: `Order ${status}`,
    message: `Order #${order.orderNumber} is now ${status}.`,
    order: order._id,
  });
  sendOrderEmail('statusUpdate', order, status);

  res.json({ success: true, message: 'Order status updated', order });
});

// @desc    Auto-progress orders whose next stage is due (called by cron in server.js, also exposed for manual trigger)
// @route   POST /api/orders/auto-progress
// @access  Private/Admin
const STAGE_SEQUENCE = ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const autoProgressOrders = asyncHandler(async (req, res) => {
  const result = await runAutoProgress();
  res.json({ success: true, ...result });
});

const runAutoProgress = async () => {
  const activeOrders = await Order.find({
    adminApproval: 'Accepted',
    orderStatus: { $in: STAGE_SEQUENCE.slice(0, -1) },
  }).populate('user', 'name email');

  let advanced = 0;

  for (const order of activeOrders) {
    const currentIndex = STAGE_SEQUENCE.indexOf(order.orderStatus);
    if (currentIndex === -1) continue;

    const totalMs = Math.max(order.estimatedDeliveryDays, 1) * 24 * 60 * 60 * 1000;
    const stageMs = totalMs / STAGE_SEQUENCE.length;
    const startedAt = order.acceptedAt || order.createdAt;
    const elapsed = Date.now() - new Date(startedAt).getTime();
    const dueIndex = Math.min(Math.floor(elapsed / stageMs), STAGE_SEQUENCE.length - 1);
    const isPastDeliveryDate = order.estimatedDeliveryDate && Date.now() >= new Date(order.estimatedDeliveryDate).getTime();

    const targetIndex = isPastDeliveryDate ? STAGE_SEQUENCE.length - 1 : dueIndex;

    if (targetIndex > currentIndex) {
      const nextStatus = STAGE_SEQUENCE[currentIndex + 1];
      order.orderStatus = nextStatus;
      order.trackingHistory.push({ status: nextStatus, note: 'Auto-updated by delivery automation' });
      if (nextStatus === 'Delivered') {
        order.isDelivered = true;
        order.deliveredAt = new Date();
      }
      await order.save();
      advanced += 1;

      const typeMap = {
        Processing: 'processing', Packed: 'packed', Shipped: 'shipped',
        'Out for Delivery': 'out_for_delivery', Delivered: 'delivered',
      };
      await Notification.create({
        user: order.user._id,
        audience: 'customer',
        type: typeMap[nextStatus] || 'general',
        title: `Order ${nextStatus}`,
        message: `Order #${order.orderNumber} is now ${nextStatus}.`,
        order: order._id,
      });
      sendOrderEmail('statusUpdate', order, nextStatus);
    }
  }

  return { checked: activeOrders.length, advanced };
};

// @desc    Sales dashboard stats (Admin)
// @route   GET /api/orders/stats/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const totalOrders = await Order.countDocuments();
  const todaysOrders = await Order.countDocuments({ createdAt: { $gte: startOfToday } });

  const totalRevenueAgg = await Order.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const totalRevenue = totalRevenueAgg[0]?.total || 0;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthlyRevenueAgg = await Order.aggregate([
    { $match: { isPaid: true, createdAt: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;

  const totalUsers = await User.countDocuments({ role: 'customer' });
  const totalProducts = await Product.countDocuments();

  const pendingOrders = await Order.countDocuments({ orderStatus: 'Pending Approval' });
  const acceptedOrders = await Order.countDocuments({ adminApproval: 'Accepted' });
  const processingOrders = await Order.countDocuments({ orderStatus: 'Processing' });
  const deliveredOrders = await Order.countDocuments({ orderStatus: 'Delivered' });
  const cancelledOrders = await Order.countDocuments({ orderStatus: 'Cancelled' });

  const codOrders = await Order.countDocuments({ paymentMethod: 'cod' });
  const onlinePaidOrders = await Order.countDocuments({ paymentMethod: 'razorpay', isPaid: true });
  const pendingPayments = await Order.countDocuments({ isPaid: false, orderStatus: { $ne: 'Cancelled' } });

  const lowStockProducts = await Product.find({ totalStock: { $lte: 5, $gt: 0 }, isActive: true })
    .select('name totalStock images')
    .limit(10);

  const salesByMonth = await Order.aggregate([
    { $match: { isPaid: true } },
    {
      $group: {
        _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 12 },
  ]);

  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
  ]);

  const customerGrowth = await User.aggregate([
    { $match: { role: 'customer' } },
    {
      $group: {
        _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 12 },
  ]);

  const topProducts = await Order.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        totalSold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
  ]);

  const recentOrders = await Order.find().populate('user', 'name email').sort('-createdAt').limit(5);

  res.json({
    success: true,
    stats: {
      totalOrders,
      todaysOrders,
      totalRevenue,
      monthlyRevenue,
      totalUsers,
      totalProducts,
      pendingOrders,
      acceptedOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders,
      codOrders,
      onlinePaidOrders,
      pendingPayments,
      lowStockProducts,
      salesByMonth,
      ordersByStatus,
      customerGrowth,
      topProducts,
      recentOrders,
    },
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  reorderItems,
  getAllOrders,
  acceptOrder,
  rejectOrder,
  updateOrderStatus,
  autoProgressOrders,
  runAutoProgress,
  getDashboardStats,
};
