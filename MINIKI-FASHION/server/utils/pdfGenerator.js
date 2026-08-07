const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const bwipjs = require('bwip-js');

const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;

const generateBarcodePNG = async (text) => {
  return bwipjs.toBuffer({
    bcid: 'code128',
    text,
    scale: 3,
    height: 12,
    includetext: true,
    textxalign: 'center',
  });
};

const generateQRPNG = async (text) => {
  return QRCode.toBuffer(text, { width: 180, margin: 1 });
};

/**
 * Streams an invoice PDF for the given order onto `res` (or any writable stream).
 */
const generateInvoicePDF = async (order, invoiceNumber, stream) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(stream);

  doc.fontSize(20).fillColor('#be185d').text('MINIKI FASHION', { align: 'left' });
  doc.fontSize(10).fillColor('#333').text('Tax Invoice', { align: 'left' });
  doc.moveDown(0.5);
  doc.strokeColor('#eee').moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown();

  doc.fontSize(11).fillColor('#000');
  doc.text(`Invoice No: ${invoiceNumber}`, 40, doc.y);
  doc.text(`Order No: ${order.orderNumber}`);
  doc.text(`Date: ${new Date(order.createdAt).toDateString()}`);
  doc.moveDown();

  doc.fontSize(12).fillColor('#be185d').text('Bill To:');
  doc.fillColor('#000').fontSize(10);
  const addr = order.shippingAddress || {};
  doc.text(addr.fullName || '');
  doc.text(addr.phone || '');
  doc.text(`${addr.addressLine1 || ''} ${addr.addressLine2 || ''}`);
  doc.text(`${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`);
  doc.moveDown();

  // Table header
  const tableTop = doc.y;
  doc.fontSize(10).fillColor('#fff');
  doc.rect(40, tableTop, 515, 20).fill('#be185d');
  doc.fillColor('#fff').text('Item', 45, tableTop + 5, { width: 200 });
  doc.text('Variant', 250, tableTop + 5, { width: 90 });
  doc.text('Qty', 345, tableTop + 5, { width: 40, align: 'right' });
  doc.text('Price', 390, tableTop + 5, { width: 70, align: 'right' });
  doc.text('Total', 465, tableTop + 5, { width: 80, align: 'right' });

  let y = tableTop + 25;
  doc.fillColor('#000').fontSize(9);
  (order.items || []).forEach((item) => {
    doc.text(item.name, 45, y, { width: 200 });
    doc.text(`${item.variant?.size || ''} ${item.variant?.color || ''}`.trim() || '-', 250, y, { width: 90 });
    doc.text(String(item.quantity), 345, y, { width: 40, align: 'right' });
    doc.text(money(item.price), 390, y, { width: 70, align: 'right' });
    doc.text(money(item.price * item.quantity), 465, y, { width: 80, align: 'right' });
    y += 20;
  });

  doc.strokeColor('#eee').moveTo(40, y).lineTo(555, y).stroke();
  y += 10;

  const summaryLine = (label, value, bold = false) => {
    doc.fontSize(bold ? 11 : 10).fillColor('#000');
    doc.text(label, 380, y, { width: 100, align: 'right' });
    doc.text(value, 465, y, { width: 80, align: 'right' });
    y += 18;
  };

  summaryLine('Subtotal:', money(order.itemsPrice));
  if (order.discountAmount) summaryLine('Discount:', `-${money(order.discountAmount)}`);
  summaryLine('Shipping:', money(order.shippingPrice));
  summaryLine('Grand Total:', money(order.totalPrice), true);

  y += 10;
  doc.fontSize(10).fillColor('#555').text(`Payment Method: ${order.paymentMethod?.toUpperCase()}`, 40, y);
  doc.text(`Payment Status: ${order.isPaid ? 'Paid' : 'Pending'}`, 40, y + 15);

  // QR code linking / encoding order number for quick lookup
  try {
    const qrBuffer = await generateQRPNG(`ORDER:${order.orderNumber}`);
    doc.image(qrBuffer, 480, y - 5, { width: 70 });
  } catch (e) { /* non-fatal */ }

  doc.fontSize(8).fillColor('#999').text('This is a computer-generated invoice and does not require a signature.', 40, 770, { align: 'center', width: 515 });

  doc.end();
};

/**
 * Streams a Flipkart-style shipping label PDF onto `res`.
 */
const generateShippingLabelPDF = async (order, label, stream) => {
  const doc = new PDFDocument({ size: 'A5', margin: 20 });
  doc.pipe(stream);

  doc.rect(15, 15, doc.page.width - 30, doc.page.height - 30).stroke('#000');

  doc.fontSize(16).fillColor('#be185d').text('MINIKI FASHION', 25, 25);
  doc.fontSize(8).fillColor('#000').text('www.minikifashion.com', 25, 45);

  doc.fontSize(9).text(`Order ID: ${order.orderNumber}`, 25, 65);
  doc.text(`Order Date: ${new Date(order.createdAt).toDateString()}`, 25, 78);
  doc.text(`Est. Delivery: ${order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toDateString() : '-'}`, 25, 91);
  doc.text(`Payment: ${order.paymentMethod?.toUpperCase()}${order.paymentMethod === 'cod' ? ` (${money(order.totalPrice)})` : ' (PAID)'}`, 25, 104);

  doc.strokeColor('#000').moveTo(20, 120).lineTo(doc.page.width - 20, 120).stroke();

  const addr = order.shippingAddress || {};
  doc.fontSize(11).fillColor('#000').text('DELIVER TO:', 25, 130);
  doc.fontSize(10).text(addr.fullName || '', 25, 145);
  doc.text(`Ph: ${addr.phone || ''}`, 25, 158);
  doc.text(`${addr.addressLine1 || ''} ${addr.addressLine2 || ''}`, 25, 171, { width: 250 });
  doc.text(`${addr.city || ''}, ${addr.state || ''}`, 25, 198);
  doc.fontSize(13).text(`PIN: ${addr.pincode || ''}`, 25, 213);

  // QR code (order + address payload)
  try {
    const qrBuffer = await generateQRPNG(JSON.stringify({ o: order.orderNumber, p: addr.pincode }));
    doc.image(qrBuffer, 320, 130, { width: 80 });
  } catch (e) { /* non-fatal */ }

  doc.strokeColor('#000').moveTo(20, 240).lineTo(doc.page.width - 20, 240).stroke();

  doc.fontSize(10).text('PRODUCTS:', 25, 250);
  let y = 264;
  (order.items || []).slice(0, 4).forEach((item) => {
    doc.fontSize(8).text(
      `${item.name} | ${item.variant?.size || '-'} / ${item.variant?.color || '-'} | Qty: ${item.quantity}`,
      25, y, { width: 380 }
    );
    y += 12;
  });

  doc.strokeColor('#000').moveTo(20, y + 5).lineTo(doc.page.width - 20, y + 5).stroke();
  y += 15;

  doc.fontSize(9).text(`Courier: ${label.courierName || 'Not Assigned'}`, 25, y);
  doc.text(`Weight: ${label.packageWeight || '0.5 kg'}`, 200, y);
  y += 15;
  doc.text(`Notes: ${label.shippingNotes || '-'}`, 25, y, { width: 350 });
  y += 20;

  try {
    const barcodeBuffer = await generateBarcodePNG(label.trackingNumber || label.labelNumber);
    doc.image(barcodeBuffer, 25, y, { width: 300, height: 60 });
  } catch (e) { /* non-fatal */ }

  doc.end();
};

module.exports = { generateInvoicePDF, generateShippingLabelPDF, generateQRPNG, generateBarcodePNG };
