import React from 'react';
import { Link } from 'react-router-dom';

const CategoryCard = ({ category }) => {
  const image = category.image?.url || 'https://placehold.co/300x300/ffe4ee/d62d68?text=' + encodeURIComponent(category.name);

  return (
    <Link to={`/shop?category=${encodeURIComponent(category.name)}`} className="group text-center">
      <div className="aspect-square rounded-full overflow-hidden shadow-md group-hover:shadow-luxury transition-all border-4 border-white ring-1 ring-pink-100">
        <img src={image} alt={category.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      </div>
      <p className="mt-3 font-medium text-sm text-gray-700 group-hover:text-pink-600 transition-colors">{category.name}</p>
    </Link>
  );
};

export default CategoryCard;
