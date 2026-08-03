const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Create new order (COD or after Razorpay verification)
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    shippingAddress,
    paymentMethod,
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

  const order = await Order.create({
    user: req.user._id,
    items,
    shippingAddress,
    paymentMethod: paymentMethod || 'razorpay',
    itemsPrice,
    shippingPrice: shippingPrice || 0,
    discountAmount: discountAmount || 0,
    couponCode: couponCode || '',
    totalPrice,
    isPaid: paymentMethod === 'razorpay',
    paidAt: paymentMethod === 'razorpay' ? Date.now() : undefined,
    paymentResult: paymentResult || {},
    trackingHistory: [{ status: 'Pending', note: 'Order placed successfully' }],
  });

  // Clear the items purchased from the user's cart
  await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });

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

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  if (['Shipped', 'Out for Delivery', 'Delivered'].includes(order.orderStatus)) {
    res.status(400);
    throw new Error('This order can no longer be cancelled');
  }

  order.orderStatus = 'Cancelled';
  order.cancelReason = req.body.reason || 'Cancelled by customer';
  order.trackingHistory.push({ status: 'Cancelled', note: order.cancelReason });

  // Restock items
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      product.totalStock += item.quantity;
      await product.save();
    }
  }

  await order.save();

  res.json({ success: true, message: 'Order cancelled successfully', order });
});

// ---------------- ADMIN ----------------

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = status ? { orderStatus: status } : {};

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .populate('user', 'name email phone')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, count: orders.length, total, page: Number(page), pages: Math.ceil(total / limit), orders });
});

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);

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

  res.json({ success: true, message: 'Order status updated', order });
});

// @desc    Sales dashboard stats (Admin)
// @route   GET /api/orders/stats/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const totalRevenueAgg = await Order.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const totalRevenue = totalRevenueAgg[0]?.total || 0;

  const totalUsers = await User.countDocuments({ role: 'customer' });
  const totalProducts = await Product.countDocuments();

  const pendingOrders = await Order.countDocuments({ orderStatus: 'Pending' });
  const processingOrders = await Order.countDocuments({ orderStatus: 'Processing' });
  const deliveredOrders = await Order.countDocuments({ orderStatus: 'Delivered' });
  const cancelledOrders = await Order.countDocuments({ orderStatus: 'Cancelled' });

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
      totalRevenue,
      totalUsers,
      totalProducts,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders,
      salesByMonth,
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
  getAllOrders,
  updateOrderStatus,
  getDashboardStats,
};
