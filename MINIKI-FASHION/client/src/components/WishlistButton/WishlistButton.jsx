import React from 'react';
import { FiHeart } from 'react-icons/fi';
import { useWishlist } from '../../context/WishlistContext';

const WishlistButton = ({ productId }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const active = isInWishlist(productId);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(productId);
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Toggle wishlist"
      className={`h-9 w-9 rounded-full flex items-center justify-center shadow-md transition-colors ${
        active ? 'bg-pink-600 text-white' : 'bg-white text-gray-500 hover:text-pink-600'
      }`}
    >
      <FiHeart size={16} fill={active ? 'currentColor' : 'none'} />
    </button>
  );
};

export default WishlistButton;
