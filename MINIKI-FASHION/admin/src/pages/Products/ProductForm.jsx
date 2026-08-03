import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiUpload, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import { getProduct, createProduct, updateProduct, deleteProductImage } from '../../services/productService';
import { getCategories } from '../../services/categoryService';

const emptyVariant = { size: '', color: '', stock: 0, sku: '' };

const ProductForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    shortDescription: '',
    category: '',
    price: '',
    discountPercent: '',
    totalStock: '',
    fabric: '',
    occasion: '',
    workType: '',
    sizes: '',
    colors: '',
    tags: '',
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    isRental: false,
    isCustomizable: false,
    isActive: true,
  });
  const [variants, setVariants] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data.categories || []));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    getProduct(id).then(({ data }) => {
      const p = data.product;
      setForm({
        name: p.name,
        description: p.description,
        shortDescription: p.shortDescription || '',
        category: p.category?._id || '',
        price: p.price,
        discountPercent: p.discountPercent || '',
        totalStock: p.totalStock || '',
        fabric: p.fabric || '',
        occasion: p.occasion || '',
        workType: p.workType || '',
        sizes: (p.sizes || []).join(', '),
        colors: (p.colors || []).join(', '),
        tags: (p.tags || []).join(', '),
        isFeatured: p.isFeatured,
        isNewArrival: p.isNewArrival,
        isBestSeller: p.isBestSeller,
        isRental: p.isRental,
        isCustomizable: p.isCustomizable,
        isActive: p.isActive,
      });
      setVariants(p.variants || []);
      setExistingImages(p.images || []);
      setLoading(false);
    });
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setNewImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (publicId) => {
    if (!isEdit) return;
    if (!window.confirm('Remove this image?')) return;
    try {
      await deleteProductImage(id, publicId);
      setExistingImages((prev) => prev.filter((img) => img.public_id !== publicId));
      toast.success('Image removed');
    } catch (err) {
      toast.error('Failed to remove image');
    }
  };

  const addVariantRow = () => setVariants((prev) => [...prev, { ...emptyVariant }]);
  const updateVariant = (index, field, value) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };
  const removeVariant = (index) => setVariants((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.category) {
      toast.error('Please select a category');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.set('sizes', JSON.stringify(form.sizes.split(',').map((s) => s.trim()).filter(Boolean)));
      formData.set('colors', JSON.stringify(form.colors.split(',').map((s) => s.trim()).filter(Boolean)));
      formData.set('tags', JSON.stringify(form.tags.split(',').map((s) => s.trim()).filter(Boolean)));
      formData.set('variants', JSON.stringify(variants.filter((v) => v.size || v.color)));

      newImages.forEach((file) => formData.append('images', file));

      if (isEdit) {
        await updateProduct(id, formData);
        toast.success('Product updated successfully');
      } else {
        await createProduct(formData);
        toast.success('Product created successfully');
      }
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading product...</p>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-heading font-bold mb-6">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h3 className="font-heading font-bold">Basic Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Product Name *" required className="input-field md:col-span-2" />
            <select name="category" value={form.category} onChange={handleChange} required className="input-field">
              <option value="">Select Category *</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="Price (₹) *" required className="input-field" />
            <input name="discountPercent" type="number" value={form.discountPercent} onChange={handleChange} placeholder="Discount %" className="input-field" />
            <input name="totalStock" type="number" value={form.totalStock} onChange={handleChange} placeholder="Total Stock" className="input-field" />
          </div>
          <textarea name="shortDescription" value={form.shortDescription} onChange={handleChange} placeholder="Short Description" rows={2} className="input-field" />
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Full Description *" required rows={4} className="input-field" />
        </div>

        <div className="card p-6 space-y-4">
          <h3 className="font-heading font-bold">Attributes</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <input name="fabric" value={form.fabric} onChange={handleChange} placeholder="Fabric" className="input-field" />
            <input name="occasion" value={form.occasion} onChange={handleChange} placeholder="Occasion" className="input-field" />
            <input name="workType" value={form.workType} onChange={handleChange} placeholder="Work Type (e.g. Aari Work)" className="input-field" />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <input name="sizes" value={form.sizes} onChange={handleChange} placeholder="Sizes (comma separated e.g. S, M, L)" className="input-field" />
            <input name="colors" value={form.colors} onChange={handleChange} placeholder="Colors (comma separated)" className="input-field" />
            <input name="tags" value={form.tags} onChange={handleChange} placeholder="Tags (comma separated)" className="input-field" />
          </div>
          <div className="flex flex-wrap gap-5 pt-2">
            {['isFeatured', 'isNewArrival', 'isBestSeller', 'isRental', 'isCustomizable', 'isActive'].map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name={key} checked={form[key]} onChange={handleChange} className="accent-pink-600" />
                {key.replace('is', '').replace(/([A-Z])/g, ' $1').trim()}
              </label>
            ))}
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold">Size/Color Variants & Stock</h3>
            <button type="button" onClick={addVariantRow} className="btn-outline !py-1.5 !px-3 text-xs"><FiPlus /> Add Variant</button>
          </div>
          {variants.length === 0 ? (
            <p className="text-sm text-gray-400">No variants added. Product will use total stock only.</p>
          ) : (
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 items-center">
                  <input value={v.size} onChange={(e) => updateVariant(i, 'size', e.target.value)} placeholder="Size" className="input-field !py-2" />
                  <input value={v.color} onChange={(e) => updateVariant(i, 'color', e.target.value)} placeholder="Color" className="input-field !py-2" />
                  <input type="number" value={v.stock} onChange={(e) => updateVariant(i, 'stock', Number(e.target.value))} placeholder="Stock" className="input-field !py-2" />
                  <input value={v.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)} placeholder="SKU" className="input-field !py-2" />
                  <button type="button" onClick={() => removeVariant(i)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg w-fit"><FiTrash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6 space-y-4">
          <h3 className="font-heading font-bold">Product Images</h3>
          {existingImages.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {existingImages.map((img) => (
                <div key={img.public_id} className="relative">
                  <img src={img.url} alt="" className="w-24 h-28 object-cover rounded-lg" />
                  <button type="button" onClick={() => removeExistingImage(img.public_id)} className="absolute -top-2 -right-2 bg-white rounded-full shadow p-1 text-red-500">
                    <FiX size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt="" className="w-24 h-28 object-cover rounded-lg" />
                  <button type="button" onClick={() => removeNewImage(i)} className="absolute -top-2 -right-2 bg-white rounded-full shadow p-1 text-red-500">
                    <FiX size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2 border-2 border-dashed border-pink-200 rounded-xl p-6 justify-center cursor-pointer text-pink-600 hover:bg-pink-50">
            <FiUpload /> Upload Images (multiple allowed)
            <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" />
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary !py-3 !px-8">
            {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <button type="button" onClick={() => navigate('/products')} className="btn-outline !py-3 !px-8">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
