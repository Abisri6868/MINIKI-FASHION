const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');

const categories = [
  { name: 'Bridal Wear', description: 'Exquisite bridal collections for your special day', isFeatured: true, sortOrder: 1 },
  { name: 'Sarees', description: 'Elegant sarees for every occasion', isFeatured: true, sortOrder: 2 },
  { name: 'Kurtis', description: 'Stylish and comfortable kurtis', isFeatured: true, sortOrder: 3 },
  { name: 'Feeding Wear', description: 'Comfortable nursing-friendly wear', isFeatured: true, sortOrder: 4 },
  { name: 'Maternity Wear', description: 'Elegant and comfortable maternity fashion', isFeatured: true, sortOrder: 5 },
  { name: 'Kids Wear', description: 'Adorable outfits for little ones', isFeatured: true, sortOrder: 6 },
  { name: 'New Born Collection', description: 'Soft and gentle newborn essentials', isFeatured: true, sortOrder: 7 },
  { name: 'Bridal Jewellery', description: 'Stunning jewellery to complete your bridal look', isFeatured: false, sortOrder: 8 },
  { name: 'Rental Lehengas', description: 'Designer lehengas available for rent', isFeatured: true, sortOrder: 9 },
  { name: 'Groom Coat Suits', description: 'Sharp coat suits for the groom', isFeatured: false, sortOrder: 10 },
  { name: 'Aari Work', description: 'Intricate hand-crafted Aari embroidery', isFeatured: false, sortOrder: 11 },
  { name: 'Customized Stitching', description: 'Made-to-measure custom tailoring', isFeatured: false, sortOrder: 12 },
];

const seed = async () => {
  try {
    await connectDB();

    await Category.deleteMany({});
    await Category.insertMany(categories);
    console.log(`Seeded ${categories.length} categories`);

    const adminExists = await User.findOne({ email: 'admin@minikifashion.com' });
    if (!adminExists) {
      await User.create({
        name: 'MINIKI FASHION Admin',
        email: 'admin@minikifashion.com',
        password: 'Admin@123',
        role: 'admin',
        phone: '9999999999',
      });
      console.log('Admin user created -> email: admin@minikifashion.com | password: Admin@123');
    } else {
      console.log('Admin user already exists');
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
