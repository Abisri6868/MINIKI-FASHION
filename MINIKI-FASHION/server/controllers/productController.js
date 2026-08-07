const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const ApiFeatures = require('../utils/apiFeatures');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');

// req.files (from upload.any()) can contain the default gallery under
// fieldname "images" AND per-color galleries under fieldname "color_<ColorName>".
// This uploads everything to Cloudinary and returns { images, colorImagesByName }.
const processUploadedFiles = async (files = []) => {
  const images = [];
  const colorImagesByName = {}; // { Red: [{url,public_id,type}], ... }

  const grouped = {};
  for (const file of files) {
    grouped[file.fieldname] = grouped[file.fieldname] || [];
    grouped[file.fieldname].push(file);
  }

  for (const [fieldname, fieldFiles] of Object.entries(grouped)) {
    const uploaded = await Promise.all(
      fieldFiles.map((file) => uploadToCloudinary(file.buffer, 'miniki-fashion/products'))
    );

    if (fieldname === 'images') {
      images.push(...uploaded);
    } else if (fieldname.startsWith('color_')) {
      const colorName = decodeURIComponent(fieldname.replace('color_', ''));
      colorImagesByName[colorName] = colorImagesByName[colorName] || [];
      colorImagesByName[colorName].push(...uploaded);
    }
  }

  return { images, colorImagesByName };
};

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

  ['sizes', 'colors', 'tags', 'variants', 'colorImages'].forEach((field) => {
    if (typeof body[field] === 'string') {
      try {
        body[field] = JSON.parse(body[field]);
      } catch (e) {
        body[field] = body[field].split(',').map((s) => s.trim());
      }
    }
  });

  let images = [];
  let colorImages = Array.isArray(body.colorImages) ? body.colorImages : [];
  delete body.colorImages;

  if (req.files && req.files.length > 0) {
    const { images: uploadedImages, colorImagesByName } = await processUploadedFiles(req.files);
    images = uploadedImages;

    Object.entries(colorImagesByName).forEach(([color, imgs]) => {
      const existing = colorImages.find((c) => c.color === color);
      if (existing) {
        existing.images = [...(existing.images || []), ...imgs];
      } else {
        colorImages.push({ color, images: imgs });
      }
    });
  }

  const product = await Product.create({ ...body, images, colorImages });

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
  ['sizes', 'colors', 'tags', 'variants', 'colorImages'].forEach((field) => {
    if (typeof body[field] === 'string') {
      try {
        body[field] = JSON.parse(body[field]);
      } catch (e) {
        body[field] = body[field].split(',').map((s) => s.trim());
      }
    }
  });

  // If the client sent an updated colorImages array (e.g. after reordering or
  // removing images client-side), use it as the new base before merging uploads.
  let colorImages = Array.isArray(body.colorImages) ? body.colorImages : (product.colorImages || []);
  delete body.colorImages;

  if (req.files && req.files.length > 0) {
    const { images: uploadedImages, colorImagesByName } = await processUploadedFiles(req.files);
    if (uploadedImages.length > 0) {
      body.images = [...(product.images || []), ...uploadedImages];
    }
    Object.entries(colorImagesByName).forEach(([color, imgs]) => {
      const existing = colorImages.find((c) => c.color === color);
      if (existing) {
        existing.images = [...(existing.images || []), ...imgs];
      } else {
        colorImages.push({ color, images: imgs });
      }
    });
  }
  body.colorImages = colorImages;

  Object.assign(product, body);
  await product.save();

  res.json({ success: true, message: 'Product updated successfully', product });
});

// @desc    Delete a single image from a product's default gallery (Admin)
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

// @desc    Delete a single image from a color-specific gallery (Admin)
// @route   DELETE /api/products/:id/color-images/:color/:public_id
// @access  Private/Admin
const deleteColorImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const color = decodeURIComponent(req.params.color);
  const publicId = decodeURIComponent(req.params.public_id);

  const colorGroup = product.colorImages.find((c) => c.color === color);
  if (colorGroup) {
    colorGroup.images = colorGroup.images.filter((img) => img.public_id !== publicId);
    // Drop the whole color group if it's now empty
    if (colorGroup.images.length === 0) {
      product.colorImages = product.colorImages.filter((c) => c.color !== color);
    }
  }
  await product.save();
  await deleteFromCloudinary(publicId);

  res.json({ success: true, message: 'Color image removed', product });
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
  for (const group of product.colorImages || []) {
    for (const img of group.images) {
      await deleteFromCloudinary(img.public_id);
    }
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
  deleteColorImage,
  deleteProduct,
  updateStock,
};
