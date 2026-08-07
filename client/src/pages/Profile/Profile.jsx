import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FiUser, FiMapPin, FiPlus, FiTrash2 } from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';

const emptyAddress = {
  label: 'Home',
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  isDefault: false,
};

const Profile = () => {
  usePageTitle('My Profile');
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', password: '' });
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, phone: form.phone };
      if (form.password) payload.password = form.password;
      const { data } = await authService.updateProfile(payload);
      updateUser(data.user);
      setForm((f) => ({ ...f, password: '' }));
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const { data } = await authService.addAddress(newAddress);
      setAddresses(data.addresses);
      setNewAddress(emptyAddress);
      setShowAddressForm(false);
      toast.success('Address added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address');
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      const { data } = await authService.deleteAddress(id);
      setAddresses(data.addresses);
      toast.success('Address removed');
    } catch (err) {
      toast.error('Failed to remove address');
    }
  };

  return (
    <div className="container-custom py-10 max-w-3xl">
      <h1 className="section-title text-left mb-8">My Account</h1>

      <div className="flex gap-4 mb-8 border-b border-pink-100">
        <button
          onClick={() => setActiveTab('details')}
          className={`pb-3 px-2 font-medium text-sm flex items-center gap-2 border-b-2 ${
            activeTab === 'details' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-500'
          }`}
        >
          <FiUser /> Profile Details
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`pb-3 px-2 font-medium text-sm flex items-center gap-2 border-b-2 ${
            activeTab === 'addresses' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-500'
          }`}
        >
          <FiMapPin /> Addresses
        </button>
      </div>

      {activeTab === 'details' && (
        <form onSubmit={handleProfileUpdate} className="bg-white rounded-2xl shadow-md p-6 space-y-4 max-w-lg">
          <div>
            <label className="text-sm font-medium text-gray-600">Full Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <input value={user?.email} disabled className="input-field mt-1 bg-gray-50" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Phone</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input-field mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">New Password (leave blank to keep current)</label>
            <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="input-field mt-1" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {activeTab === 'addresses' && (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div key={addr._id} className="bg-white rounded-2xl shadow-md p-5 flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">{addr.label} {addr.isDefault && <span className="text-xs text-pink-600 ml-2">(Default)</span>}</p>
                <p className="text-sm text-gray-600 mt-1">{addr.fullName} • {addr.phone}</p>
                <p className="text-sm text-gray-600">{addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2}, `}{addr.city}, {addr.state} - {addr.pincode}</p>
              </div>
              <button onClick={() => handleDeleteAddress(addr._id)} className="text-gray-400 hover:text-pink-600">
                <FiTrash2 size={18} />
              </button>
            </div>
          ))}

          {showAddressForm ? (
            <form onSubmit={handleAddAddress} className="bg-white rounded-2xl shadow-md p-6 space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <input placeholder="Full Name" value={newAddress.fullName} onChange={(e) => setNewAddress((a) => ({ ...a, fullName: e.target.value }))} required className="input-field" />
                <input placeholder="Phone" value={newAddress.phone} onChange={(e) => setNewAddress((a) => ({ ...a, phone: e.target.value }))} required className="input-field" />
                <input placeholder="Address Line 1" value={newAddress.addressLine1} onChange={(e) => setNewAddress((a) => ({ ...a, addressLine1: e.target.value }))} required className="input-field md:col-span-2" />
                <input placeholder="Address Line 2" value={newAddress.addressLine2} onChange={(e) => setNewAddress((a) => ({ ...a, addressLine2: e.target.value }))} className="input-field md:col-span-2" />
                <input placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))} required className="input-field" />
                <input placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress((a) => ({ ...a, state: e.target.value }))} required className="input-field" />
                <input placeholder="Pincode" value={newAddress.pincode} onChange={(e) => setNewAddress((a) => ({ ...a, pincode: e.target.value }))} required className="input-field" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={newAddress.isDefault} onChange={(e) => setNewAddress((a) => ({ ...a, isDefault: e.target.checked }))} className="accent-pink-600" />
                Set as default address
              </label>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary">Save Address</button>
                <button type="button" onClick={() => setShowAddressForm(false)} className="btn-outline">Cancel</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowAddressForm(true)} className="btn-outline flex items-center gap-2">
              <FiPlus /> Add New Address
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
