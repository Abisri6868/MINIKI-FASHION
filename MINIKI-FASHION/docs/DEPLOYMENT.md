# Deployment Guide — MINIKI FASHION

## Backend (server)
1. Provision a MongoDB Atlas cluster and get the connection string.
2. Create a Cloudinary account for image storage.
3. Create a Razorpay account and generate live/test API keys.
4. Create an SMTP sender (Gmail App Password, SendGrid, Mailgun, etc.) for order/payment/shipping email notifications.
5. Set environment variables from `server/.env.example` on your host (Render, Railway, EC2, etc), including the `SMTP_*` variables.
6. Deploy: `npm install && npm start` (entry point `server.js`).
7. Point `CLIENT_URL` and `ADMIN_URL` env vars to your deployed frontend URLs for CORS.
8. The server runs a built-in cron job (`node-cron`, every 15 minutes) that automatically advances accepted orders through Processing → Packed → Shipped → Out for Delivery → Delivered based on each order's estimated delivery window. No extra process or external scheduler is required — it runs inside the same Node process, so make sure your host keeps the service alive (Render/Railway "Web Service" works fine; avoid serverless functions that sleep between requests for this feature).
9. Invoices and shipping labels are generated on-demand as PDFs (via `pdfkit`, `qrcode`, `bwip-js`) and streamed directly to the browser — no extra storage/cron needed for those.

## Client & Admin (Vite apps)
1. Set `VITE_API_URL` to your deployed API URL in each app's `.env`.
2. Build: `npm run build` — outputs static files to `dist/`.
3. Deploy `dist/` to Vercel, Netlify, or any static host.
4. For the admin panel, restrict access at the hosting layer if desired (e.g. separate subdomain like `admin.minikifashion.com`).

## Post-deploy checklist
- [ ] Run `node utils/seed.js` once against production DB to create categories & admin user.
- [ ] Change the default admin password immediately after first login.
- [ ] Switch Razorpay keys from test to live mode.
- [ ] Verify Cloudinary upload folder structure (`miniki-fashion/products`, `/categories`, `/reviews`).
- [ ] Enable HTTPS everywhere (required for Razorpay and secure cookies in production).
- [ ] Set real SMTP credentials — until then, emails are safely skipped (logged, not sent) rather than crashing any flow.
- [ ] In the Admin panel, open **Shipping Settings** and configure real delivery windows, shipping charges, free-shipping threshold, and COD availability before going live.
- [ ] Confirm the delivery-automation cron (`*/15 * * * *` in `server.js`) is running in your logs — you should see `[order-automation]` entries once orders are accepted.
