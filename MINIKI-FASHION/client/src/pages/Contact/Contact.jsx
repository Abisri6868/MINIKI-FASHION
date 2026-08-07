import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FiMapPin, FiPhone, FiMail } from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { submitContactMessage } from '../../services/contactService';

const Contact = () => {
  usePageTitle('Contact Us');
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await submitContactMessage(form);
      toast.success("Thank you! We'll get back to you soon.");
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container-custom py-16">
      <div className="text-center mb-12">
        <p className="section-subtitle">Get In Touch</p>
        <h1 className="section-title">Contact MINIKI FASHION</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center flex-shrink-0"><FiMapPin /></div>
            <div>
              <p className="font-medium">Boutique Address</p>
              <p className="text-gray-500 text-sm">Tiruppur, Tamil Nadu, India</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center flex-shrink-0"><FiPhone /></div>
            <div>
              <p className="font-medium">Call Us</p>
              <p className="text-gray-500 text-sm">+91 90000 00000</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center flex-shrink-0"><FiMail /></div>
            <div>
              <p className="font-medium">Email Us</p>
              <p className="text-gray-500 text-sm">hello@minikifashion.com</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <input placeholder="Your Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="input-field" />
          <input type="email" placeholder="Email Address" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required className="input-field" />
          <input placeholder="Phone Number" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input-field" />
          <input placeholder="Subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} className="input-field" />
          <textarea placeholder="Your Message" rows={4} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} required className="input-field" />
          <button type="submit" disabled={sending} className="btn-primary w-full">
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
