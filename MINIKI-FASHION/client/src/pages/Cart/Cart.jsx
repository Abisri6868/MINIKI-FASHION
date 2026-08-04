import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingBag } from 'react-icons/fi';
import CartItem from '../../components/CartItem';
import usePageTitle from '../../hooks/usePageTitle';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatCurrency';

const Cart = () => {
  usePageTitle('Shopping Cart');
  const { cart, loading, cartTotal, cartCount } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  if (!isAuthenticated) {
    return (
      <div className="container-custom py-24 text-center">
        <FiShoppingBag size={48} className="mx-auto text-pink-300 mb-4" />
        <h2 className="text-2xl font-heading font-bold mb-2">Please login to view your cart</h2>
        <Link to="/login" className="btn-primary mt-4 inline-flex">Login</Link>
      </div>
    );
  }

  if (!loading && cart.length === 0) {
    return (
      <div className="container-custom py-24 text-center">
        <FiShoppingBag size={48} className="mx-auto text-pink-300 mb-4" />
        <h2 className="text-2xl font-heading font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
        <Link to="/shop" className="btn-primary inline-flex">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-10">
      <h1 className="section-title text-left mb-8">Shopping Cart ({cartCount})</h1>
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6">
          {cart.map((item) => (
            <CartItem key={item._id} item={item} />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 h-fit sticky top-28">
          <h3 className="font-heading font-bold text-lg mb-4">Order Summary</h3>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-black-500">Subtotal</span>
            <span className="font-medium">{formatCurrency(cartTotal)}</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-black-500">Shipping</span>
            <span className="font-medium">{cartTotal >= 2999 ? 'Free' : formatCurrency(50)}</span>
          </div>
          <div className="border-t border-pink-100 pt-4 flex justify-between font-heading font-bold text-lg">
            <span>Total</span>
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(cartTotal >= 2999 ? cartTotal : cartTotal + 50)}</span>
          </div>
          <button onClick={handleCheckout} className="btn-primary w-full mt-6">Proceed to Checkout</button>
          <Link to="/shop" className="block text-center text-sm text-pink-600 mt-4 hover:underline">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
