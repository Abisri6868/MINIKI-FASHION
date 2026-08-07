const express = require('express');
const router = express.Router();
const {
  getShippingSettings,
  updateShippingSettings,
  upsertPincodeRule,
  deletePincodeRule,
  estimateDelivery,
} = require('../controllers/shippingSettingsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', getShippingSettings);
router.get('/estimate', estimateDelivery);
router.put('/', protect, admin, updateShippingSettings);
router.post('/pincode', protect, admin, upsertPincodeRule);
router.delete('/pincode/:pincode', protect, admin, deletePincodeRule);

module.exports = router;
