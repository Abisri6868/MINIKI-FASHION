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
| POST | `/` | Admin | Create product (multipart: `images[]` for default gallery, `color_<ColorName>[]` for per-color galleries) |
| PUT | `/:id` | Admin | Update product (same multipart fields) |
| DELETE | `/:id/images/:public_id` | Admin | Remove single image from default gallery |
| DELETE | `/:id/color-images/:color/:public_id` | Admin | Remove single image from a color-specific gallery |
| DELETE | `/:id` | Admin | Delete product |
| PATCH | `/:id/stock` | Admin | Update stock/variants |

## Categories — `/categories`
GET `/`, GET `/:idOrSlug`, POST `/` (admin), PUT `/:id` (admin), DELETE `/:id` (admin)

## Orders — `/orders`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/` | Private | Place an order (starts as `Pending Approval`) |
| GET | `/my-orders` | Private | Customer's order history |
| GET | `/:id` | Private | Order details (owner or admin) |
| PUT | `/:id/cancel` | Private | Cancel order (owner or admin, pre-shipping only) |
| POST | `/:id/reorder` | Private | Re-add a past order's items to the cart |
| GET | `/` | Admin | List all orders (filter/search/paginate) |
| PUT | `/:id/accept` | Admin | Accept a pending order — starts the Processing → Delivered pipeline |
| PUT | `/:id/reject` | Admin | Reject/cancel a pending order |
| PUT | `/:id/status` | Admin | Manually set order status |
| POST | `/auto-progress` | Admin | Manually trigger the delivery-automation sweep (also runs on a 15-min cron) |
| GET | `/stats/dashboard` | Admin | Dashboard analytics (revenue, orders, low stock, charts) |

## Reviews — `/reviews`
GET `/product/:productId`, POST `/` (multipart, `images[]`), PUT `/:id`, DELETE `/:id`

## Coupons — `/coupons`
POST `/apply`, GET `/` (admin), POST `/` (admin), PUT `/:id` (admin), DELETE `/:id` (admin)

## Wishlist — `/wishlist`
GET `/`, POST `/:productId`, DELETE `/:productId`

## Cart — `/cart`
GET `/`, POST `/`, PUT `/:itemId`, DELETE `/:itemId`, DELETE `/`

## Payment — `/payment`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/create-order` | Private | Create a Razorpay order |
| POST | `/verify` | Private | Verify Razorpay payment signature |
| POST | `/retry/:orderId` | Private | Issue a fresh Razorpay order for a retry |
| PUT | `/confirm/:orderId` | Private | Confirm a retried payment |
| GET | `/history` | Private | Customer's payment history |
| POST | `/refund/:orderId` | Admin | Initiate a refund (attempts live Razorpay refund, falls back to Pending) |
| GET | `/refunds` | Admin | List all refunds |

## Shipping Settings — `/shipping-settings`
GET `/` (public), GET `/estimate?pincode=&method=` (public), PUT `/` (admin),
POST `/pincode` (admin, add/update pincode rule), DELETE `/pincode/:pincode` (admin)

## Contact — `/contact`
POST `/` (public, submit message), GET `/` (admin, list + search), PUT `/:id/read` (admin),
POST `/:id/reply` (admin, emails the customer), DELETE `/:id` (admin)

## Notifications — `/notifications`
GET `/`, PUT `/read-all`, PUT `/:id/read`

## Invoices — `/invoices`
GET `/:orderId` — generates (or fetches) the invoice PDF for an order and streams it (owner or admin)

## Shipping Labels — `/shipping-labels`
GET `/:orderId` (admin, streams a Flipkart-style PDF label with QR + barcode), PUT `/:orderId` (admin, set courier/tracking/notes)

## Users (Admin) — `/users`
GET `/`, GET `/:id`, PUT `/:id/status`
