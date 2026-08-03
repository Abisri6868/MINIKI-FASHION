const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'wishlist',
    populate: { path: 'category', select: 'name slug' },
  });

  res.json({ success: true, wishlist: user.wishlist });
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.wishlist.includes(req.params.productId)) {
    res.status(400);
    throw new Error('Product already in wishlist');
  }

  user.wishlist.push(req.params.productId);
  await user.save();

  res.status(201).json({ success: true, message: 'Added to wishlist', wishlist: user.wishlist });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  user.wishlist = user.wishlist.filter((id) => id.toString() !== req.params.productId);
  await user.save();

  res.json({ success: true, message: 'Removed from wishlist', wishlist: user.wishlist });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
