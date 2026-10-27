import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PaymentFailedPage.css';

const PaymentFailedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    errorMessage,
    shippingAddress,
    cartItems,
    subTotal,
    tax,
    discount,
    shippingFee,
    grandTotal,
    appliedCoupon
  } = location.state || {};

  const handleRetry = () => {
    if (shippingAddress && cartItems) {
      navigate('/payment', {
        state: {
          shippingAddress,
          cartItems,
          subTotal,
          tax,
          discount,
          shippingFee,
          grandTotal,
          appliedCoupon
        }
      });
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="payment-failed-container">
      <div className="payment-failed-card">
        <div className="failed-icon-circle">
          <span>!</span>
        </div>

        <h2 className="failed-title">Payment Failed</h2>

        <p className="failed-subtext">
          {errorMessage || 'Your payment could not be completed'}
        </p>

        <div className="failed-btn-group">
          <button className="btn-failed-green" onClick={handleRetry}>
            Retry Payment
          </button>

          <button className="btn-failed-green" onClick={() => navigate('/checkout')}>
            Change Payment Method
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailedPage;