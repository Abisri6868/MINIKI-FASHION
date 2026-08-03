# Deployment Guide — MINIKI FASHION

## Backend (server)
1. Provision a MongoDB Atlas cluster and get the connection string.
2. Create a Cloudinary account for image storage.
3. Create a Razorpay account and generate live/test API keys.
4. Set environment variables from `server/.env.example` on your host (Render, Railway, EC2, etc).
5. Deploy: `npm install && npm start` (entry point `server.js`).
6. Point `CLIENT_URL` and `ADMIN_URL` env vars to your deployed frontend URLs for CORS.

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
