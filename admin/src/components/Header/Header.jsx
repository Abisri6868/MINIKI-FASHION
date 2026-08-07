import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiLogOut, FiUser } from 'react-icons/fi';
import { useAdminAuth } from '../../context/AdminAuthContext';

const Header = ({ onMenuClick }) => {
  const { admin, logout } = useAdminAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between">
      <button className="lg:hidden text-gray-600" onClick={onMenuClick}><FiMenu size={22} /></button>
      <div className="hidden lg:block" />

      <div className="relative">
        <button onClick={() => setMenuOpen((s) => !s)} className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-heading font-bold">
            {admin?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <span className="hidden md:block text-sm font-medium text-gray-700">{admin?.name}</span>
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-luxury border border-gray-100 py-2">
            <p className="px-4 py-2 text-xs text-gray-400 flex items-center gap-2"><FiUser /> {admin?.email}</p>
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-pink-600 hover:bg-pink-50 flex items-center gap-2">
              <FiLogOut /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
