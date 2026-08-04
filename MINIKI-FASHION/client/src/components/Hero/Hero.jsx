import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-cream to-gold-50">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-pink-200 rounded-full opacity-30 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold-200 rounded-full opacity-30 blur-3xl" />

      <div className="container-custom relative py-20 md:py-32 grid md:grid-cols-2 gap-12 items-center">
        <div className="text-center md:text-left">
          <p className="section-subtitle md:text-left">DESIGNED FOR YOU</p>
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-gray-900 leading-tight">
            Find Your <span className="text-pink-600">Perfect</span>{' '}
            <span className="text-gold-500">Outfit</span>
          </h1>
          <p className="mt-6 text-gray-600 text-lg max-w-md mx-auto md:mx-0">
           Discover premium sarees, kurtis, lehengas & western wear
at MINIKI FASHION, crafted with elegance and timeless style.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
            <Link to="/shop" className="btn-primary">Shop Now</Link>
            
          </div>
        </div>

        <div className="relative flex justify-center">
  <img
    src="/images/hero/abiii.png"
    alt="MINIKI Fashion"
    className="w-full max-w-lg h-auto object-contain"
  />
</div>
      </div>
    </section>
  );
};

export default Hero;
