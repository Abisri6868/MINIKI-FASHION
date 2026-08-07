const express = require('express');
const router = express.Router();
const {
  submitContactMessage,
  getContactMessages,
  markMessageAsRead,
  replyToMessage,
  deleteMessage,
} = require('../controllers/contactController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public - anyone can submit; if logged in, req.user gets attached optionally via optionalAuth below
const { optionalAuth } = require('../middleware/authMiddleware');
router.post('/', optionalAuth, submitContactMessage);

router.get('/', protect, admin, getContactMessages);
router.put('/:id/read', protect, admin, markMessageAsRead);
router.post('/:id/reply', protect, admin, replyToMessage);
router.delete('/:id', protect, admin, deleteMessage);

module.exports = router;
