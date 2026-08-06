const mongoose = require('mongoose');
const dns = require('dns');

// Force Node's resolver to use public DNS servers that reliably support
// SRV record lookups. Many router/ISP/VPN DNS servers silently reject
// SRV queries, which is why `nslookup`/`ping` succeed (different resolver
// path) while Mongoose's querySrv() fails with ECONNREFUSED.
dns.setServers([
  '8.8.8.8',   // Google DNS
  '1.1.1.1',   // Cloudflare DNS
]);

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in your .env file');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);

    // Extra guidance for the exact SRV DNS failure
    if (error.message.includes('querySrv') || error.code === 'ECONNREFUSED') {
      console.error(
        '\nTip: This is usually a DNS resolver issue, not a code issue.\n' +
        '1. Confirm your Atlas connection string is the SRV string from ' +
        'Atlas > Connect > Drivers (starts with mongodb+srv://).\n' +
        '2. Confirm your current IP is whitelisted in Atlas > Network Access.\n' +
        '3. If on a VPN/corporate/school network, try disabling it and retry.\n' +
        '4. As a fallback, use the non-SRV standard connection string from ' +
        'Atlas (Connect > Drivers > "Standard connection string") instead ' +
        'of mongodb+srv://.\n'
      );
    }

    process.exit(1);
  }
};

module.exports = connectDB;