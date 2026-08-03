import React, { createContext, useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';
import * as cartService from '../services/cartService';
import { useAuth } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const { data } = await cartService.getCart();
      setCart(data.cart || []);
    } catch (err) {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const addItem = async (productId, quantity = 1, variant = {}) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to your cart');
      return false;
    }
    try {
      const { data } = await cartService.addToCart({ productId, quantity, variant });
      setCart(data.cart);
      toast.success('Added to cart');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
      return false;
    }
  };

  const updateItem = async (itemId, quantity) => {
    try {
      const { data } = await cartService.updateCartItem(itemId, quantity);
      setCart(data.cart);
    } catch (err) {
      toast.error('Failed to update cart');
    }
  };

  const removeItem = async (itemId) => {
    try {
      const { data } = await cartService.removeCartItem(itemId);
      setCart(data.cart);
      toast.success('Item removed');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const clear = async () => {
    try {
      await cartService.clearCart();
      setCart([]);
    } catch (err) {
      /* ignore */
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const price = item.product?.discountPrice > 0 ? item.product.discountPrice : item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{ cart, loading, addItem, updateItem, removeItem, clear, fetchCart, cartCount, cartTotal }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
