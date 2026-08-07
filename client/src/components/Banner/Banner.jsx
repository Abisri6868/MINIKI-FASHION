import React from 'react';
import { Link } from 'react-router-dom';

const Banner = ({ title, subtitle, ctaText = 'Shop Now', ctaLink = '/shop', theme = 'pink' }) => {
  const themes = {
    pink: 'from-pink-600 to-pink-800',
    gold: 'from-gold-500 to-gold-700',
  };

  return (
    <section className={`bg-gradient-to-r ${themes[theme]} text-white`}>
      <div className="container-custom py-14 text-center">
        <h2 className="text-2xl md:text-4xl font-heading font-bold">{title}</h2>
        {subtitle && <p className="mt-3 text-white/85 max-w-xl mx-auto">{subtitle}</p>}
        <Link to={ctaLink} className="inline-block mt-6 bg-white text-pink-700 font-medium px-8 py-3 rounded-full hover:bg-cream transition-colors">
          {ctaText}
        </Link>
      </div>
    </section>
  );
};

export default Banner;
