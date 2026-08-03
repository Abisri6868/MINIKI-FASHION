import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { getProducts, deleteProduct } from '../../services/productService';
import { formatCurrency } from '../../utils/formatCurrency';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (keyword) params.keyword = keyword;
      const { data } = await getProducts(params);
      setProducts(data.products || []);
      setPages(data.pages || 1);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-heading font-bold">Products</h1>
        <Link to="/products/new" className="btn-primary"><FiPlus /> Add Product</Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-md">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search products..."
            className="input-field pl-9"
          />
        </div>
        <button type="submit" className="btn-outline">Search</button>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-pink-50">
                <th className="table-th">Product</th>
                <th className="table-th">Category</th>
                <th className="table-th">Price</th>
                <th className="table-th">Stock</th>
                <th className="table-th">Status</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="table-td text-center py-10">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="table-td text-center py-10">No products found</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id}>
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.[0]?.url || 'https://placehold.co/60x70/ffe4ee/d62d68'}
                          alt={p.name}
                          className="w-10 h-12 object-cover rounded-md"
                        />
                        <span className="font-medium line-clamp-1 max-w-[200px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="table-td">{p.category?.name}</td>
                    <td className="table-td">{formatCurrency(p.discountPrice > 0 ? p.discountPrice : p.price)}</td>
                    <td className="table-td">
                      <span className={p.totalStock === 0 ? 'text-red-500 font-medium' : ''}>{p.totalStock}</span>
                    </td>
                    <td className="table-td">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex justify-end gap-2">
                        <Link to={`/products/${p._id}/edit`} className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg">
                          <FiEdit2 size={16} />
                        </Link>
                        <button onClick={() => handleDelete(p._id, p.name)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-lg text-sm font-medium ${page === p ? 'bg-pink-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
