const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null/undefined = admin-facing notification
    audience: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    type: {
      type: String,
      enum: [
        'order_placed', 'order_accepted', 'order_cancelled', 'payment_success', 'payment_failed',
        'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'invoice_generated',
        'refund_initiated', 'new_message', 'low_stock', 'general',
      ],
      default: 'general',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ audience: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
