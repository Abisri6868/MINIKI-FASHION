const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { isActive: true };
  const categories = await Category.find(filter).sort('sortOrder name');
  res.json({ success: true, count: categories.length, categories });
});

// @desc    Get single category with its products
// @route   GET /api/categories/:idOrSlug
// @access  Public
const getCategoryByIdOrSlug = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const isObjectId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);

  const category = await Category.findOne(isObjectId ? { _id: idOrSlug } : { slug: idOrSlug });

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  res.json({ success: true, category });
});

// @desc    Create category (Admin)
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  let image = { url: '', public_id: '' };

  if (req.file) {
    image = await uploadToCloudinary(req.file.buffer, 'miniki-fashion/categories');
  }

  const category = await Category.create({ ...req.body, image });

  res.status(201).json({ success: true, message: 'Category created successfully', category });
});

// @desc    Update category (Admin)
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  if (req.file) {
    if (category.image?.public_id) {
      await deleteFromCloudinary(category.image.public_id);
    }
    category.image = await uploadToCloudinary(req.file.buffer, 'miniki-fashion/categories');
  }

  Object.assign(category, req.body);
  await category.save();

  res.json({ success: true, message: 'Category updated successfully', category });
});

// @desc    Delete category (Admin)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    res.status(400);
    throw new Error(`Cannot delete category with ${productCount} associated products. Reassign or delete them first.`);
  }

  if (category.image?.public_id) {
    await deleteFromCloudinary(category.image.public_id);
  }

  await category.deleteOne();

  res.json({ success: true, message: 'Category deleted successfully' });
});

module.exports = {
  getCategories,
  getCategoryByIdOrSlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
