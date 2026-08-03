import React from 'react';
import { Link } from 'react-router-dom';
import { FiInstagram, FiFacebook, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { BRAND_NAME, BRAND_TAGLINE, FOOTER_CATEGORIES } from '../../utils/constants';

const Footer = () => {
  return (
    <footer className="bg-pink-900 text-pink-50 mt-20">
      <div className="container-custom py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <h3 className="text-2xl font-heading font-bold text-gold-300">{BRAND_NAME}</h3>
          <p className="mt-2 text-sm text-pink-200">{BRAND_TAGLINE}</p>
          <div className="flex gap-4 mt-5">
            <a href="#" aria-label="Instagram" className="hover:text-gold-300 transition-colors"><FiInstagram size={20} /></a>
            <a href="#" aria-label="Facebook" className="hover:text-gold-300 transition-colors"><FiFacebook size={20} /></a>
          </div>
        </div>

        <div>
          <h4 className="font-heading text-lg mb-4 text-gold-300">Shop Categories</h4>
          <ul className="space-y-2 text-sm text-pink-200">
            {FOOTER_CATEGORIES.map((cat) => (
              <li key={cat}>
                <Link to={`/shop?category=${encodeURIComponent(cat)}`} className="hover:text-white transition-colors">{cat}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-heading text-lg mb-4 text-gold-300">Quick Links</h4>
          <ul className="space-y-2 text-sm text-pink-200">
            <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            <li><Link to="/orders" className="hover:text-white transition-colors">Track Order</Link></li>
            <li><Link to="/wishlist" className="hover:text-white transition-colors">Wishlist</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-heading text-lg mb-4 text-gold-300">Get In Touch</h4>
          <ul className="space-y-3 text-sm text-pink-200">
            <li className="flex items-start gap-2"><FiMapPin className="mt-1 flex-shrink-0" /> Sumangali Fancy Stores Opp.,
Municipality Street,
Usilampatti - 625532 , Tamil Nadu, India</li>
            <li className="flex items-center gap-2"><FiPhone /> +91 80156 79288 | +91 93420 48363</li>
            <li className="flex items-center gap-2"><FiMail /> minikifashion@gmail.com</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-pink-800 py-5 text-center text-xs text-pink-300">
        © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
