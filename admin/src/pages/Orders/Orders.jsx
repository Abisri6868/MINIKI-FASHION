import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiChevronDown, FiChevronUp, FiCheck, FiX, FiDownload, FiTag, FiTruck } from 'react-icons/fi';
import { getOrders, acceptOrder, rejectOrder, updateOrderStatus, invoiceDownloadUrl, shippingLabelUrl } from '../../services/orderService';
import { formatCurrency } from '../../utils/formatCurrency';
import api from '../../services/api';

const STATUS_OPTIONS = ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Returned'];

const statusColor = (status) => {
  if (status === 'Cancelled' || status === 'Returned') return 'bg-red-100 text-red-700';
  if (status === 'Delivered') return 'bg-green-100 text-green-700';
  if (status === 'Pending Approval') return 'bg-amber-100 text-amber-700';
  return 'bg-gold-100 text-gold-700';
};

const openAuthedFile = async (url, filename) => {
  try {
    const res = await api.get(url.replace(api.defaults.baseURL, ''), { responseType: 'blob' });
    const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    toast.error('Failed to download file');
  }
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [busyId, setBusyId] = useState(null);

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

  const handleAccept = async (orderId) => {
    setBusyId(orderId);
    try {
      const { data } = await acceptOrder(orderId);
      toast.success('Order accepted — processing started');
      setOrders((prev) => prev.map((o) => (o._id === orderId ? data.order : o)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept order');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (orderId) => {
    const reason = window.prompt('Reason for rejecting this order?', 'Out of stock');
    if (reason === null) return;
    setBusyId(orderId);
    try {
      const { data } = await rejectOrder(orderId, reason);
      toast.success('Order rejected');
      setOrders((prev) => prev.map((o) => (o._id === orderId ? data.order : o)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject order');
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { data } = await updateOrderStatus(orderId, newStatus, `Status updated to ${newStatus}`);
      toast.success('Order status updated');
      setOrders((prev) => prev.map((o) => (o._id === orderId ? data.order : o)));
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
          <option value="Pending Approval">Pending Approval</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="Cancelled">Cancelled</option>
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
                <th className="table-th">Payment</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="table-td text-center py-10">Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="table-td text-center py-10">No orders found</td></tr>
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
                        <span className={`text-xs px-2 py-1 rounded-full ${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {order.paymentMethod === 'cod' ? 'COD' : order.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                        {order.refundStatus && order.refundStatus !== 'None' && (
                          <span className="block text-[10px] text-red-500 mt-1">Refund: {order.refundStatus}</span>
                        )}
                      </td>
                      <td className="table-td">
                        {order.adminApproval === 'Pending' ? (
                          <span className={`text-xs font-semibold px-2 py-1.5 rounded-lg inline-block ${statusColor('Pending Approval')}`}>
                            Pending Approval
                          </span>
                        ) : (
                          <select
                            value={order.orderStatus}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            disabled={order.orderStatus === 'Cancelled'}
                            className={`text-xs font-semibold px-2 py-1.5 rounded-lg border-0 ${statusColor(order.orderStatus)}`}
                          >
                            {order.orderStatus === 'Cancelled' && <option value="Cancelled">Cancelled</option>}
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="table-td">
                        {order.adminApproval === 'Pending' ? (
                          <div className="flex gap-2">
                            <button
                              disabled={busyId === order._id}
                              onClick={() => handleAccept(order._id)}
                              className="btn-primary !px-3 !py-1.5 !text-xs"
                              title="Accept order"
                            >
                              <FiCheck size={14} /> Accept
                            </button>
                            <button
                              disabled={busyId === order._id}
                              onClick={() => handleReject(order._id)}
                              className="btn-danger !px-3 !py-1.5"
                              title="Reject order"
                            >
                              <FiX size={14} /> Reject
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => openAuthedFile(invoiceDownloadUrl(order._id), `invoice-${order.orderNumber}.pdf`)}
                              className="btn-outline !px-2.5 !py-1.5 !text-xs"
                              title="Download Invoice"
                            >
                              <FiDownload size={14} />
                            </button>
                            <button
                              onClick={() => openAuthedFile(shippingLabelUrl(order._id), `label-${order.orderNumber}.pdf`)}
                              className="btn-outline !px-2.5 !py-1.5 !text-xs"
                              title="Download Shipping Label"
                            >
                              <FiTag size={14} />
                            </button>
                          </div>
                        )}
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
                        <td colSpan={8} className="table-td bg-pink-50/40">
                          <div className="py-2 grid md:grid-cols-2 gap-6">
                            <div>
                              <p className="font-medium text-sm mb-2">Items ({order.items.length})</p>
                              <div className="space-y-2 mb-4">
                                {order.items.map((item, i) => (
                                  <div key={i} className="flex items-center gap-3 text-sm">
                                    <img src={item.image} alt="" className="w-10 h-12 object-cover rounded" />
                                    <span>{item.name} × {item.quantity} {item.variant?.size && `(${item.variant.size} / ${item.variant.color})`}</span>
                                    <span className="ml-auto font-medium">{formatCurrency(item.price * item.quantity)}</span>
                                  </div>
                                ))}
                              </div>
                              <p className="font-medium text-sm mb-1">Shipping Address</p>
                              <p className="text-sm text-gray-600">
                                {order.shippingAddress?.fullName}, {order.shippingAddress?.phone}<br />
                                {order.shippingAddress?.addressLine1}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                              </p>
                              {order.estimatedDeliveryDate && (
                                <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                                  <FiTruck size={14} /> Est. Delivery: {new Date(order.estimatedDeliveryDate).toDateString()}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm mb-2">Tracking Timeline</p>
                              <ol className="relative border-l-2 border-pink-200 ml-2 space-y-4">
                                {(order.trackingHistory || []).map((t, i) => (
                                  <li key={i} className="ml-4">
                                    <div className="absolute w-2.5 h-2.5 bg-pink-600 rounded-full -left-[5px] mt-1.5" />
                                    <p className="text-sm font-medium">{t.status}</p>
                                    {t.note && <p className="text-xs text-gray-500">{t.note}</p>}
                                    <p className="text-xs text-gray-400">{new Date(t.date).toLocaleString('en-IN')}</p>
                                  </li>
                                ))}
                              </ol>
                            </div>
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
