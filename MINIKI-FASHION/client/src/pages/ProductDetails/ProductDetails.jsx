import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiShoppingBag, FiZap, FiStar } from 'react-icons/fi';
import Loader from '../../components/Loader';
import ProductCard from '../../components/ProductCard';
import WishlistButton from '../../components/WishlistButton';
import ReviewCard from '../../components/ReviewCard';
import ImageGallery from '../../components/ImageGallery';
import usePageTitle from '../../hooks/usePageTitle';
import { getProduct } from '../../services/productService';
import { getProductReviews, createReview } from '../../services/reviewService';
import { estimateDelivery } from '../../services/shippingService';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const DeliveryEstimate = () => {
  const [pincode, setPincode] = useState('');
  const [estimate, setEstimate] = useState(null);
  const [checking, setChecking] = useState(false);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (pincode.length < 6) return;
    setChecking(true);
    try {
      const { data } = await estimateDelivery(pincode, 'Standard');
      setEstimate(data.estimate);
    } catch (err) {
      setEstimate(null);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="mt-6 border border-pink-100 rounded-xl p-4">
      <p className="text-sm font-medium mb-2">Check Delivery Availability</p>
      <form onSubmit={handleCheck} className="flex gap-2">
        <input
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter Pincode"
          className="input-field !py-2 text-sm"
        />
        <button type="submit" disabled={checking} className="btn-outline !py-2 !px-4 text-sm whitespace-nowrap">
          {checking ? 'Checking...' : 'Check'}
        </button>
      </form>
      {estimate && (
        <p className="text-sm text-gray-600 mt-3">
          {estimate.serviceable ? (
            <>Delivery in <span className="font-semibold">{estimate.days} days</span> — Estimated: <span className="font-semibold text-pink-700">{new Date(estimate.estimatedDeliveryDate).toDateString()}</span></>
          ) : (
            <span className="text-red-600">Sorry, delivery is not available at this pincode.</span>
          )}
        </p>
      )}
    </div>
  );
};

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  usePageTitle(product?.name);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await getProduct(slug);
        setProduct(data.product);
        setRelated(data.relatedProducts || []);
        setSelectedSize(data.product.sizes?.[0] || '');
        setSelectedColor(data.product.colors?.[0] || '');

        const reviewsRes = await getProductReviews(data.product._id);
        setReviews(reviewsRes.data.reviews || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) return <Loader fullScreen />;
  if (!product) return <div className="container-custom py-20 text-center">Product not found.</div>;

  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
  const variant = { size: selectedSize, color: selectedColor };

  // Color-based image switching: when a color is selected and the product has
  // a dedicated gallery for it, show those images; otherwise fall back to the
  // default gallery so older products (without colorImages) keep working.
  const colorGallery = product.colorImages?.find((c) => c.color === selectedColor);
  const galleryImages = (colorGallery?.images?.length > 0 ? colorGallery.images : product.images) || [];

  const handleAddToCart = async () => {
    await addItem(product._id, quantity, variant);
  };

  const handleBuyNow = async () => {
    const added = await addItem(product._id, quantity, variant);
    if (added) navigate('/checkout');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to write a review');
      return;
    }
    setSubmittingReview(true);
    try {
      const formData = new FormData();
      formData.append('product', product._id);
      formData.append('rating', reviewForm.rating);
      formData.append('title', reviewForm.title);
      formData.append('comment', reviewForm.comment);

      const { data } = await createReview(formData);
      setReviews((prev) => [data.review, ...prev]);
      setReviewForm({ rating: 5, title: '', comment: '' });
      toast.success('Review submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="container-custom py-10">
      <div className="grid md:grid-cols-2 gap-10">
        {/* Image gallery */}
        <div>
          <ImageGallery images={galleryImages} productName={product.name} />
        </div>

        {/* Details */}
        <div>
          <p className="text-gold-600 uppercase tracking-wide text-sm">{product.category?.name}</p>
          <h1 className="text-3xl font-heading font-bold text-gray-900 mt-1">{product.name}</h1>

          {product.ratingsCount > 0 && (
            <div className="flex items-center gap-2 mt-3 text-gold-500">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} size={16} fill={i < Math.round(product.ratingsAverage) ? 'currentColor' : 'none'} />
              ))}
              <span className="text-sm text-gray-500">({product.ratingsCount} reviews)</span>
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            <span className="text-3xl font-heading font-bold text-pink-700">
              {formatCurrency(hasDiscount ? product.discountPrice : product.price)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatCurrency(product.price)}</span>
                <span className="bg-pink-100 text-pink-700 text-xs font-semibold px-2 py-1 rounded-full">
                  {product.discountPercent}% OFF
                </span>
              </>
            )}
          </div>

          <p className="text-gray-600 mt-5 leading-relaxed">{product.shortDescription || product.description}</p>

          {product.sizes?.length > 0 && (
            <div className="mt-6">
              <p className="font-medium text-sm mb-2">Select Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`h-10 min-w-[2.5rem] px-3 rounded-lg border text-sm font-medium ${
                      selectedSize === s ? 'bg-pink-600 text-white border-pink-600' : 'border-gray-300 text-gray-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors?.length > 0 && (
            <div className="mt-5">
              <p className="font-medium text-sm mb-2">Select Color</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                      selectedColor === c ? 'bg-pink-600 text-white border-pink-600' : 'border-gray-300 text-gray-600'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center border border-gray-300 rounded-full">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-4 py-2 text-lg">-</button>
              <span className="px-3 font-medium">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} className="px-4 py-2 text-lg">+</button>
            </div>
            <span className="text-sm text-gray-500">
              {product.totalStock > 0 ? `${product.totalStock} in stock` : 'Out of stock'}
            </span>
          </div>

          <DeliveryEstimate />

          <div className="flex flex-wrap gap-4 mt-6">
            <button onClick={handleAddToCart} disabled={product.totalStock === 0} className="btn-outline flex-1">
              <FiShoppingBag /> Add to Cart
            </button>
            <button onClick={handleBuyNow} disabled={product.totalStock === 0} className="btn-primary flex-1">
              <FiZap /> Buy Now
            </button>
            <WishlistButton productId={product._id} />
          </div>

          {(product.fabric || product.occasion || product.workType) && (
            <div className="mt-8 border-t border-pink-100 pt-6 space-y-2 text-sm">
              {product.fabric && <p><span className="font-medium">Fabric:</span> {product.fabric}</p>}
              {product.occasion && <p><span className="font-medium">Occasion:</span> {product.occasion}</p>}
              {product.workType && <p><span className="font-medium">Work Type:</span> {product.workType}</p>}
              {product.isCustomizable && <p className="text-pink-600 font-medium">✓ Customized stitching available</p>}
              {product.isRental && <p className="text-gold-600 font-medium">✓ Available for rental</p>}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mt-16 max-w-3xl">
        <h2 className="text-xl font-heading font-bold mb-3">Product Description</h2>
        <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
      </div>

      {/* Reviews */}
      <div className="mt-16 max-w-3xl">
        <h2 className="text-xl font-heading font-bold mb-6">Customer Reviews ({reviews.length})</h2>

        <form onSubmit={handleReviewSubmit} className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <p className="font-medium mb-3">Write a Review</p>
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setReviewForm((f) => ({ ...f, rating: r }))}
                className="text-gold-500"
              >
                <FiStar size={22} fill={r <= reviewForm.rating ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Review title (optional)"
            value={reviewForm.title}
            onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
            className="input-field mb-3"
          />
          <textarea
            placeholder="Share your experience with this product..."
            value={reviewForm.comment}
            onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
            required
            rows={3}
            className="input-field mb-4"
          />
          <button type="submit" disabled={submittingReview} className="btn-primary">
            {submittingReview ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>

        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
        ) : (
          reviews.map((r) => <ReviewCard key={r._id} review={r} />)
        )}
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-heading font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
