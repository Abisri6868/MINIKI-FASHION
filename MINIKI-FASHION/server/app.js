const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// 1. Fixed CORS Configuration
const allowedOrigins = [
  'https://miniki-fashion-yrij.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback allow
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle Preflight OPTIONS explicitly
app.options('*', cors());

// 2. Body Parser Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Folder for Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. API Routes
app.use('/api/auth', require('./routes/userRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));

// 4. Base Health Check Route
app.get('/', (req, res) => {
  res.send('MINIKI FASHION API is running successfully!');
});

// 5. Global Error Handling Middleware (CORS Header சேர்த்தே Error அனுப்புவது)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;