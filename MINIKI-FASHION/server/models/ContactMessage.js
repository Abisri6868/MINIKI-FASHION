const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    repliedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    subject: { type: String, default: 'General Inquiry' },
    message: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isRead: { type: Boolean, default: false },
    reply: replySchema,
  },
  { timestamps: true }
);

contactMessageSchema.index({ name: 'text', email: 'text', message: 'text' });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
