const express = require('express');
const router = express.Router();
const { getUsers, getUserById, toggleUserStatus } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect, admin);
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id/status', toggleUserStatus);

module.exports = router;