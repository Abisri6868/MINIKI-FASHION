import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUpload } from 'react-icons/fi';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/categoryService';

const emptyForm = { name: '', description: '', isFeatured: false, isActive: true, sortOrder: 0 };

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await getCategories();
      setCategories(data.categories || []);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setPreview('');
    setShowForm(true);
  };

  const openEditForm = (cat) => {
    setEditingId(cat._id);
    setForm({
      name: cat.name,
      description: cat.description || '',
      isFeatured: cat.isFeatured,
      isActive: cat.isActive,
      sortOrder: cat.sortOrder || 0,
    });
    setPreview(cat.image?.url || '');
    setImageFile(null);
    setShowForm(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (imageFile) formData.append('image', imageFile);

      if (editingId) {
        await updateCategory(editingId, formData);
        toast.success('Category updated');
      } else {
        await createCategory(formData);
        toast.success('Category created');
      }
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await deleteCategory(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-heading font-bold">Categories</h1>
        <button onClick={openAddForm} className="btn-primary"><FiPlus /> Add Category</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg">{editingId ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setShowForm(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Category Name *" required className="input-field" />
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" rows={3} className="input-field" />
              <input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} placeholder="Sort Order" className="input-field" />

              {preview && <img src={preview} alt="" className="w-24 h-24 object-cover rounded-xl" />}
              <label className="flex items-center gap-2 border-2 border-dashed border-pink-200 rounded-xl p-4 justify-center cursor-pointer text-pink-600 hover:bg-pink-50 text-sm">
                <FiUpload /> Upload Category Image
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>

              <div className="flex gap-5">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} className="accent-pink-600" />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="accent-pink-600" />
                  Active
                </label>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <p>Loading...</p>
        ) : (
          categories.map((cat) => (
            <div key={cat._id} className="card p-4 flex gap-4 items-center">
              <img
                src={cat.image?.url || 'https://placehold.co/80x80/ffe4ee/d62d68'}
                alt={cat.name}
                className="w-16 h-16 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium">{cat.name}</p>
                <p className={`text-xs mt-1 ${cat.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                  {cat.isActive ? 'Active' : 'Inactive'} {cat.isFeatured && '• Featured'}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => openEditForm(cat)} className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg">
                  <FiEdit2 size={16} />
                </button>
                <button onClick={() => handleDelete(cat._id, cat.name)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Categories;
