const nodemailer = require('nodemailer');

// Lazily created so the app can still boot (and other features work) even if
// SMTP env vars aren't configured yet in a fresh deployment.
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[email] SMTP not configured — emails will be skipped. Set SMTP_HOST/SMTP_USER/SMTP_PASS.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

module.exports = getTransporter;
