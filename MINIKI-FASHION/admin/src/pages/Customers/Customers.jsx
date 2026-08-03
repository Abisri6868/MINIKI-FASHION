import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { getUsers, getUser, toggleUserStatus } from '../../services/userService';
import { formatCurrency } from '../../utils/formatCurrency';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      const { data } = await getUsers(params);
      setCustomers(data.users || []);
      setPages(data.pages || 1);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const toggleExpand = async (customerId) => {
    if (expandedId === customerId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(customerId);
    try {
      const { data } = await getUser(customerId);
      setCustomerOrders(data.orders || []);
    } catch (err) {
      toast.error('Failed to load customer orders');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const { data } = await toggleUserStatus(id);
      setCustomers((prev) => prev.map((c) => (c._id === id ? data.user : c)));
      toast.success(`Customer ${data.user.isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error('Failed to update customer status');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-6">Customers</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-md">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="input-field pl-9" />
        </div>
        <button type="submit" className="btn-outline">Search</button>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-pink-50">
                <th className="table-th">Name</th>
                <th className="table-th">Email</th>
                <th className="table-th">Phone</th>
                <th className="table-th">Joined</th>
                <th className="table-th">Status</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="table-td text-center py-10">Loading...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className="table-td text-center py-10">No customers found</td></tr>
              ) : (
                customers.map((c) => (
                  <React.Fragment key={c._id}>
                    <tr>
                      <td className="table-td font-medium">{c.name}</td>
                      <td className="table-td">{c.email}</td>
                      <td className="table-td">{c.phone || '—'}</td>
                      <td className="table-td">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="table-td">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="table-td text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleToggleStatus(c._id)} className="btn-outline !py-1 !px-3 text-xs">
                            {c.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => toggleExpand(c._id)} className="text-gray-500 hover:text-pink-600">
                            {expandedId === c._id ? <FiChevronUp /> : <FiChevronDown />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === c._id && (
                      <tr>
                        <td colSpan={6} className="table-td bg-pink-50/40">
                          <p className="font-medium text-sm mb-2">Order History ({customerOrders.length})</p>
                          {customerOrders.length === 0 ? (
                            <p className="text-sm text-gray-400">No orders placed yet</p>
                          ) : (
                            <div className="space-y-2">
                              {customerOrders.map((o) => (
                                <div key={o._id} className="flex justify-between text-sm">
                                  <span>{o.orderNumber} — {o.orderStatus}</span>
                                  <span className="font-medium">{formatCurrency(o.totalPrice)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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

export default Customers;
