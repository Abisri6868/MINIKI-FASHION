import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-cream to-gold-50">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-pink-200 rounded-full opacity-30 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold-200 rounded-full opacity-30 blur-3xl" />

      <div className="container-custom relative py-20 md:py-32 grid md:grid-cols-2 gap-12 items-center">
        <div className="text-center md:text-left">
          <p className="section-subtitle md:text-left">Designer Boutique</p>
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-gray-900 leading-tight">
            Elegance Woven for <span className="text-pink-600">Every</span>{' '}
            <span className="text-gold-500">Moment</span>
          </h1>
          <p className="mt-6 text-gray-600 text-lg max-w-md mx-auto md:mx-0">
            From bridal luxury to newborn softness — MINIKI FASHION curates timeless
            designer wear for every chapter of your story.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
            <Link to="/shop" className="btn-primary">Shop Collection</Link>
            <Link to="/shop?category=Bridal Wear" className="btn-outline">Explore Bridal</Link>
          </div>
        </div>

        <div className="relative">
          <div className="aspect-[4/5] rounded-[2rem] bg-gradient-to-tr from-pink-200 via-pink-100 to-gold-100 shadow-luxury flex items-center justify-center overflow-hidden">
            <span className="font-heading text-3xl text-pink-700/40 text-center px-10">
              MINIKI FASHION
              <br />
              <span className="text-base tracking-widest uppercase text-gold-600/60">Boutique Collection</span>
            </span>
          </div>
          <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-luxury p-4 hidden md:block">
            <p className="text-sm text-gray-500">Handcrafted</p>
            <p className="font-heading text-xl text-pink-600 font-bold">Aari Work</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
