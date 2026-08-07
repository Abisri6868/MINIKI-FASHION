const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const ShippingLabel = require('../models/ShippingLabel');
const { generateShippingLabelPDF } = require('../utils/pdfGenerator');

// @desc    Generate (or fetch existing) shipping label and stream the PDF (Admin)
// @route   GET /api/shipping-labels/:orderId
// @access  Private/Admin
const getShippingLabel = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  let label = await ShippingLabel.findOne({ order: order._id });
  if (!label) {
    label = await ShippingLabel.create({
      order: order._id,
      courierName: req.query.courier || '',
      trackingNumber: req.query.tracking || '',
      packageWeight: req.query.weight || '0.5 kg',
    });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="shipping-label-${order.orderNumber}.pdf"`);
  await generateShippingLabelPDF(order, label, res);
});

// @desc    Update shipping label details (courier, tracking number, notes) (Admin)
// @route   PUT /api/shipping-labels/:orderId
// @access  Private/Admin
const updateShippingLabel = asyncHandler(async (req, res) => {
  const { courierName, trackingNumber, packageWeight, shippingNotes } = req.body;
  let label = await ShippingLabel.findOne({ order: req.params.orderId });
  if (!label) {
    label = await ShippingLabel.create({ order: req.params.orderId });
  }
  if (courierName !== undefined) label.courierName = courierName;
  if (trackingNumber !== undefined) label.trackingNumber = trackingNumber;
  if (packageWeight !== undefined) label.packageWeight = packageWeight;
  if (shippingNotes !== undefined) label.shippingNotes = shippingNotes;
  await label.save();
  res.json({ success: true, label });
});

module.exports = { getShippingLabel, updateShippingLabel };
