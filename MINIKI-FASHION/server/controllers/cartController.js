const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Get cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'cart.product',
    populate: { path: 'category', select: 'name slug' },
  });

  res.json({ success: true, cart: user.cart });
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, variant = {} } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const user = await User.findById(req.user._id);

  const existingItem = user.cart.find(
    (item) =>
      item.product.toString() === productId &&
      item.variant?.size === variant.size &&
      item.variant?.color === variant.color
  );

  if (existingItem) {
    existingItem.quantity += Number(quantity);
  } else {
    user.cart.push({ product: productId, quantity, variant });
  }

  await user.save();
  await user.populate('cart.product');

  res.status(201).json({ success: true, message: 'Added to cart', cart: user.cart });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const user = await User.findById(req.user._id);

  const item = user.cart.id(req.params.itemId);
  if (!item) {
    res.status(404);
    throw new Error('Cart item not found');
  }

  item.quantity = quantity;
  await user.save();
  await user.populate('cart.product');

  res.json({ success: true, cart: user.cart });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
const removeCartItem = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.cart = user.cart.filter((item) => item._id.toString() !== req.params.itemId);
  await user.save();

  res.json({ success: true, message: 'Item removed from cart', cart: user.cart });
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });
  res.json({ success: true, message: 'Cart cleared' });
});

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
