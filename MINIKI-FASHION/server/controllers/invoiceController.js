const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { sendOrderEmail } = require('../utils/emailService');

// @desc    Generate (or fetch existing) invoice and stream the PDF
// @route   GET /api/invoices/:orderId
// @access  Private (owner or admin)
const getOrderInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this invoice');
  }

  let invoice = await Invoice.findOne({ order: order._id });
  if (!invoice) {
    invoice = await Invoice.create({ order: order._id, user: order.user._id, amount: order.totalPrice });
    order.invoiceNumber = invoice.invoiceNumber;
    await order.save();

    await Notification.create({
      user: order.user._id,
      audience: 'customer',
      type: 'invoice_generated',
      title: 'Invoice Generated',
      message: `Invoice ${invoice.invoiceNumber} is ready for order #${order.orderNumber}`,
      order: order._id,
    });
    sendOrderEmail('invoiceGenerated', order);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="invoice-${order.orderNumber}.pdf"`);
  await generateInvoicePDF(order, invoice.invoiceNumber, res);
});

module.exports = { getOrderInvoice };
