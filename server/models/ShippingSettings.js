const mongoose = require('mongoose');

// Singleton-style settings document (one active config, extensible to pincode-level overrides)
const pincodeRuleSchema = new mongoose.Schema(
  {
    pincode: { type: String, required: true },
    serviceable: { type: Boolean, default: true },
    codAvailable: { type: Boolean, default: true },
    extraDays: { type: Number, default: 0 }, // added on top of standard/express days
  },
  { _id: false }
);

const shippingSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'default' },
    standardDeliveryDays: {
      min: { type: Number, default: 5 },
      max: { type: Number, default: 7 },
    },
    expressDeliveryDays: {
      min: { type: Number, default: 2 },
      max: { type: Number, default: 3 },
    },
    shippingCharge: { type: Number, default: 49 },
    expressShippingCharge: { type: Number, default: 149 },
    freeShippingThreshold: { type: Number, default: 999 },
    codAvailable: { type: Boolean, default: true },
    codExtraCharge: { type: Number, default: 0 },
    pincodeRules: [pincodeRuleSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShippingSettings', shippingSettingsSchema);
