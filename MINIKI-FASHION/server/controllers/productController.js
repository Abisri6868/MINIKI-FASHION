const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const ApiFeatures = require('../utils/apiFeatures');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');

// @desc    Get all products (search, filter, sort, paginate)
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const filterQuery = { isActive: true, ...req.query };

  const countFeatures = new ApiFeatures(Product.find({ isActive: true }), req.query).search().filter();
  const total = await countFeatures.query.clone().countDocuments();

  const features = new ApiFeatures(Product.find({ isActive: true }), req.query)
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const products = await features.query.populate('category', 'name slug');

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;

  res.json({
    success: true,
    count: products.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    products,
  });
});

// @desc    Get single product by slug or id
// @route   GET /api/products/:idOrSlug
// @access  Public
const getProductByIdOrSlug = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const isObjectId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);

  const product = await Product.findOne(
    isObjectId ? { _id: idOrSlug } : { slug: idOrSlug }
  ).populate('category', 'name slug');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const relatedProducts = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
  }).limit(4);

  res.json({ success: true, product, relatedProducts });
});

// @desc    Get featured products
// @route   GET /api/products/collections/featured
// @access  Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true, isActive: true })
    .populate('category', 'name slug')
    .limit(8);
  res.json({ success: true, products });
});

// @desc    Get new arrivals
// @route   GET /api/products/collections/new-arrivals
// @access  Public
const getNewArrivals = asyncHandler(async (req, res) => {
  const products = await Product.find({ isNewArrival: true, isActive: true })
    .populate('category', 'name slug')
    .sort('-createdAt')
    .limit(8);
  res.json({ success: true, products });
});

// @desc    Get best sellers
// @route   GET /api/products/collections/best-sellers
// @access  Public
const getBestSellers = asyncHandler(async (req, res) => {
  const products = await Product.find({ isBestSeller: true, isActive: true })
    .populate('category', 'name slug')
    .limit(8);
  res.json({ success: true, products });
});

// @desc    Create product (Admin)
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const body = { ...req.body };

  ['sizes', 'colors', 'tags', 'variants'].forEach((field) => {
    if (typeof body[field] === 'string') {
      try {
        body[field] = JSON.parse(body[field]);
      } catch (e) {
        body[field] = body[field].split(',').map((s) => s.trim());
      }
    }
  });

  let images = [];
  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer, 'miniki-fashion/products'));
    images = await Promise.all(uploadPromises);
  }

  const product = await Product.create({ ...body, images });

  res.status(201).json({ success: true, message: 'Product created successfully', product });
});

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const body = { ...req.body };
  ['sizes', 'colors', 'tags', 'variants'].forEach((field) => {
    if (typeof body[field] === 'string') {
      try {
        body[field] = JSON.parse(body[field]);
      } catch (e) {
        body[field] = body[field].split(',').map((s) => s.trim());
      }
    }
  });

  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer, 'miniki-fashion/products'));
    const newImages = await Promise.all(uploadPromises);
    body.images = [...(product.images || []), ...newImages];
  }

  Object.assign(product, body);
  await product.save();

  res.json({ success: true, message: 'Product updated successfully', product });
});

// @desc    Delete a single image from a product (Admin)
// @route   DELETE /api/products/:id/images/:public_id
// @access  Private/Admin
const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const publicId = decodeURIComponent(req.params.public_id);
  product.images = product.images.filter((img) => img.public_id !== publicId);
  await product.save();
  await deleteFromCloudinary(publicId);

  res.json({ success: true, message: 'Image removed', product });
});

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  for (const img of product.images) {
    await deleteFromCloudinary(img.public_id);
  }

  await product.deleteOne();

  res.json({ success: true, message: 'Product deleted successfully' });
});

// @desc    Update stock quantity (Admin)
// @route   PATCH /api/products/:id/stock
// @access  Private/Admin
const updateStock = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (req.body.variants) {
    product.variants = req.body.variants;
  } else if (typeof req.body.totalStock === 'number') {
    product.totalStock = req.body.totalStock;
  }

  await product.save();

  res.json({ success: true, message: 'Stock updated successfully', product });
});

module.exports = {
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
};
