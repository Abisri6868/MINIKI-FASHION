const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

const recalculateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId, isApproved: true } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Product.findByIdAndUpdate(productId, {
    ratingsAverage: stats[0]?.avgRating || 0,
    ratingsCount: stats[0]?.count || 0,
  });
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, isApproved: true })
    .populate('user', 'name avatar')
    .sort('-createdAt');

  res.json({ success: true, count: reviews.length, reviews });
});

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { product, rating, title, comment, order } = req.body;

  const existing = await Review.findOne({ product, user: req.user._id });
  if (existing) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  let isVerifiedPurchase = false;
  if (order) {
    const userOrder = await Order.findOne({ _id: order, user: req.user._id, 'items.product': product, isDelivered: true });
    isVerifiedPurchase = !!userOrder;
  }

  let images = [];
  if (req.files && req.files.length > 0) {
    const uploads = req.files.map((f) => uploadToCloudinary(f.buffer, 'miniki-fashion/reviews'));
    images = await Promise.all(uploads);
  }

  const review = await Review.create({
    product,
    user: req.user._id,
    order: order || undefined,
    rating,
    title,
    comment,
    images,
    isVerifiedPurchase,
  });

  await recalculateProductRating(product);

  res.status(201).json({ success: true, message: 'Review submitted successfully', review });
});

// @desc    Update own review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  if (review.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to edit this review');
  }

  review.rating = req.body.rating ?? review.rating;
  review.title = req.body.title ?? review.title;
  review.comment = req.body.comment ?? review.comment;

  await review.save();
  await recalculateProductRating(review.product);

  res.json({ success: true, message: 'Review updated', review });
});

// @desc    Delete review (owner or admin)
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this review');
  }

  const productId = review.product;
  await review.deleteOne();
  await recalculateProductRating(productId);

  res.json({ success: true, message: 'Review deleted' });
});

module.exports = { getProductReviews, createReview, updateReview, deleteReview };
