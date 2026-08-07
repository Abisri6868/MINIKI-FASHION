const express = require('express');
const router = express.Router();
const { getShippingLabel, updateShippingLabel } = require('../controllers/shippingLabelController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/:orderId', protect, admin, getShippingLabel);
router.put('/:orderId', protect, admin, updateShippingLabel);

module.exports = router;
