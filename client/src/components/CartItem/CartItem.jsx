import React from 'react';
import { Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCart } from '../../context/CartContext';

const CartItem = ({ item }) => {
  const { updateItem, removeItem } = useCart();
  const product = item.product;
  if (!product) return null;

  const image = product.images?.[0]?.url || 'https://placehold.co/200x250/ffe4ee/d62d68';
  const price = product.discountPrice > 0 ? product.discountPrice : product.price;

  return (
    <div className="flex gap-4 py-5 border-b border-pink-100">
      <Link to={`/product/${product.slug}`} className="flex-shrink-0">
        <img src={image} alt={product.name} className="w-24 h-28 object-cover rounded-xl" />
      </Link>
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between">
          <div>
            <Link to={`/product/${product.slug}`} className="font-medium text-gray-800 hover:text-pink-600">
              {product.name}
            </Link>
            {(item.variant?.size || item.variant?.color) && (
              <p className="text-xs text-gray-500 mt-1">
                {item.variant.size && `Size: ${item.variant.size}`} {item.variant.color && `• Color: ${item.variant.color}`}
              </p>
            )}
          </div>
          <button onClick={() => removeItem(item._id)} className="text-gray-400 hover:text-pink-600 h-fit" aria-label="Remove item">
            <FiTrash2 size={18} />
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center border border-gray-200 rounded-full">
            <button
              onClick={() => updateItem(item._id, Math.max(1, item.quantity - 1))}
              className="p-2 hover:text-pink-600"
              aria-label="Decrease quantity"
            >
              <FiMinus size={14} />
            </button>
            <span className="px-3 text-sm font-medium">{item.quantity}</span>
            <button
              onClick={() => updateItem(item._id, item.quantity + 1)}
              className="p-2 hover:text-pink-600"
              aria-label="Increase quantity"
            >
              <FiPlus size={14} />
            </button>
          </div>
          <span className="font-heading font-bold text-pink-700">{formatCurrency(price * item.quantity)}</span>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
