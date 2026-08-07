const mongoose = require('mongoose');

const shippingLabelSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    labelNumber: { type: String, unique: true, required: true },
    courierName: { type: String, default: '' },
    trackingNumber: { type: String, default: '' },
    packageWeight: { type: String, default: '0.5 kg' },
    shippingNotes: { type: String, default: 'Handle with care' },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

shippingLabelSchema.pre('validate', function (next) {
  if (!this.labelNumber) {
    this.labelNumber = 'LBL' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 90 + 10);
  }
  next();
});

module.exports = mongoose.model('ShippingLabel', shippingLabelSchema);
