const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyPayment,
  retryPayment,
  confirmRetryPayment,
  getPaymentHistory,
  initiateRefund,
  getAllRefunds,
} = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.post('/retry/:orderId', protect, retryPayment);
router.put('/confirm/:orderId', protect, confirmRetryPayment);
router.get('/history', protect, getPaymentHistory);
router.post('/refund/:orderId', protect, admin, initiateRefund);
router.get('/refunds', protect, admin, getAllRefunds);

module.exports = router;
