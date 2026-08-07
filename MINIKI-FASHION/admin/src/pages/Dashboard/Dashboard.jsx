import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { FiDollarSign, FiShoppingBag, FiUsers, FiBox, FiClock, FiCheckCircle, FiCalendar, FiTruck, FiCreditCard, FiAlertTriangle } from 'react-icons/fi';
import { getDashboardStats } from '../../services/orderService';
import { formatCurrency } from '../../utils/formatCurrency';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-heading font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(({ data }) => setStats(data.stats))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 rounded-full border-4 border-pink-200 border-t-pink-600 animate-spin" />
      </div>
    );
  }

  if (!stats) return <p>Failed to load dashboard.</p>;

  const salesChartData = (stats.salesByMonth || []).map((s) => ({
    name: `${MONTH_NAMES[s._id.month - 1]} '${String(s._id.year).slice(-2)}`,
    revenue: s.revenue,
    orders: s.orders,
  }));

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-1">Sales Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Welcome back! Here's what's happening with MINIKI FASHION.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FiDollarSign} label="Total Revenue" value={formatCurrency(stats.totalRevenue)} color="bg-pink-600" />
        <StatCard icon={FiShoppingBag} label="Total Orders" value={stats.totalOrders} color="bg-gold-500" />
        <StatCard icon={FiUsers} label="Customers" value={stats.totalUsers} color="bg-purple-500" />
        <StatCard icon={FiBox} label="Products" value={stats.totalProducts} color="bg-blue-500" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FiClock} label="Pending" value={stats.pendingOrders} color="bg-orange-400" />
        <StatCard icon={FiBox} label="Processing" value={stats.processingOrders} color="bg-cyan-500" />
        <StatCard icon={FiCheckCircle} label="Delivered" value={stats.deliveredOrders} color="bg-green-500" />
        <StatCard icon={FiClock} label="Cancelled" value={stats.cancelledOrders} color="bg-red-400" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FiCalendar} label="Today's Orders" value={stats.todaysOrders} color="bg-indigo-500" />
        <StatCard icon={FiDollarSign} label="Monthly Revenue" value={formatCurrency(stats.monthlyRevenue)} color="bg-pink-500" />
        <StatCard icon={FiTruck} label="COD Orders" value={stats.codOrders} color="bg-amber-500" />
        <StatCard icon={FiCreditCard} label="Online Paid" value={stats.onlinePaidOrders} color="bg-teal-500" />
      </div>

      {stats.lowStockProducts?.length > 0 && (
        <div className="card p-6 mb-8 border border-red-100">
          <h3 className="font-heading font-bold mb-4 flex items-center gap-2 text-red-600">
            <FiAlertTriangle size={18} /> Low Stock Alert
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.lowStockProducts.map((p) => (
              <div key={p._id} className="flex items-center gap-3 bg-red-50 rounded-xl p-3">
                <img src={p.images?.[0]?.url} alt="" className="w-10 h-12 object-cover rounded" />
                <div>
                  <p className="text-xs font-medium line-clamp-1">{p.name}</p>
                  <p className="text-xs text-red-600 font-semibold">{p.totalStock} left</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="font-heading font-bold mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={salesChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffe4ee" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#d62d68" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="font-heading font-bold mb-4">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.topProducts} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f9edc7" />
              <XAxis type="number" fontSize={12} />
              <YAxis type="category" dataKey="name" width={120} fontSize={11} />
              <Tooltip />
              <Bar dataKey="totalSold" fill="#d19620" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="font-heading font-bold mb-4">Customer Growth</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={(stats.customerGrowth || []).map((c) => ({ name: `${MONTH_NAMES[c._id.month - 1]} '${String(c._id.year).slice(-2)}`, count: c.count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffe4ee" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#ec4d84" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="font-heading font-bold mb-4">Orders by Status</h3>
          <div className="space-y-3 mt-2">
            {(stats.ordersByStatus || []).map((s) => (
              <div key={s._id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{s._id}</span>
                <span className="font-semibold">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-heading font-bold mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-pink-50">
                <th className="table-th">Order #</th>
                <th className="table-th">Customer</th>
                <th className="table-th">Status</th>
                <th className="table-th">Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((o) => (
                <tr key={o._id}>
                  <td className="table-td font-medium">{o.orderNumber}</td>
                  <td className="table-td">{o.user?.name}</td>
                  <td className="table-td">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gold-100 text-gold-700">{o.orderStatus}</span>
                  </td>
                  <td className="table-td font-medium">{formatCurrency(o.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
