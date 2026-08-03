const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductByIdOrSlug,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  createProduct,
  updateProduct,
  deleteProductImage,
  deleteProduct,
  updateStock,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', getProducts);
router.get('/collections/featured', getFeaturedProducts);
router.get('/collections/new-arrivals', getNewArrivals);
router.get('/collections/best-sellers', getBestSellers);
router.get('/:idOrSlug', getProductByIdOrSlug);

router.post('/', protect, admin, upload.array('images', 8), createProduct);
router.put('/:id', protect, admin, upload.array('images', 8), updateProduct);
router.delete('/:id/images/:public_id', protect, admin, deleteProductImage);
router.delete('/:id', protect, admin, deleteProduct);
router.patch('/:id/stock', protect, admin, updateStock);

module.exports = router;
