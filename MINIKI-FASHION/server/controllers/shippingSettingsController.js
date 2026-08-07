const asyncHandler = require('express-async-handler');
const ShippingSettings = require('../models/ShippingSettings');
const { getActiveShippingSettings, calculateDelivery } = require('../utils/deliveryCalculator');

// @desc    Get current shipping settings (public - needed on product/cart/checkout pages)
// @route   GET /api/shipping-settings
// @access  Public
const getShippingSettings = asyncHandler(async (req, res) => {
  const settings = await getActiveShippingSettings();
  res.json({ success: true, settings });
});

// @desc    Update shipping settings (Admin)
// @route   PUT /api/shipping-settings
// @access  Private/Admin
const updateShippingSettings = asyncHandler(async (req, res) => {
  const settings = await getActiveShippingSettings();

  const fields = [
    'standardDeliveryDays', 'expressDeliveryDays', 'shippingCharge', 'expressShippingCharge',
    'freeShippingThreshold', 'codAvailable', 'codExtraCharge', 'isActive',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) settings[f] = req.body[f];
  });

  await settings.save();
  res.json({ success: true, message: 'Shipping settings updated', settings });
});

// @desc    Add/update a pincode-level delivery rule (Admin)
// @route   POST /api/shipping-settings/pincode
// @access  Private/Admin
const upsertPincodeRule = asyncHandler(async (req, res) => {
  const { pincode, serviceable = true, codAvailable = true, extraDays = 0 } = req.body;
  if (!pincode) {
    res.status(400);
    throw new Error('Pincode is required');
  }

  const settings = await getActiveShippingSettings();
  const existing = settings.pincodeRules.find((r) => r.pincode === String(pincode));
  if (existing) {
    existing.serviceable = serviceable;
    existing.codAvailable = codAvailable;
    existing.extraDays = extraDays;
  } else {
    settings.pincodeRules.push({ pincode: String(pincode), serviceable, codAvailable, extraDays });
  }
  await settings.save();
  res.json({ success: true, message: 'Pincode rule saved', settings });
});

// @desc    Remove a pincode rule (Admin)
// @route   DELETE /api/shipping-settings/pincode/:pincode
// @access  Private/Admin
const deletePincodeRule = asyncHandler(async (req, res) => {
  const settings = await getActiveShippingSettings();
  settings.pincodeRules = settings.pincodeRules.filter((r) => r.pincode !== req.params.pincode);
  await settings.save();
  res.json({ success: true, message: 'Pincode rule removed', settings });
});

// @desc    Estimate delivery for a given pincode + delivery method (used on Product/Cart/Checkout pages)
// @route   GET /api/shipping-settings/estimate?pincode=xxx&method=Standard
// @access  Public
const estimateDelivery = asyncHandler(async (req, res) => {
  const { pincode, method = 'Standard' } = req.query;
  const estimate = await calculateDelivery({ deliveryMethod: method, pincode });
  res.json({ success: true, estimate });
});

module.exports = {
  getShippingSettings,
  updateShippingSettings,
  upsertPincodeRule,
  deletePincodeRule,
  estimateDelivery,
};
