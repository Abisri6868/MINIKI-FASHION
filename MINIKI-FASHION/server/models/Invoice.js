const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    invoiceNumber: { type: String, unique: true, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    url: { type: String, default: '' }, // optional cloudinary url if uploaded
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

invoiceSchema.pre('validate', function (next) {
  if (!this.invoiceNumber) {
    this.invoiceNumber = 'INV' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 90 + 10);
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
