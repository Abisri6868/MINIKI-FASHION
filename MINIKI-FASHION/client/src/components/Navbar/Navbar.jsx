import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiSearch, FiHeart, FiShoppingBag, FiUser, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { NAV_LINKS, BRAND_NAME } from '../../utils/constants';
import SearchBar from '../SearchBar/SearchBar';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className={`sticky top-0 z-50 bg-white/95 backdrop-blur transition-shadow ${scrolled ? 'shadow-md' : ''}`}>
      <div className="bg-gradient-to-r from-pink-700 via-pink-600 to-gold-500 text-white text-center text-xs md:text-sm py-2 px-4 tracking-wide">
        Free shipping across India on orders above ₹1000 &nbsp;•&nbsp; Premium Quality Guaranteed
      </div>

      <div className="container-custom flex items-center justify-between py-4">
        <Link to="/" className="flex flex-col leading-none">
          <span className="text-2xl md:text-3xl font-heading font-bold text-pink-700 tracking-wide">
            {BRAND_NAME}
          </span>
          <span className="text-[10px] md:text-xs text-gold-600 uppercase tracking-[0.15em]">
            Designer Boutique
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              className={({ isActive }) =>
                `font-medium text-sm uppercase tracking-wide transition-colors ${
                  isActive ? 'text-pink-600' : 'text-gray-700 hover:text-pink-600'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-5">
          <button
            aria-label="Search"
            onClick={() => setSearchOpen((s) => !s)}
            className="text-gray-700 hover:text-pink-600 transition-colors"
          >
            <FiSearch size={22} />
          </button>

          <Link to="/wishlist" aria-label="Wishlist" className="relative text-gray-700 hover:text-pink-600 transition-colors">
            <FiHeart size={22} />
            {wishlist.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>

          <Link to="/cart" aria-label="Cart" className="relative text-gray-700 hover:text-pink-600 transition-colors">
            <FiShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gold-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          <div className="relative hidden md:block">
            <button
              onClick={() => setUserMenuOpen((s) => !s)}
              aria-label="Account"
              className="text-gray-700 hover:text-pink-600 transition-colors"
            >
              <FiUser size={22} />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-luxury border border-pink-100 py-2 z-50">
                {isAuthenticated ? (
                  <>
                    <p className="px-4 py-2 text-sm text-gray-500 border-b">Hi, {user.name.split(' ')[0]}</p>
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-pink-50">Profile</Link>
                    <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-pink-50">My Orders</Link>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-pink-600 hover:bg-pink-50">Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-pink-50">Login</Link>
                    <Link to="/register" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-pink-50">Register</Link>
                  </>
                )}
              </div>
            )}
          </div>

          <button className="lg:hidden text-gray-700" onClick={() => setMenuOpen((s) => !s)} aria-label="Menu">
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-pink-100 py-3 px-4">
          <div className="container-custom">
            <SearchBar onSearch={() => setSearchOpen(false)} />
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="lg:hidden border-t border-pink-100 bg-white">
          <nav className="flex flex-col py-2">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `px-6 py-3 text-sm font-medium uppercase tracking-wide border-b border-gray-50 ${
                    isActive ? 'text-pink-600' : 'text-gray-700'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="px-6 py-3 text-sm border-b border-gray-50">Profile</Link>
                <Link to="/orders" onClick={() => setMenuOpen(false)} className="px-6 py-3 text-sm border-b border-gray-50">My Orders</Link>
                <button onClick={handleLogout} className="text-left px-6 py-3 text-sm text-pink-600">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="px-6 py-3 text-sm border-b border-gray-50">Login</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="px-6 py-3 text-sm">Register</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
