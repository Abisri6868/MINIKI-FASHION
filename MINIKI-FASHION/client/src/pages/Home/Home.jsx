import React, { useEffect, useState } from 'react';
import Hero from '../../components/Hero';
import Banner from '../../components/Banner';
import CategoryCard from '../../components/CategoryCard';
import ProductCard from '../../components/ProductCard';
import Loader from '../../components/Loader';
import { getCategories } from '../../services/categoryService';
import { getFeaturedProducts, getNewArrivals, getBestSellers } from '../../services/productService';

const SectionHeader = ({ subtitle, title }) => (
  <div className="mb-10">
    <p className="section-subtitle">{subtitle}</p>
    <h2 className="section-title">{title}</h2>
  </div>
);

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, featRes, newRes, bestRes] = await Promise.all([
          getCategories(),
          getFeaturedProducts(),
          getNewArrivals(),
          getBestSellers(),
        ]);
        setCategories(catRes.data.categories || []);
        setFeatured(featRes.data.products || []);
        setNewArrivals(newRes.data.products || []);
        setBestSellers(bestRes.data.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    document.title = 'MINIKI FASHION | Designer Boutique - Maternity & New Born Shop';
  }, []);

  return (
    <>
      <Hero />

      <section className="container-custom py-16">
        <SectionHeader subtitle="Explore" title="Shop by Category" />
        {loading ? (
          <Loader />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 md:gap-8">
            {categories.slice(0, 12).map((cat) => (
              <CategoryCard key={cat._id} category={cat} />
            ))}
          </div>
        )}
      </section>

      {featured.length > 0 && (
        <section className="bg-white py-16">
          <div className="container-custom">
            <SectionHeader subtitle="Curated For You" title="Featured Collection" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featured.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Banner
        title="Rental Lehengas & Bridal Jewellery"
        subtitle="Designer lehengas and bridal jewellery available on rent — everything you need for your special day."
        ctaText="Enquire Now"
        ctaLink="/contact"
        theme="gold"
      />
      <Banner
  title="Rental Maternity Gowns"
  subtitle="Designer maternity gowns available on rent — comfort with elegance."
  ctaText="Enquire Now"
  ctaLink="/contact"
  theme="pink"
/>

      {newArrivals.length > 0 && (
        <section className="container-custom py-16">
          <SectionHeader subtitle="Just Landed" title="New Arrivals" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {newArrivals.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {bestSellers.length > 0 && (
        <section className="bg-white py-16">
          <div className="container-custom">
            <SectionHeader subtitle="Customer Favorites" title="Best Sellers" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {bestSellers.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Banner
        title="Custom Stitching & Aari Work"
        subtitle="From bridal blouses to Aari embroidery — bring us your design and we'll bring it to life."
        ctaText="Book Consultation"
        ctaLink="/contact"
        theme="gold"
      />
    </>
  );
};

export default Home;
