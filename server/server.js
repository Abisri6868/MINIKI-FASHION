const dotenv = require('dotenv');
dotenv.config();

const cron = require('node-cron');
const app = require('./app');
const connectDB = require('./config/db');
const { runAutoProgress } = require('./controllers/orderController');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`MINIKI FASHION API server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Order Delivery Automation: every 15 minutes, auto-advance accepted orders
  // through Processing -> Packed -> Shipped -> Out for Delivery -> Delivered
  // based on elapsed time vs. the order's estimated delivery window.
  cron.schedule('*/15 * * * *', async () => {
    try {
      const result = await runAutoProgress();
      if (result.advanced > 0) {
        console.log(`[order-automation] Advanced ${result.advanced}/${result.checked} order(s)`);
      }
    } catch (err) {
      console.error('[order-automation] Error:', err.message);
    }
  });
});

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});
