import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import usePageTitle from '../../hooks/usePageTitle';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  usePageTitle('Register');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-custom py-16 max-w-md">
      <div className="bg-white rounded-2xl shadow-luxury p-8">
        <h1 className="text-2xl font-heading font-bold text-center mb-1">Create Account</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Join the MINIKI FASHION family</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required className="input-field" />
          <input name="email" type="email" placeholder="Email Address" value={form.email} onChange={handleChange} required className="input-field" />
          <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} className="input-field" />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required minLength={6} className="input-field" />
          <input name="confirmPassword" type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} required className="input-field" />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-pink-600 font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
