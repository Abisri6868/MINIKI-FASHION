# MINIKI FASHION — Full Stack E-Commerce Platform

**Tagline:** Designer Boutique | Women's Wear, College Wear, Maternity, New Born & Bridal Jewellery Shop


A production-ready MERN e-commerce platform for MINIKI FASHION, featuring a customer storefront, an admin panel, and a REST API backend.

## Tech Stack
- **Frontend (Client & Admin):** React.js (Vite), Tailwind CSS, React Router, Axios, Context API
- **Backend:** Node.js, Express.js, MongoDB (Mongoose)
- **Auth:** JWT (HTTP-only cookies + Bearer tokens)
- **Media:** Cloudinary
- **Payments:** Razorpay

## Project Structure
```
MINIKI-FASHION/
├── client/     # Customer-facing storefront (React + Vite)
├── server/     # Express REST API + MongoDB
├── admin/      # Admin dashboard (React + Vite)
├── docs/       # Additional documentation
└── package.json
```

## Getting Started

### 1. Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account
- Razorpay account (test keys are fine for development)

### 2. Install dependencies
```bash
npm run install:all
```

### 3. Configure environment variables
Copy `server/.env.example` to `server/.env` and fill in your values:
```bash
cp server/.env.example server/.env
```

Copy `client/.env.example` to `client/.env` and `admin/.env.example` to `admin/.env`.

### 4. Seed the database (optional but recommended)
```bash
cd server
node utils/seed.js
```
This creates the 12 MINIKI FASHION categories and an admin user:
- Email: `admin@minikifashion.com`
- Password: `Admin@123`

### 5. Run the app (all three apps concurrently)
```bash
npm run dev
```
- Client (storefront): http://localhost:5173
- Admin panel: http://localhost:5174
- API server: http://localhost:5000

## Core Features

### Customer
Search, filter, wishlist, cart, buy now, Razorpay checkout, order tracking, order history, reviews, profile management.

### Admin
Secure login, product CRUD with multi-image Cloudinary upload, category management, order management & status updates, customer management, sales dashboard, stock updates, coupon/offer management.

## API Overview
| Module | Base Route |
|---|---|
| Auth | `/api/auth` |
| Products | `/api/products` |
| Categories | `/api/categories` |
| Orders | `/api/orders` |
| Reviews | `/api/reviews` |
| Coupons | `/api/coupons` |
| Wishlist | `/api/wishlist` |
| Cart | `/api/cart` |
| Payment | `/api/payment` |

## Brand
**MINIKI FASHION** — Bridal Wear, Sarees, tis, Feeding Wear, Maternity Wear, Kids Wear, New Born Collection, Bridal Jewellery, Rental Lehengas, Groom Coat Suits, Aari Work, Customized Stitching.

Theme: Luxury Boutique — Pink / White / Gold.

## License
Proprietary — © MINIKI FASHION.
