import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiX } from 'react-icons/fi';
import ProductCard from '../../components/ProductCard';
import Loader from '../../components/Loader';
import usePageTitle from '../../hooks/usePageTitle';
import { getProducts } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import { SIZES } from '../../utils/constants';

const SORT_OPTIONS = [
  { label: 'Newest', value: '-createdAt' },
  { label: 'Price: Low to High', value: 'price' },
  { label: 'Price: High to Low', value: '-price' },
  { label: 'Top Rated', value: '-ratingsAverage' },
];

const Shop = () => {
  usePageTitle('Shop');
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = searchParams.get('category') || '';
  const keyword = searchParams.get('keyword') || '';
  const sort = searchParams.get('sort') || '-createdAt';
  const page = Number(searchParams.get('page')) || 1;
  const size = searchParams.get('size') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data.categories || []));
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sort, page, limit: 12 };
      if (category) {
        const catObj = categories.find((c) => c.name === category);
        if (catObj) params.category = catObj._id;
      }
      if (keyword) params.keyword = keyword;
      if (size) params.size = size;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const { data } = await getProducts(params);
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, keyword, sort, page, size, minPrice, maxPrice, categories.length]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({});

  return (
    <div className="container-custom py-10">
      <div className="mb-8">
        <h1 className="section-title text-left">{category || 'Shop All Products'}</h1>
        {keyword && <p className="text-gray-500 mt-2">Search results for "{keyword}" ({total} items)</p>}
      </div>

      <div className="flex gap-8">
        {/* Filters sidebar */}
        <aside className={`w-64 flex-shrink-0 ${filtersOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="bg-white rounded-2xl shadow-md p-6 sticky top-28">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg">Filters</h3>
              <button onClick={clearFilters} className="text-xs text-pink-600 hover:underline">Clear all</button>
            </div>

            <div className="mb-6">
              <p className="font-medium text-sm mb-3">Category</p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                {categories.map((cat) => (
                  <label key={cat._id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={category === cat.name}
                      onChange={() => updateParam('category', cat.name)}
                      className="accent-pink-600"
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="font-medium text-sm mb-3">Size</p>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateParam('size', size === s ? '' : s)}
                    className={`px-3 py-1 text-xs rounded-full border ${
                      size === s ? 'bg-pink-600 text-white border-pink-600' : 'border-gray-300 text-gray-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium text-sm mb-3">Price Range (₹)</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  defaultValue={minPrice}
                  onBlur={(e) => updateParam('minPrice', e.target.value)}
                  className="input-field !py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  defaultValue={maxPrice}
                  onBlur={(e) => updateParam('maxPrice', e.target.value)}
                  className="input-field !py-2 text-sm"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setFiltersOpen((s) => !s)}
              className="lg:hidden flex items-center gap-2 text-sm font-medium border border-gray-300 px-4 py-2 rounded-full"
            >
              {filtersOpen ? <FiX /> : <FiFilter />} Filters
            </button>
            <p className="hidden lg:block text-sm text-gray-500">{total} products found</p>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="input-field !py-2 !w-auto text-sm"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <Loader />
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-500">No products found. Try adjusting your filters.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>

              {pages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => updateParam('page', p)}
                      className={`h-10 w-10 rounded-full text-sm font-medium ${
                        p === page ? 'bg-pink-600 text-white' : 'bg-white border border-gray-300 text-gray-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
