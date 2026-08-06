require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const exists = await User.findOne({ email: 'admin@miniki.com' });

    if (exists) {
      console.log('Admin already exists');
      process.exit();
    }

    await User.create({
      name: 'Admin',
      email: 'admin@miniki.com',
      password: 'Admin@123',
      role: 'admin',
      isVerified: true,
      isActive: true
    });

    console.log('✅ Admin created successfully');
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });