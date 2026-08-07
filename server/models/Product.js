const mongoose = require('mongoose');
const slugify = require('slugify');

const variantSchema = new mongoose.Schema(
  {
    size: { type: String },
    color: { type: String },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String },
  },
  { _id: false }
);

// Color -> image set, so switching color on the product page swaps the gallery automatically
const colorImageSchema = new mongoose.Schema(
  {
    color: { type: String, required: true },
    colorCode: { type: String, default: '' }, // optional hex swatch
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        type: {
          type: String,
          enum: ['front', 'back', 'side', 'zoom', 'additional'],
          default: 'additional',
        },
      },
    ],
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, required: [true, 'Description is required'] },
    shortDescription: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: String, default: 'MINIKI FASHION' },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        type: {
          type: String,
          enum: ['front', 'back', 'side', 'zoom', 'additional'],
          default: 'additional',
        },
      },
    ],
    // Per-color galleries. Falls back to the default `images` array when a
    // selected color has no dedicated images, so old products keep working.
    colorImages: [colorImageSchema],
    variants: [variantSchema],
    totalStock: { type: Number, default: 0, min: 0 },
    sizes: [{ type: String }],
    colors: [{ type: String }],
    fabric: { type: String, default: '' },
    occasion: { type: String, default: '' },
    workType: { type: String, default: '' },
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isRental: { type: Boolean, default: false },
    isCustomizable: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0 },
    numSold: { type: Number, default: 0 },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isNewArrival: 1 });

productSchema.pre('validate', function (next) {
  if (this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Date.now().toString().slice(-5);
  }
  next();
});

productSchema.pre('save', function (next) {
  if (this.discountPercent > 0 && this.price) {
    this.discountPrice = Math.round(this.price - (this.price * this.discountPercent) / 100);
  } else if (this.discountPrice > 0 && this.price) {
    this.discountPercent = Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  if (this.variants && this.variants.length > 0) {
    this.totalStock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
