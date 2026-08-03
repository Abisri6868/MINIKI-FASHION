import React from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingBag } from 'react-icons/fi';
import WishlistButton from '../WishlistButton/WishlistButton';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCart } from '../../context/CartContext';

const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const image = product.images?.[0]?.url || 'https://placehold.co/400x500/ffe4ee/d62d68?text=MINIKI+FASHION';
  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product._id, 1, {});
  };

  return (
    <Link to={`/product/${product.slug}`} className="group card overflow-hidden block">
      <div className="relative aspect-[3/4] overflow-hidden bg-pink-50">
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-pink-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {product.discountPercent}% OFF
          </span>
        )}
        <div className="absolute top-3 right-3">
          <WishlistButton productId={product._id} />
        </div>
        <button
          onClick={handleQuickAdd}
          className="absolute bottom-0 left-0 right-0 bg-pink-600/95 text-white text-sm font-medium py-2.5 flex items-center justify-center gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
        >
          <FiShoppingBag /> Add to Cart
        </button>
      </div>
      <div className="p-4">
        <p className="text-xs text-gold-600 uppercase tracking-wide">{product.category?.name}</p>
        <h3 className="font-medium text-gray-800 mt-1 line-clamp-1">{product.name}</h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-heading font-bold text-pink-700">
            {formatCurrency(hasDiscount ? product.discountPrice : product.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">{formatCurrency(product.price)}</span>
          )}
        </div>
        {product.ratingsCount > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            ★ {product.ratingsAverage.toFixed(1)} ({product.ratingsCount})
          </p>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
