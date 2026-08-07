const express = require('express');
const router = express.Router();
const {
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
  getDashboardStats,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/stats/dashboard', protect, admin, getDashboardStats);
router.post('/auto-progress', protect, admin, autoProgressOrders);
router.get('/', protect, admin, getAllOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);
router.post('/:id/reorder', protect, reorderItems);
router.put('/:id/accept', protect, admin, acceptOrder);
router.put('/:id/reject', protect, admin, rejectOrder);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;
