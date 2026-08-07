import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Products from './pages/Products/Products';
import ProductForm from './pages/Products/ProductForm';
import Categories from './pages/Categories/Categories';
import Orders from './pages/Orders/Orders';
import Customers from './pages/Customers/Customers';
import Offers from './pages/Offers/Offers';
import ShippingSettings from './pages/ShippingSettings/ShippingSettings';
import Messages from './pages/Messages/Messages';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/:id/edit" element={<ProductForm />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/shipping-settings" element={<ShippingSettings />} />
        <Route path="/messages" element={<Messages />} />
      </Route>
    </Routes>
  );
}

export default App;
