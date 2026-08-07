const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Order = require('../models/Order');

// @desc    Get all customers (Admin)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;

  const filter = { role: 'customer' };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-password')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, count: users.length, total, page: Number(page), pages: Math.ceil(total / limit), users });
});

// @desc    Get single customer with order history (Admin)
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const orders = await Order.find({ user: user._id }).sort('-createdAt');

  res.json({ success: true, user, orders });
});

// @desc    Toggle customer active status (Admin)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user: user.toSafeObject() });
});

module.exports = { getUsers, getUserById, toggleUserStatus };
