import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPackage, FiChevronDown, FiChevronUp, FiX, FiDownload, FiRefreshCw, FiTruck, FiCreditCard } from 'react-icons/fi';
import Loader from '../../components/Loader';
import usePageTitle from '../../hooks/usePageTitle';
import { getMyOrders, cancelOrder, reorderItems, downloadInvoice } from '../../services/orderService';
import { retryPayment, confirmRetryPayment } from '../../services/paymentService';
import { formatCurrency } from '../../utils/formatCurrency';
import { useAuth } from '../../context/AuthContext';

const STATUS_STEPS = ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const statusColor = (status) => {
  if (status === 'Cancelled' || status === 'Returned') return 'bg-red-100 text-red-700';
  if (status === 'Delivered') return 'bg-green-100 text-green-700';
  if (status === 'Pending Approval' || status === 'Pending') return 'bg-amber-100 text-amber-700';
  return 'bg-gold-100 text-gold-700';
};

const Orders = () => {
  usePageTitle('My Orders');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await getMyOrders();
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await cancelOrder(id, 'Cancelled by customer');
      toast.success('Order cancelled');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleReorder = async (id) => {
    setBusyId(id);
    try {
      const { data } = await reorderItems(id);
      toast.success(data.message || 'Items added to cart');
      navigate('/cart');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reorder');
    } finally {
      setBusyId(null);
    }
  };

  const handleDownloadInvoice = async (order) => {
    setBusyId(order._id);
    try {
      await downloadInvoice(order._id, order.orderNumber);
    } catch (err) {
      toast.error('Failed to download invoice');
    } finally {
      setBusyId(null);
    }
  };

  const handleRetryPayment = async (order) => {
    setBusyId(order._id);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway');
        setBusyId(null);
        return;
      }
      const { data } = await retryPayment(order._id);
      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'MINIKI FASHION',
        description: `Retry payment for #${order.orderNumber}`,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            await confirmRetryPayment(order._id, response);
            toast.success('Payment successful!');
            fetchOrders();
          } catch (err) {
            toast.error('Payment verification failed');
          } finally {
            setBusyId(null);
          }
        },
        modal: { ondismiss: () => setBusyId(null) },
        prefill: { name: order.shippingAddress?.fullName, contact: order.shippingAddress?.phone, email: user?.email },
        theme: { color: '#d62d68' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to retry payment');
      setBusyId(null);
    }
  };

  if (loading) return <Loader fullScreen />;

  if (orders.length === 0) {
    return (
      <div className="container-custom py-24 text-center">
        <FiPackage size={48} className="mx-auto text-pink-300 mb-4" />
        <h2 className="text-2xl font-heading font-bold mb-2">No orders yet</h2>
        <p className="text-gray-500">Your order history will appear here.</p>
      </div>
    );
  }

  return (
    <div className="container-custom py-10 max-w-4xl">
      <h1 className="section-title text-left mb-8">My Orders</h1>

      <div className="space-y-5">
        {orders.map((order) => {
          const isExpanded = expandedId === order._id;
          const currentStepIndex = STATUS_STEPS.indexOf(order.orderStatus);
          const canCancel = !['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'].includes(order.orderStatus);
          const needsPayment = order.paymentMethod === 'razorpay' && !order.isPaid && order.orderStatus !== 'Cancelled';

          return (
            <div key={order._id} className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="p-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">Order #{order.orderNumber}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor(order.adminApproval === 'Pending' ? 'Pending Approval' : order.orderStatus)}`}>
                  {order.adminApproval === 'Pending' ? 'Pending Approval' : order.orderStatus}
                </span>
                <span className="font-heading font-bold text-pink-700">{formatCurrency(order.totalPrice)}</span>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order._id)}
                  className="text-gray-500 hover:text-pink-600"
                >
                  {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-pink-100 p-5">
                  {needsPayment && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
                      <p className="text-sm text-red-700">Payment for this order was not completed.</p>
                      <button
                        onClick={() => handleRetryPayment(order)}
                        disabled={busyId === order._id}
                        className="btn-primary !py-2 !px-4 text-sm"
                      >
                        <FiCreditCard size={14} /> Retry Payment
                      </button>
                    </div>
                  )}

                  {/* Step tracker */}
                  {!['Cancelled', 'Returned'].includes(order.orderStatus) && order.adminApproval === 'Accepted' && (
                    <div className="flex items-center justify-between mb-6 relative">
                      {STATUS_STEPS.map((step, i) => (
                        <div key={step} className="flex-1 flex flex-col items-center relative">
                          {i > 0 && (
                            <div
                              className={`absolute top-3 right-1/2 w-full h-0.5 ${
                                i <= currentStepIndex ? 'bg-pink-600' : 'bg-gray-200'
                              }`}
                            />
                          )}
                          <div
                            className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ${
                              i <= currentStepIndex ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {i + 1}
                          </div>
                          <p className="text-[10px] mt-2 text-center text-gray-500">{step}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {order.estimatedDeliveryDate && !['Cancelled', 'Delivered'].includes(order.orderStatus) && (
                    <p className="flex items-center gap-2 text-sm text-gray-600 mb-6 bg-pink-50/60 rounded-lg px-4 py-2.5 w-fit">
                      <FiTruck className="text-pink-600" /> Estimated Delivery: <span className="font-semibold">{new Date(order.estimatedDeliveryDate).toDateString()}</span>
                    </p>
                  )}

                  {/* Detailed tracking history (Flipkart-style timeline with timestamps) */}
                  {order.trackingHistory?.length > 0 && (
                    <div className="mb-6">
                      <p className="font-medium text-sm mb-3">Tracking History</p>
                      <ol className="relative border-l-2 border-pink-200 ml-2 space-y-4">
                        {order.trackingHistory.map((t, i) => (
                          <li key={i} className="ml-4">
                            <div className="absolute w-2.5 h-2.5 bg-pink-600 rounded-full -left-[5px] mt-1.5" />
                            <p className="text-sm font-medium">{t.status}</p>
                            {t.note && <p className="text-xs text-gray-500">{t.note}</p>}
                            <p className="text-xs text-gray-400">{new Date(t.date).toLocaleString('en-IN')}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="space-y-3 mb-5">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <img src={item.image} alt={item.name} className="w-14 h-16 object-cover rounded-lg" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity} {item.variant?.size && `• Size: ${item.variant.size}`} {item.variant?.color && `• Color: ${item.variant.color}`}
                          </p>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-sm text-gray-600 mb-4">
                    <p className="font-medium text-gray-800 mb-1">Shipping Address</p>
                    <p>{order.shippingAddress.fullName}, {order.shippingAddress.phone}</p>
                    <p>{order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                  </div>

                  {order.refundStatus && order.refundStatus !== 'None' && (
                    <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-2.5 mb-4 w-fit">
                      Refund Status: <span className="font-semibold">{order.refundStatus}</span> ({formatCurrency(order.refundAmount)})
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4">
                    {canCancel && (
                      <button onClick={() => handleCancel(order._id)} className="flex items-center gap-2 text-sm text-red-600 font-medium hover:underline">
                        <FiX /> Cancel Order
                      </button>
                    )}
                    {order.orderStatus === 'Delivered' && (
                      <button onClick={() => handleReorder(order._id)} disabled={busyId === order._id} className="flex items-center gap-2 text-sm text-pink-600 font-medium hover:underline">
                        <FiRefreshCw /> Reorder
                      </button>
                    )}
                    <button onClick={() => handleDownloadInvoice(order)} disabled={busyId === order._id} className="flex items-center gap-2 text-sm text-gray-600 font-medium hover:underline">
                      <FiDownload /> Download Invoice
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
