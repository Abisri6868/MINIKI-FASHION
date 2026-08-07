import React, { useState, useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiMaximize2, FiX, FiZoomIn } from 'react-icons/fi';

/**
 * Flipkart/Myntra-style product image gallery: thumbnail rail, slider arrows,
 * hover-to-zoom magnifier, and a fullscreen lightbox preview.
 */
const ImageGallery = ({ images = [], productName = '' }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [fullscreen, setFullscreen] = useState(false);
  const imgRef = useRef(null);

  const safeImages = images.length > 0
    ? images
    : [{ url: 'https://placehold.co/600x750/ffe4ee/d62d68?text=No+Image', public_id: 'placeholder' }];

  const goPrev = () => setActiveIdx((i) => (i === 0 ? safeImages.length - 1 : i - 1));
  const goNext = () => setActiveIdx((i) => (i === safeImages.length - 1 ? 0 : i + 1));

  const handleMouseMove = (e) => {
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const active = safeImages[Math.min(activeIdx, safeImages.length - 1)];

  return (
    <div>
      {/* Main slider + zoom */}
      <div
        className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-pink-50 mb-4 group cursor-zoom-in"
        ref={imgRef}
        onMouseEnter={() => setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setFullscreen(true)}
      >
        <img
          src={active.url}
          alt={productName}
          className={`w-full h-full object-cover transition-transform duration-200 ${zooming ? 'scale-150' : 'scale-100'}`}
          style={zooming ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
        />

        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <FiChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <FiChevronRight size={18} />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setFullscreen(true); }}
          className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow"
          aria-label="Fullscreen preview"
        >
          <FiMaximize2 size={16} />
        </button>

        <span className="absolute top-3 left-3 bg-black/40 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <FiZoomIn size={12} /> Hover to zoom
        </span>
      </div>

      {/* Thumbnails */}
      {safeImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {safeImages.map((img, i) => (
            <button
              key={img.public_id || i}
              onClick={() => setActiveIdx(i)}
              className={`h-20 w-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                activeIdx === i ? 'border-pink-600' : 'border-transparent'
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen lightbox */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullscreen(false)}
        >
          <button
            className="absolute top-5 right-5 text-white bg-white/10 hover:bg-white/20 rounded-full p-2"
            onClick={() => setFullscreen(false)}
            aria-label="Close fullscreen preview"
          >
            <FiX size={24} />
          </button>

          {safeImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-3"
              >
                <FiChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-3"
              >
                <FiChevronRight size={24} />
              </button>
            </>
          )}

          <img
            src={active.url}
            alt={productName}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
