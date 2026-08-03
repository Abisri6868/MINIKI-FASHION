import React from 'react';
import { Link } from 'react-router-dom';
import { FiHeart } from 'react-icons/fi';
import ProductCard from '../../components/ProductCard';
import usePageTitle from '../../hooks/usePageTitle';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

const Wishlist = () => {
  usePageTitle('Wishlist');
  const { wishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="container-custom py-24 text-center">
        <FiHeart size={48} className="mx-auto text-pink-300 mb-4" />
        <h2 className="text-2xl font-heading font-bold mb-2">Please login to view your wishlist</h2>
        <Link to="/login" className="btn-primary mt-4 inline-flex">Login</Link>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="container-custom py-24 text-center">
        <FiHeart size={48} className="mx-auto text-pink-300 mb-4" />
        <h2 className="text-2xl font-heading font-bold mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 mb-6">Save your favorite pieces here for later.</p>
        <Link to="/shop" className="btn-primary inline-flex">Explore Products</Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-10">
      <h1 className="section-title text-left mb-8">My Wishlist ({wishlist.length})</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlist.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
