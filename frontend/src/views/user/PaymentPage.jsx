import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { useCart } from '../../context/CartContext';
import './PaymentPage.css';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();

  const {
    shippingAddress,
    cartItems = [],
    grandTotal = 0,
    subTotal = 0,
    discount = 0,
    shippingFee = 0,
    tax = 0,
    appliedCoupon = null
  } = location.state || {};

  const [paymentMode, setPaymentMode] = useState('Cash On Delivery');
  const [loading, setLoading] = useState(false);

  const totalAmount = Number(grandTotal || subTotal || 0);

  
  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Razorpay script failed to load'));
      document.body.appendChild(script);
    });
  };

  const createOrderInDB = async (paymentDetails = {}) => {
    const payload = {
      items: cartItems.map((item) => ({
        productId: item.productId || item._id,
        quantity: item.quantity
      })),
      shippingAddress: {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        houseName: shippingAddress.houseName || shippingAddress.addressLine || '',
        locality: shippingAddress.locality || shippingAddress.street || '',
        city: shippingAddress.city,
        state: shippingAddress.state || '',
        country: shippingAddress.country || 'India',
        pincode: shippingAddress.pincode || shippingAddress.zipCode || ''
      },
      paymentMethod: paymentMode,
      subtotal: subTotal,
      tax,
      shippingFee,
      discount,
      couponCode: appliedCoupon || '',
      ...paymentDetails
    };

    const res = await API.post('/user/orders', payload);
    return res.data;
  };

  
  const handleRazorpayPayment = async () => {
    try {
      await loadRazorpayScript();

      
      const { data } = await API.post('/razorpay/create-order', {
        amount: totalAmount
      });

      if (!data?.success) {
        throw new Error('Failed to create Razorpay order');
      }

     
      return new Promise((resolve, reject) => {
        const options = {
          key: data.keyId,
          amount: data.order.amount,
          currency: data.order.currency,
          order_id: data.order.id,
          name: 'BagHub',
          description: 'Order Payment',
          image: 'https://via.placeholder.com/100?text=BagHub',
          handler: async (response) => {
            try {
              
              const verifyRes = await API.post('/razorpay/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              if (!verifyRes.data?.success) {
                throw new Error('Payment verification failed');
              }

              
              const orderRes = await createOrderInDB({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                isPaid: true
              });

              resolve(orderRes);
            } catch (err) {
              reject(err);
            }
          },
          prefill: {
            name: shippingAddress?.name || '',
            contact: shippingAddress?.phone || ''
          },
          theme: { color: '#03544c' },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled by user'))
          }
        };

        const rzp = new window.Razorpay(options);

        rzp.on('payment.failed', (response) => {
          reject(new Error(response.error?.description || 'Payment failed'));
        });

        rzp.open();
      });
    } catch (error) {
      console.error('Razorpay payment error:', error);
      throw error;
    }
  };

  const handlePlaceOrder = async () => {
    if (!shippingAddress || !cartItems.length) {
      alert('Please select a shipping address and cart items.');
      return;
    }

    try {
      setLoading(true);
      let orderResponse;

      if (paymentMode === 'RazorPay') {
        
        orderResponse = await handleRazorpayPayment();
      } else {
       
        orderResponse = await createOrderInDB();
      }

      if (orderResponse?.success) {
        if (clearCart) await clearCart();

        navigate('/order-success', {
          state: {
            orderId: orderResponse.order?.orderId || 'ORD-000000',
            amount: orderResponse.order?.totalAmount || totalAmount,
            paymentMethod: paymentMode,
            shippingAddress,
            orderItems: cartItems,
            estimatedDelivery: '10–12 July 2026'
          }
        });
      } else {
        throw new Error(orderResponse?.message || 'Order failed');
      }
    } catch (error) {
      console.error('Place order error:', error);
      navigate('/payment-failed', {
        state: {
          errorMessage: error.response?.data?.message || error.message || 'Failed to place order. Please try again.'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      <div className="payment-content">
        <div className="payment-left">
          <div className="shipping-address-box">
            <h3>Shipping Address</h3>
            {shippingAddress ? (
              <div className="address-details">
                <p><strong>{shippingAddress.name}</strong></p>
                <p>
                  {shippingAddress.houseName || shippingAddress.addressLine},{' '}
                  {shippingAddress.city}, {shippingAddress.pincode || shippingAddress.zipCode}
                </p>
                <p>Phn: {shippingAddress.phone}</p>
                <button className="btn-edit-addr" onClick={() => navigate('/checkout')}>
                  Edit
                </button>
              </div>
            ) : (
              <p>
                No shipping address selected.{' '}
                <span
                  onClick={() => navigate('/checkout')}
                  style={{ cursor: 'pointer', color: 'green' }}
                >
                  Go back
                </span>
              </p>
            )}
          </div>

          <hr className="divider" />

          <div className="payment-mode-box">
            <h3>Payment Mode</h3>

            <label className={`payment-option ${paymentMode === 'RazorPay' ? 'active' : ''}`}>
              <input
                type="radio"
                name="paymentMode"
                value="RazorPay"
                checked={paymentMode === 'RazorPay'}
                onChange={(e) => setPaymentMode(e.target.value)}
              />
              <span>RazorPay</span>
            </label>

            <label className={`payment-option ${paymentMode === 'Wallet' ? 'active' : ''}`}>
              <input
                type="radio"
                name="paymentMode"
                value="Wallet"
                checked={paymentMode === 'Wallet'}
                onChange={(e) => setPaymentMode(e.target.value)}
              />
              <span>Wallet</span>
            </label>

            <label className={`payment-option ${paymentMode === 'Cash On Delivery' ? 'active' : ''}`}>
              <input
                type="radio"
                name="paymentMode"
                value="Cash On Delivery"
                checked={paymentMode === 'Cash On Delivery'}
                onChange={(e) => setPaymentMode(e.target.value)}
              />
              <span>Cash On Delivery</span>
            </label>

            <div className="pay-now-btn-wrapper">
              <button className="btn-pay-now" onClick={handlePlaceOrder} disabled={loading}>
                {loading
                  ? 'Placing Order...'
                  : paymentMode === 'Cash On Delivery'
                  ? 'PLACE ORDER'
                  : 'PAY NOW'}
              </button>
            </div>
          </div>
        </div>

        <div className="payment-right">
          <div className="order-summary-box">
            <h3>Order Summary</h3>

            <div className="price-row">
              <span>Item Sub Total</span>
              <span>₹{subTotal}</span>
            </div>
            <div className="price-row">
              <span>Tax</span>
              <span>₹{tax || 0}</span>
            </div>
            <div className="price-row">
              <span>Shipping</span>
              <span>{shippingFee === 0 ? 'Free' : `₹${shippingFee}`}</span>
            </div>
            {discount > 0 && (
              <div className="price-row discount-row" style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                <span>Discount</span>
                <span>- ₹{discount}</span>
              </div>
            )}

            <div className="price-row total-row">
              <strong>Total</strong>
              <strong>₹{grandTotal || subTotal}</strong>
            </div>

            <button className="btn-summary-checkout" onClick={handlePlaceOrder} disabled={loading}>
              {loading ? 'Processing...' : 'PLACE ORDER'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;