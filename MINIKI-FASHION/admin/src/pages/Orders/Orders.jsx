import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { getOrders, updateOrderStatus } from '../../services/orderService';
import { formatCurrency } from '../../utils/formatCurrency';

const STATUS_OPTIONS = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'];

const statusColor = (status) => {
  if (status === 'Cancelled' || status === 'Returned') return 'bg-red-100 text-red-700';
  if (status === 'Delivered') return 'bg-green-100 text-green-700';
  return 'bg-gold-100 text-gold-700';
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await getOrders(params);
      setOrders(data.orders || []);
      setPages(data.pages || 1);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus, `Status updated to ${newStatus}`);
      toast.success('Order status updated');
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-heading font-bold">Orders</h1>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field !w-auto"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-pink-50">
                <th className="table-th">Order #</th>
                <th className="table-th">Customer</th>
                <th className="table-th">Date</th>
                <th className="table-th">Total</th>
                <th className="table-th">Status</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="table-td text-center py-10">Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="table-td text-center py-10">No orders found</td></tr>
              ) : (
                orders.map((order) => (
                  <React.Fragment key={order._id}>
                    <tr>
                      <td className="table-td font-medium">{order.orderNumber}</td>
                      <td className="table-td">
                        <p>{order.user?.name}</p>
                        <p className="text-xs text-gray-400">{order.user?.email}</p>
                      </td>
                      <td className="table-td">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="table-td font-medium">{formatCurrency(order.totalPrice)}</td>
                      <td className="table-td">
                        <select
                          value={order.orderStatus}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1.5 rounded-lg border-0 ${statusColor(order.orderStatus)}`}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="table-td text-right">
                        <button
                          onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                          className="text-gray-500 hover:text-pink-600"
                        >
                          {expandedId === order._id ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                      </td>
                    </tr>
                    {expandedId === order._id && (
                      <tr>
                        <td colSpan={6} className="table-td bg-pink-50/40">
                          <div className="py-2">
                            <p className="font-medium text-sm mb-2">Items ({order.items.length})</p>
                            <div className="space-y-2 mb-4">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm">
                                  <img src={item.image} alt="" className="w-10 h-12 object-cover rounded" />
                                  <span>{item.name} × {item.quantity} {item.variant?.size && `(${item.variant.size})`}</span>
                                  <span className="ml-auto font-medium">{formatCurrency(item.price * item.quantity)}</span>
                                </div>
                              ))}
                            </div>
                            <p className="font-medium text-sm mb-1">Shipping Address</p>
                            <p className="text-sm text-gray-600">
                              {order.shippingAddress?.fullName}, {order.shippingAddress?.phone}<br />
                              {order.shippingAddress?.addressLine1}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                            </p>
                          </div>
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

export default Orders;
