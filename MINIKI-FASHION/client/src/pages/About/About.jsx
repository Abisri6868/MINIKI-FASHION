import React from 'react';
import { Link } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';

const values = [
  { title: 'Bridal Wear', desc: 'Handpicked bridal collections crafted for your most treasured day.' },
  { title: 'Maternity & New Born', desc: 'Comfort-first designs celebrating motherhood and new beginnings.' },
  { title: 'Aari Work & Custom Stitching', desc: 'Intricate hand embroidery and made-to-measure tailoring.' },
];

const About = () => {
  usePageTitle('About Us');

  return (
    <div>
      <section className="bg-gradient-to-br from-pink-50 to-gold-50 py-16">
        <div className="container-custom text-center">
          <p className="section-subtitle">Our Story</p>
          <h1 className="section-title">About MINIKI FASHION</h1>
          <p className="max-w-2xl mx-auto mt-5 text-gray-600 leading-relaxed">
            MINIKI FASHION is a designer boutique built on a passion for timeless Indian
            craftsmanship and modern comfort. From bridal luxury to newborn softness,
            every piece we curate is chosen with love, quality, and elegance in mind.
            We proudly serve mothers-to-be, brides, grooms, and little ones with
            collections that celebrate every milestone.
          </p>
        </div>
      </section>

      <section className="container-custom py-16 grid md:grid-cols-3 gap-8">
        {values.map((v) => (
          <div key={v.title} className="card p-8 text-center">
            <h3 className="font-heading text-xl font-bold text-pink-700 mb-3">{v.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{v.desc}</p>
          </div>
        ))}
      </section>

      <section className="bg-pink-700 text-white py-16 text-center">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-heading font-bold">Experience the MINIKI Difference</h2>
          <p className="mt-3 text-pink-100 max-w-xl mx-auto">
            Quality fabrics, custom fits, and a boutique experience — every single time.
          </p>
          <Link to="/shop" className="inline-block mt-6 bg-white text-pink-700 font-medium px-8 py-3 rounded-full hover:bg-cream transition-colors">
            Explore Our Collection
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
