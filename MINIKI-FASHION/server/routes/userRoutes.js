const express = require('express');
const router = express.Router();

// 1. Controller-ல் இருந்து adminLogin-ஐயும் சேர்த்து Import செய்கிறோம்
const { 
  getUsers, 
  getUserById, 
  toggleUserStatus, 
  adminLogin 
} = require('../controllers/userController');

const { protect, admin } = require('../middleware/authMiddleware');

// 2. PUBLIC ROUTE: Admin Login (இதற்கு protect / admin middleware தேவையில்லை!)
router.post('/admin/login', adminLogin);

// 3. PROTECTED ROUTES: Login செய்த பிறகு மட்டுமே Access செய்ய முடியும்
router.use(protect, admin);
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id/status', toggleUserStatus);

module.exports = router;