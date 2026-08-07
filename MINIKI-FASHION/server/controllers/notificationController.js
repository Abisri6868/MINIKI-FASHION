const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// @desc    Get logged-in user's notifications
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin'
    ? { $or: [{ audience: 'admin' }, { user: req.user._id }] }
    : { user: req.user._id };

  const notifications = await Notification.find(filter).sort('-createdAt').limit(50);
  const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

  res.json({ success: true, count: notifications.length, unreadCount, notifications });
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  res.json({ success: true, notification });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin'
    ? { $or: [{ audience: 'admin' }, { user: req.user._id }] }
    : { user: req.user._id };
  await Notification.updateMany(filter, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
