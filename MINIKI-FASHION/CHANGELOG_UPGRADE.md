# MINIKI FASHION — Upgrade Changelog (Production-Ready Order/Shipping/Payments System)

This upgrade extends the existing MERN project **in place** — no existing pages, APIs,
authentication, database collections, or components were removed. Everything below is additive.

## New Database Collections
`ShippingSettings`, `ContactMessage`, `Notification`, `Payment`, `Refund`, `Invoice`, `ShippingLabel`

## Product Management
- Multiple images per product (unchanged, already existed) **plus** new per-color image galleries
  (`colorImages`) — selecting a color on the storefront automatically swaps to that color's images,
  falling back to the default gallery for products that don't have color-specific images yet.
- Admin can upload/delete color-specific images independently of the default gallery.
- Size × Color variant stock matrix (already existed, preserved as-is).

## Order Workflow & Automation
- New orders start as `Pending Approval`. Admin **Accept**/**Reject** from the Orders page.
- On accept: order enters `Processing` and a delivery estimate is calculated from Admin Shipping
  Settings (+ any pincode-specific rule).
- A background job (`node-cron`, every 15 minutes, started in `server.js`) automatically advances
  accepted orders through `Processing → Packed → Shipped → Out for Delivery → Delivered`, pacing
  each stage against the order's estimated delivery window, and force-completes on the estimated date.
- Full tracking history with timestamps is stored on every order and rendered as a timeline on both
  the customer Orders page and the admin Orders page.
- Cancel-before-shipping still works for both customers and admins; paid orders automatically get a
  `Refund` record with status `Pending`.
- Reorder: re-adds a past order's items to the cart (skips items that are no longer active).

## Shipping
- Admin **Shipping Settings** page: standard/express delivery windows, shipping charges, free-shipping
  threshold, COD availability + surcharge, and per-pincode overrides (serviceable / COD / extra days).
- Estimated delivery date is shown on the Product page (pincode checker), Checkout, and Orders.

## Invoices & Shipping Labels
- Invoice PDF generated on demand (`GET /api/invoices/:orderId`) with itemized pricing and a QR code.
- Shipping label PDF generated on demand (`GET /api/shipping-labels/:orderId`, admin only) with
  company branding, delivery address, QR code, and a scannable Code128 barcode — styled after a
  Flipkart-style label. Courier/tracking/notes can be edited before printing.

## Payments (Razorpay)
- Existing create-order/verify-signature flow preserved.
- Added: retry payment for failed/unpaid orders, payment history, and an admin refund workflow that
  attempts a live Razorpay refund when a captured payment id is available and otherwise leaves the
  refund in `Pending` for manual processing.

## Email Notifications
- Nodemailer-based email service sends on: order placed, order accepted, order cancelled, payment
  success/failed, every status change, invoice generated, and refund initiated.
- Safe by design: if `SMTP_*` env vars aren't set, emails are skipped with a console log instead of
  crashing any request — nothing else in the app depends on email succeeding.

## Contact Messages
- Public contact form now persists to MongoDB (previously UI-only).
- Admin **Messages** inbox: search, unread count, reply (emails the customer), mark read, delete.

## Notifications
- In-app notification bell (customer navbar + admin) backed by the new `Notification` collection,
  created alongside every major order/payment/shipping/contact event.

## Admin Dashboard
- Added: today's orders, monthly revenue, COD vs. online-paid counts, pending payments, low-stock
  product alerts, customer growth chart, orders-by-status breakdown (on top of the existing revenue
  trend and top-products charts).

## What still needs real credentials before going live
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — test keys work for development; switch to live keys
  for production charges and refunds.
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` — without these, email sending
  is safely skipped (logged only).
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — required for any image
  upload (product images, color galleries, review images).
- After deploying, open **Admin → Shipping Settings** once to set real delivery windows and charges
  (sensible defaults are seeded automatically on first read).

## Verified before packaging
- `node --check` passed on every server file; `node -e "require('./app')"` loads all 15 route
  modules with no errors; a live server instance booted and responded on `/api/health`.
- Invoice and shipping-label PDF generation were run end-to-end and produced valid PDFs with working
  QR codes and barcodes.
- `npm run build` succeeded with 0 errors on both `admin/` and `client/`.
