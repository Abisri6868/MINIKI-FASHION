const getTransporter = require('../config/email');

const FROM = process.env.SMTP_FROM || 'MINIKI FASHION <no-reply@minikifashion.com>';

const baseLayout = (title, bodyHtml) => `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; color:#333;">
  <div style="background:#be185d; padding: 24px; text-align:center;">
    <h1 style="color:#fff; margin:0; font-size:22px; letter-spacing:1px;">MINIKI FASHION</h1>
  </div>
  <div style="padding: 24px; background:#fff;">
    <h2 style="color:#be185d; font-size:18px;">${title}</h2>
    ${bodyHtml}
  </div>
  <div style="padding: 16px; text-align:center; background:#f9fafb; color:#9ca3af; font-size:12px;">
    © ${new Date().getFullYear()} MINIKI FASHION. All rights reserved.
  </div>
</div>`;

/**
 * Sends an email. Silently no-ops (with a console log) if SMTP isn't configured,
 * so this never blocks or crashes the order/payment flow it's called from.
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = getTransporter();
    if (!transporter || !to) {
      console.log(`[email] Skipped "${subject}" to ${to || 'unknown'} (SMTP not configured or no recipient)`);
      return { skipped: true };
    }
    await transporter.sendMail({ from: FROM, to, subject, html });
    return { success: true };
  } catch (err) {
    console.error('[email] Failed to send:', err.message);
    return { success: false, error: err.message };
  }
};

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const templates = {
  orderPlaced: (order) => ({
    subject: `Order Received - #${order.orderNumber}`,
    html: baseLayout('Thank you for your order!', `
      <p>Hi ${order.shippingAddress?.fullName || 'there'},</p>
      <p>We've received your order <b>#${order.orderNumber}</b> and it's awaiting confirmation from our team.</p>
      <p>Order Total: <b>${money(order.totalPrice)}</b></p>
      <p>We'll email you as soon as it's accepted.</p>`),
  }),
  orderAccepted: (order) => ({
    subject: `Order Confirmed - #${order.orderNumber}`,
    html: baseLayout('Your order is confirmed!', `
      <p>Great news! Your order <b>#${order.orderNumber}</b> has been accepted and is now being processed.</p>
      <p>Estimated Delivery: <b>${order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toDateString() : 'TBD'}</b></p>`),
  }),
  orderCancelled: (order) => ({
    subject: `Order Cancelled - #${order.orderNumber}`,
    html: baseLayout('Your order has been cancelled', `
      <p>Your order <b>#${order.orderNumber}</b> has been cancelled.</p>
      <p>Reason: ${order.cancelReason || 'Not specified'}</p>
      ${order.isPaid ? '<p>If payment was completed, your refund has been marked as <b>Pending</b> and will be processed shortly.</p>' : ''}`),
  }),
  paymentSuccess: (order) => ({
    subject: `Payment Successful - #${order.orderNumber}`,
    html: baseLayout('Payment received', `<p>We've received your payment of <b>${money(order.totalPrice)}</b> for order <b>#${order.orderNumber}</b>.</p>`),
  }),
  paymentFailed: (order) => ({
    subject: `Payment Failed - #${order.orderNumber}`,
    html: baseLayout('Payment failed', `<p>Your payment for order <b>#${order.orderNumber}</b> could not be processed. You can retry from your Orders page.</p>`),
  }),
  statusUpdate: (order, status) => ({
    subject: `Order Update: ${status} - #${order.orderNumber}`,
    html: baseLayout(`Your order is now: ${status}`, `<p>Order <b>#${order.orderNumber}</b> status has been updated to <b>${status}</b>.</p>`),
  }),
  invoiceGenerated: (order) => ({
    subject: `Invoice Ready - #${order.orderNumber}`,
    html: baseLayout('Your invoice is ready', `<p>The invoice for order <b>#${order.orderNumber}</b> has been generated and can be downloaded from your Orders page.</p>`),
  }),
  refundInitiated: (order, amount) => ({
    subject: `Refund Initiated - #${order.orderNumber}`,
    html: baseLayout('Refund initiated', `<p>A refund of <b>${money(amount)}</b> has been initiated for order <b>#${order.orderNumber}</b>.</p>`),
  }),
};

const sendOrderEmail = async (type, order, extra) => {
  const user = order.user;
  const to = order.shippingAddress?.email || user?.email || user;
  const tpl = templates[type];
  if (!tpl) return;
  const { subject, html } = tpl(order, extra);
  return sendEmail({ to, subject, html });
};

module.exports = { sendEmail, sendOrderEmail, templates };
