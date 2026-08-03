# MINIKI FASHION — API Reference

Base URL: `http://localhost:5000/api`

All protected routes require an `Authorization: Bearer <token>` header (or the `token` HTTP-only cookie set at login).

## Auth — `/auth`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register a new customer |
| POST | `/login` | Public | Customer login |
| POST | `/admin/login` | Public | Admin login |
| POST | `/logout` | Private | Logout |
| GET | `/me` | Private | Get current user |
| PUT | `/profile` | Private | Update name/phone/password |
| POST | `/address` | Private | Add address |
| PUT | `/address/:addressId` | Private | Update address |
| DELETE | `/address/:addressId` | Private | Delete address |

## Products — `/products`
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List/search/filter/paginate products |
| GET | `/collections/featured` | Public | Featured products |
| GET | `/collections/new-arrivals` | Public | New arrivals |
| GET | `/collections/best-sellers` | Public | Best sellers |
| GET | `/:idOrSlug` | Public | Product details + related products |
| POST | `/` | Admin | Create product (multipart, `images[]`) |
| PUT | `/:id` | Admin | Update product |
| DELETE | `/:id/images/:public_id` | Admin | Remove single image |
| DELETE | `/:id` | Admin | Delete product |
| PATCH | `/:id/stock` | Admin | Update stock/variants |

## Categories — `/categories`
GET `/`, GET `/:idOrSlug`, POST `/` (admin), PUT `/:id` (admin), DELETE `/:id` (admin)

## Orders — `/orders`
POST `/` (create), GET `/my-orders`, GET `/:id`, PUT `/:id/cancel`,
GET `/` (admin list), PUT `/:id/status` (admin), GET `/stats/dashboard` (admin)

## Reviews — `/reviews`
GET `/product/:productId`, POST `/` (multipart, `images[]`), PUT `/:id`, DELETE `/:id`

## Coupons — `/coupons`
POST `/apply`, GET `/` (admin), POST `/` (admin), PUT `/:id` (admin), DELETE `/:id` (admin)

## Wishlist — `/wishlist`
GET `/`, POST `/:productId`, DELETE `/:productId`

## Cart — `/cart`
GET `/`, POST `/`, PUT `/:itemId`, DELETE `/:itemId`, DELETE `/`

## Payment — `/payment`
POST `/create-order` (creates Razorpay order), POST `/verify` (verifies signature)

## Users (Admin) — `/users`
GET `/`, GET `/:id`, PUT `/:id/status`
