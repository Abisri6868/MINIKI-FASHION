import React from 'react';
import { FiStar } from 'react-icons/fi';

const ReviewCard = ({ review }) => {
  return (
    <div className="border-b border-pink-100 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-heading font-bold">
            {review.user?.name?.[0]?.toUpperCase() || 'M'}
          </div>
          <div>
            <p className="font-medium text-gray-800 text-sm">{review.user?.name || 'MINIKI Customer'}</p>
            {review.isVerifiedPurchase && (
              <p className="text-xs text-green-600">Verified Purchase</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 text-gold-500">
          {[...Array(5)].map((_, i) => (
            <FiStar key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} />
          ))}
        </div>
      </div>
      {review.title && <p className="font-medium mt-3 text-sm text-gray-800">{review.title}</p>}
      <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
      {review.images?.length > 0 && (
        <div className="flex gap-2 mt-3">
          {review.images.map((img, i) => (
            <img key={i} src={img.url} alt="review" className="w-16 h-16 rounded-lg object-cover" />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
