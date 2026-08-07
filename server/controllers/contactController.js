const asyncHandler = require('express-async-handler');
const ContactMessage = require('../models/ContactMessage');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/emailService');

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
const submitContactMessage = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message) {
    res.status(400);
    throw new Error('Name, email and message are required');
  }

  const contactMessage = await ContactMessage.create({
    name, email, phone, subject, message,
    user: req.user?._id,
  });

  await Notification.create({
    audience: 'admin',
    type: 'new_message',
    title: 'New Contact Message',
    message: `${name} sent a new message: "${subject || 'General Inquiry'}"`,
  });

  // Fire-and-forget acknowledgement email
  sendEmail({
    to: email,
    subject: 'We received your message - MINIKI FASHION',
    html: `<p>Hi ${name},</p><p>Thanks for reaching out! Our team will get back to you shortly.</p>`,
  });

  res.status(201).json({ success: true, message: 'Message sent successfully', contactMessage });
});

// ---------------- ADMIN ----------------

// @desc    Get all contact messages with search + unread count (Admin)
// @route   GET /api/contact
// @access  Private/Admin
const getContactMessages = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20, isRead } = req.query;
  const filter = {};
  if (search) filter.$text = { $search: search };
  if (isRead !== undefined) filter.isRead = isRead === 'true';

  const total = await ContactMessage.countDocuments(filter);
  const unreadCount = await ContactMessage.countDocuments({ isRead: false });
  const messages = await ContactMessage.find(filter)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, count: messages.length, total, unreadCount, page: Number(page), pages: Math.ceil(total / limit), messages });
});

// @desc    Mark message as read (Admin)
// @route   PUT /api/contact/:id/read
// @access  Private/Admin
const markMessageAsRead = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }
  res.json({ success: true, message });
});

// @desc    Reply to a message (Admin)
// @route   POST /api/contact/:id/reply
// @access  Private/Admin
const replyToMessage = asyncHandler(async (req, res) => {
  const { reply } = req.body;
  if (!reply) {
    res.status(400);
    throw new Error('Reply message is required');
  }

  const message = await ContactMessage.findById(req.params.id);
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  message.reply = { message: reply, repliedBy: req.user._id, repliedAt: new Date() };
  message.isRead = true;
  await message.save();

  await sendEmail({
    to: message.email,
    subject: `Re: ${message.subject || 'Your message to MINIKI FASHION'}`,
    html: `<p>Hi ${message.name},</p><p>${reply}</p><hr/><p style="color:#999;font-size:12px;">Your original message: ${message.message}</p>`,
  });

  res.json({ success: true, message: 'Reply sent', data: message });
});

// @desc    Delete a message (Admin)
// @route   DELETE /api/contact/:id
// @access  Private/Admin
const deleteMessage = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }
  res.json({ success: true, message: 'Message deleted' });
});

module.exports = {
  submitContactMessage,
  getContactMessages,
  markMessageAsRead,
  replyToMessage,
  deleteMessage,
};
