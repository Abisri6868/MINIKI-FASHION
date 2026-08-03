import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../services/couponService';

const emptyForm = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minPurchaseAmount: 0,
  maxDiscountAmount: 0,
  usageLimit: 0,
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: '',
  isActive: true,
};

const Offers = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data } = await getCoupons();
      setCoupons(data.coupons || []);
    } catch (err) {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (coupon) => {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchaseAmount: coupon.minPurchaseAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      usageLimit: coupon.usageLimit,
      validFrom: coupon.validFrom?.slice(0, 10) || '',
      validUntil: coupon.validUntil?.slice(0, 10) || '',
      isActive: coupon.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateCoupon(editingId, form);
        toast.success('Offer updated');
      } else {
        await createCoupon(form);
        toast.success('Offer created');
      }
      setShowForm(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save offer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete offer "${code}"?`)) return;
    try {
      await deleteCoupon(id);
      toast.success('Offer deleted');
      fetchCoupons();
    } catch (err) {
      toast.error('Failed to delete offer');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-heading font-bold">Offers & Coupons</h1>
        <button onClick={openAddForm} className="btn-primary"><FiPlus /> Add Offer</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg">{editingId ? 'Edit Offer' : 'Add Offer'}</h3>
              <button onClick={() => setShowForm(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="Coupon Code (e.g. MINIKI20) *"
                required
                className="input-field"
              />
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" className="input-field" />

              <div className="grid grid-cols-2 gap-4">
                <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))} className="input-field">
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
                <input type="number" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} placeholder="Discount Value *" required className="input-field" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input type="number" value={form.minPurchaseAmount} onChange={(e) => setForm((f) => ({ ...f, minPurchaseAmount: e.target.value }))} placeholder="Min Purchase (₹)" className="input-field" />
                <input type="number" value={form.maxDiscountAmount} onChange={(e) => setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }))} placeholder="Max Discount (₹)" className="input-field" />
              </div>

              <input type="number" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} placeholder="Usage Limit (0 = unlimited)" className="input-field" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Valid From</label>
                  <input type="date" value={form.validFrom} onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))} className="input-field mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Valid Until *</label>
                  <input type="date" value={form.validUntil} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))} required className="input-field mt-1" />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="accent-pink-600" />
                Active
              </label>

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

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-pink-50">
                <th className="table-th">Code</th>
                <th className="table-th">Discount</th>
                <th className="table-th">Min Purchase</th>
                <th className="table-th">Usage</th>
                <th className="table-th">Valid Until</th>
                <th className="table-th">Status</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="table-td text-center py-10">Loading...</td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan={7} className="table-td text-center py-10">No offers created yet</td></tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c._id}>
                    <td className="table-td font-medium">{c.code}</td>
                    <td className="table-td">{c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                    <td className="table-td">₹{c.minPurchaseAmount}</td>
                    <td className="table-td">{c.usedCount}/{c.usageLimit || '∞'}</td>
                    <td className="table-td">{new Date(c.validUntil).toLocaleDateString('en-IN')}</td>
                    <td className="table-td">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditForm(c)} className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg">
                          <FiEdit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(c._id, c.code)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Offers;
