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
// 1. Trust Proxy (RAILWAY)
// ==========================
app.set('trust proxy', 1);

// ==========================
// Security
// ==========================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ==========================
// 2. CORS Configuration
// ==========================
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  "https://miniki-fashion-yrij.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174"
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS Not Allowed'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// HARD BYPASS FOR PREFLIGHT (Rate limiter-ku munnadiye handle pannidum)
app.options('*', cors(corsOptions));

// ==========================
// Body Parser & Cookies
// ==========================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ==========================
// 3. Rate Limiter (Only for POST, GET, etc.)
// ==========================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Limit increased
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || req.ip;
  }
});

// Middleware to skip OPTIONS completely from rate limiting
app.use("/api", (req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return apiLimiter(req, res, next);
});

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