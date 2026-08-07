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
  deleteColorImage,
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

// upload.any() accepts both the default "images" field and dynamic
// "color_<ColorName>" fields for per-color galleries in one multipart request.
router.post('/', protect, admin, upload.any(), createProduct);
router.put('/:id', protect, admin, upload.any(), updateProduct);
router.delete('/:id/images/:public_id', protect, admin, deleteProductImage);
router.delete('/:id/color-images/:color/:public_id', protect, admin, deleteColorImage);
router.delete('/:id', protect, admin, deleteProduct);
router.patch('/:id/stock', protect, admin, updateStock);

module.exports = router;
