import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiGrid, FiBox, FiFolder, FiShoppingBag, FiUsers, FiTag, FiX, FiTruck, FiMessageSquare,
} from 'react-icons/fi';

const links = [
  { to: '/', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/products', label: 'Products', icon: FiBox },
  { to: '/categories', label: 'Categories', icon: FiFolder },
  { to: '/orders', label: 'Orders', icon: FiShoppingBag },
  { to: '/customers', label: 'Customers', icon: FiUsers },
  { to: '/offers', label: 'Offers & Coupons', icon: FiTag },
  { to: '/shipping-settings', label: 'Shipping Settings', icon: FiTruck },
  { to: '/messages', label: 'Messages', icon: FiMessageSquare },
];

const Sidebar = ({ open, onClose }) => {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-100 z-40 transform transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-100">
          <div>
            <p className="font-heading font-bold text-xl text-pink-700 leading-none">MINIKI FASHION</p>
            <p className="text-[10px] uppercase tracking-widest text-gold-600 mt-1">Admin Panel</p>
          </div>
          <button className="lg:hidden text-gray-500" onClick={onClose}><FiX size={20} /></button>
        </div>

        <nav className="p-4 space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-pink-600 text-white' : 'text-gray-600 hover:bg-pink-50 hover:text-pink-600'
                }`
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
