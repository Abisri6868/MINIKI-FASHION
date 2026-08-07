import React, { createContext, useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';
import * as wishlistService from '../services/wishlistService';
import { useAuth } from './AuthContext';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState([]);

  const fetchWishlist = async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await wishlistService.getWishlist();
      setWishlist(data.wishlist || []);
    } catch (err) {
      /* ignore */
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      setWishlist([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const isInWishlist = (productId) => wishlist.some((p) => p._id === productId);

  const toggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Please login to use wishlist');
      return;
    }
    try {
      if (isInWishlist(productId)) {
        await wishlistService.removeFromWishlist(productId);
        setWishlist((prev) => prev.filter((p) => p._id !== productId));
        toast.success('Removed from wishlist');
      } else {
        await wishlistService.addToWishlist(productId);
        toast.success('Added to wishlist');
        fetchWishlist();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, isInWishlist, toggleWishlist, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
