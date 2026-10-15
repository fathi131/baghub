import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './OrderSuccessPage.css';

const OrderSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  
  const { orderId, order } = location.state || {};

  return (
    <div className="order-success-container">
      <div className="order-success-card">
        <h1 className="success-heading">THANK YOU FOR YOUR ORDER!</h1>

        <div className="success-status">
          <span className="check-icon">✔</span>
          <span className="status-text">Payment done successfully</span>
        </div>

        <p className="success-subtext">Your order has been successfully placed.</p>

        <p className="order-number-text">
          Order Number: <span className="order-num">{orderId ? `#${orderId}` : '#123456'}</span>
        </p>

        <div className="success-btn-group">
          <button className="btn-success-green" onClick={() => navigate(`/order-details/${order?._id || orderId}`)}>
            Order details
          </button>
          <button className="btn-success-green" onClick={() => navigate('/my-orders')}>
            My orders
          </button>
          <button className="btn-success-green" onClick={() => navigate('/category')}>
            Continue shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;