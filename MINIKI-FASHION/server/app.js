const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const cartRoutes = require('./routes/cartRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// ==========================
// 1. Trust Proxy (RAILWAY FIX)
// ==========================
// Railway reverse proxy valiya varura HTTPS requests & Cookies work aaga ithu kattayam venum
app.enable('trust proxy'); 

// ==========================
// Security
// ==========================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ==========================
// 2. Updated CORS Configuration
// ==========================
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  "http://localhost:5173",
  "http://localhost:3000"
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Postman, Mobile apps, or allowed origins-ku permission tharom
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS Not Allowed'));
    },
    credentials: true, // Cookies cross-origin send aaga ithu venum
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// NOTE: Manual OPTIONS app.use() & app.options() rendeyum thookiyaachu! 
// cors() package automatic-a handle pannikkum.

// ==========================
// Body Parser
// ==========================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ==========================
// Logger
// ==========================
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ==========================
// Rate Limiter
// ==========================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS"
});

app.use("/api", apiLimiter);

// ==========================
// Health Check
// ==========================
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MINIKI FASHION API is running",
    timestamp: new Date().toISOString()
  });
});

// ==========================
// Routes
// ==========================
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/users", userRoutes);

// ==========================
// Error Handler
// ==========================
app.use(notFound);
app.use(errorHandler);

module.exports = app;