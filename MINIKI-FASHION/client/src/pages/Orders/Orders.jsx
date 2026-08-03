import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPackage, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import Loader from '../../components/Loader';
import usePageTitle from '../../hooks/usePageTitle';
import { getMyOrders, cancelOrder } from '../../services/orderService';
import { formatCurrency } from '../../utils/formatCurrency';

const STATUS_STEPS = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

const statusColor = (status) => {
  if (status === 'Cancelled' || status === 'Returned') return 'bg-red-100 text-red-700';
  if (status === 'Delivered') return 'bg-green-100 text-green-700';
  return 'bg-gold-100 text-gold-700';
};

const Orders = () => {
  usePageTitle('My Orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

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

          return (
            <div key={order._id} className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="p-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">Order #{order.orderNumber}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor(order.orderStatus)}`}>
                  {order.orderStatus}
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
                  {/* Tracking */}
                  {!['Cancelled', 'Returned'].includes(order.orderStatus) && (
                    <div className="flex items-center justify-between mb-8 relative">
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

                  <div className="space-y-3 mb-5">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <img src={item.image} alt={item.name} className="w-14 h-16 object-cover rounded-lg" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity} {item.variant?.size && `• Size: ${item.variant.size}`}
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

                  {canCancel && (
                    <button onClick={() => handleCancel(order._id)} className="flex items-center gap-2 text-sm text-red-600 font-medium hover:underline">
                      <FiX /> Cancel Order
                    </button>
                  )}
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
