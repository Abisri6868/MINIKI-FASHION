const express = require('express');
const router = express.Router();
const { getOrderInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:orderId', protect, getOrderInvoice);

module.exports = router;
