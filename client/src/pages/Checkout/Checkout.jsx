import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import usePageTitle from '../../hooks/usePageTitle';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { createRazorpayOrder, verifyPayment } from '../../services/paymentService';
import { createOrder } from '../../services/orderService';
import { applyCoupon as applyCouponApi } from '../../services/couponService';
import { getShippingSettings, estimateDelivery } from '../../services/shippingService';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Checkout = () => {
  usePageTitle('Checkout');
  const { cart, cartTotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [deliveryMethod, setDeliveryMethod] = useState('Standard');
  const [shippingSettings, setShippingSettings] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
    }
    getShippingSettings().then(({ data }) => setShippingSettings(data.settings)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-estimate delivery whenever pincode or delivery method changes
  useEffect(() => {
    if (!address.pincode || address.pincode.length < 6) {
      setEstimate(null);
      return;
    }
    const t = setTimeout(() => {
      estimateDelivery(address.pincode, deliveryMethod)
        .then(({ data }) => setEstimate(data.estimate))
        .catch(() => setEstimate(null));
    }, 400);
    return () => clearTimeout(t);
  }, [address.pincode, deliveryMethod]);

  const shipping = estimate
    ? (cartTotal >= estimate.freeShippingThreshold ? 0 : estimate.shippingCharge)
    : (shippingSettings ? (cartTotal >= shippingSettings.freeShippingThreshold ? 0 : shippingSettings.shippingCharge) : 99);
  const totalPrice = Math.max(0, cartTotal + shipping - discount);

  const handleAddressChange = (e) => {
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const { data } = await applyCouponApi(couponCode.trim(), cartTotal);
      setDiscount(data.discountAmount);
      toast.success(`Coupon applied! You saved ${formatCurrency(data.discountAmount)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
      setDiscount(0);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const buildOrderItems = () =>
    cart.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images?.[0]?.url || '',
      price: item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price,
      quantity: item.quantity,
      variant: item.variant,
    }));

  const requiredFieldsFilled = () =>
    address.fullName && address.phone && address.addressLine1 && address.city && address.state && address.pincode;

  const finalizeOrder = async (paymentResult = {}) => {
    const { data } = await createOrder({
      items: buildOrderItems(),
      shippingAddress: address,
      paymentMethod,
      deliveryMethod,
      itemsPrice: cartTotal,
      shippingPrice: shipping,
      discountAmount: discount,
      couponCode,
      totalPrice,
      paymentResult,
    });
    await clear();
    toast.success('Order placed successfully!');
    navigate(`/orders`, { state: { newOrderId: data.order._id } });
  };

  const handlePlaceOrder = async () => {
    if (!requiredFieldsFilled()) {
      toast.error('Please fill in all required shipping details');
      return;
    }

    setPlacingOrder(true);
    try {
      if (paymentMethod === 'cod') {
        await finalizeOrder({});
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please try again.');
        setPlacingOrder(false);
        return;
      }

      const { data: orderData } = await createRazorpayOrder({
        amount: totalPrice,
        receipt: `miniki_${Date.now()}`,
      });

      const options = {
        key: orderData.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'MINIKI FASHION',
        description: 'Designer Boutique Purchase',
        order_id: orderData.order.id,
        handler: async (response) => {
          try {
            await verifyPayment(response);
            await finalizeOrder(response);
          } catch (err) {
            toast.error('Payment verification failed. Please contact support.');
          } finally {
            setPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: () => setPlacingOrder(false),
        },
        prefill: {
          name: address.fullName,
          contact: address.phone,
          email: user?.email,
        },
        theme: { color: '#d62d68' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setPlacingOrder(false);
    }
  };

  return (
    <div className="container-custom py-10">
      <h1 className="section-title text-left mb-8">Checkout</h1>
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="font-heading font-bold text-lg mb-4">Shipping Address</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input name="fullName" value={address.fullName} onChange={handleAddressChange} placeholder="Full Name *" className="input-field" required />
              <input name="phone" value={address.phone} onChange={handleAddressChange} placeholder="Phone Number *" className="input-field" required />
              <input name="addressLine1" value={address.addressLine1} onChange={handleAddressChange} placeholder="Address Line 1 *" className="input-field md:col-span-2" required />
              <input name="addressLine2" value={address.addressLine2} onChange={handleAddressChange} placeholder="Address Line 2" className="input-field md:col-span-2" />
              <input name="city" value={address.city} onChange={handleAddressChange} placeholder="City *" className="input-field" required />
              <input name="state" value={address.state} onChange={handleAddressChange} placeholder="State *" className="input-field" required />
              <input name="pincode" value={address.pincode} onChange={handleAddressChange} placeholder="Pincode *" className="input-field" required />
              <input name="country" value={address.country} onChange={handleAddressChange} placeholder="Country" className="input-field" disabled />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="font-heading font-bold text-lg mb-4">Delivery Options</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <label className="flex items-center gap-3 border rounded-xl p-4 cursor-pointer has-[:checked]:border-pink-600 has-[:checked]:bg-pink-50">
                <input type="radio" checked={deliveryMethod === 'Standard'} onChange={() => setDeliveryMethod('Standard')} className="accent-pink-600" />
                <span className="text-sm font-medium">
                  Standard Delivery
                  {shippingSettings && <span className="block text-xs text-gray-400">{shippingSettings.standardDeliveryDays.min}-{shippingSettings.standardDeliveryDays.max} days</span>}
                </span>
              </label>
              <label className="flex items-center gap-3 border rounded-xl p-4 cursor-pointer has-[:checked]:border-pink-600 has-[:checked]:bg-pink-50">
                <input type="radio" checked={deliveryMethod === 'Express'} onChange={() => setDeliveryMethod('Express')} className="accent-pink-600" />
                <span className="text-sm font-medium">
                  Express Delivery
                  {shippingSettings && <span className="block text-xs text-gray-400">{shippingSettings.expressDeliveryDays.min}-{shippingSettings.expressDeliveryDays.max} days</span>}
                </span>
              </label>
            </div>
            {estimate && (
              <p className="text-sm text-gray-600">
                {estimate.serviceable ? (
                  <>Estimated Delivery: <span className="font-semibold text-pink-700">{new Date(estimate.estimatedDeliveryDate).toDateString()}</span></>
                ) : (
                  <span className="text-red-600">This pincode is currently not serviceable for delivery.</span>
                )}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="font-heading font-bold text-lg mb-4">Payment Method</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 border rounded-xl p-4 cursor-pointer has-[:checked]:border-pink-600 has-[:checked]:bg-pink-50">
                <input type="radio" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} className="accent-pink-600" />
                <span className="font-medium text-sm">Pay Online (Razorpay) — Cards, UPI, Netbanking, Wallets</span>
              </label>
              {(!shippingSettings || shippingSettings.codAvailable) && (!estimate || estimate.codAvailable) ? (
                <label className="flex items-center gap-3 border rounded-xl p-4 cursor-pointer has-[:checked]:border-pink-600 has-[:checked]:bg-pink-50">
                  <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-pink-600" />
                  <span className="font-medium text-sm">
                    Cash on Delivery
                    {shippingSettings?.codExtraCharge > 0 && <span className="text-xs text-gray-400"> (+{formatCurrency(shippingSettings.codExtraCharge)})</span>}
                  </span>
                </label>
              ) : (
                <p className="text-xs text-gray-400 px-4">Cash on Delivery is not available for this address.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 h-fit sticky top-28">
          <h3 className="font-heading font-bold text-lg mb-4">Order Summary</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
            {cart.map((item) => (
              <div key={item._id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.product.name} × {item.quantity}</span>
                <span className="font-medium">
                  {formatCurrency((item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Coupon code"
              className="input-field !py-2 text-sm"
            />
            <button onClick={handleApplyCoupon} disabled={applyingCoupon} className="btn-outline !py-2 !px-4 text-sm whitespace-nowrap">
              Apply
            </button>
          </div>

          <div className="border-t border-pink-100 pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(cartTotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>}
            <div className="flex justify-between font-heading font-bold text-lg pt-2 border-t border-pink-100">
              <span>Total</span><span className="text-pink-700">{formatCurrency(totalPrice)}</span>
            </div>
          </div>

          <button onClick={handlePlaceOrder} disabled={placingOrder} className="btn-primary w-full mt-6">
            {placingOrder ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order' : `Pay ${formatCurrency(totalPrice)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
