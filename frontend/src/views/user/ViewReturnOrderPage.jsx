import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import './ViewReturnOrderPage.css';

const ViewReturnOrderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/user/orders/${id}`);
        setOrder(res.data?.order || null);
      } catch (error) {
        console.error('Error fetching return order:', error);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/100?text=No+Image';
    const cleanPath = String(imagePath).replace(/\\/g, '/');
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) return cleanPath;
    const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    const finalPath = normalizedPath.includes('/uploads/') ? normalizedPath : `/uploads${normalizedPath}`;
    return `http://localhost:5000${finalPath}`;
  };

  if (loading) return <div className="loading-text">Loading return order details...</div>;
  if (!order) return <div className="loading-text">Order not found.</div>;

  const totalItems = order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;

  return (
    <div className="return-order-container">
      <div className="breadcrumb">
        My Account &gt; Order &gt; <span>Return Order Details</span>
      </div>

      <div className="return-order-card">
        
        <div className="return-left-pane">
          <div className="info-block">
            <p className="order-number">Order #{order.orderId}</p>
            <p className="sub-text">
              Date: {new Date(order.orderDate || order.createdAt).toLocaleDateString('en-GB')}
            </p>
            <p className="sub-text">
              Status : <span className="status-delivered">{order.status}</span>
            </p>
          </div>

          <div className="info-block">
            <h4>Shipping Address</h4>
            <p>{order.shippingAddress?.name}</p>
            <p>{order.shippingAddress?.houseName}</p>
            <p>{order.shippingAddress?.locality}</p>
            <p>
              {order.shippingAddress?.city} {order.shippingAddress?.state}{' '}
              {order.shippingAddress?.pincode}
            </p>
            <p>{order.shippingAddress?.country || 'India'}</p>
          </div>

          <div className="info-block">
            <h4>Payment Method</h4>
            <p>{order.paymentMethod}</p>
          </div>

          
          {order.returnReason && (
            <div className="info-block">
              <h4>Return Reason</h4>
              <p style={{ color: '#a31d3d', fontWeight: 500 }}>{order.returnReason}</p>
            </div>
          )}

          <div className="info-block summary-block">
            <h4>Order Summary</h4>
            <div className="summary-row">
              <span>Total Items :</span>
              <span>{totalItems}</span>
            </div>
            <div className="summary-row">
              <span>Subtotal :</span>
              <span>₹ {Number(order.subtotal || 0)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping :</span>
              <span>
                {Number(order.shippingFee || 0) === 0 ? 'Free' : `₹ ${order.shippingFee}`}
              </span>
            </div>
            <div className="summary-row total-row">
              <span>Total :</span>
              <span>₹ {Number(order.totalAmount || 0)}</span>
            </div>
          </div>
        </div>

        
        <div className="return-right-pane">
          <h2 className="header-title">Order Details</h2>

          <div className="items-list">
            {order.items?.map((item, idx) => (
              <div className="item-card" key={item.productId || item._id || idx}>
                <div className="item-img-container">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                    }}
                  />
                </div>

                <div className="item-info">
                  <h4 className="item-name">{item.name}</h4>
                  <div className="item-meta">
                    <span>Qty: {item.quantity}</span>
                    <span>₹ {Number(item.price || 0)}</span>
                  </div>
                </div>

                <div className="item-status-actions">
                  <div className="status-badge green-badge">
                    <span className="dot"></span>
                    <span>{order.status}</span>
                  </div>

                  {order.status === 'return requested' && (
                    <p className="return-subtext">Return request is being processed</p>
                  )}
                  {order.status === 'returned' && (
                    <p className="return-subtext">Your order has been returned</p>
                  )}

                  {order.status === 'delivered' && (
                    <div className="button-group">
                      <button
                        className="btn-pill-red"
                        onClick={() => navigate(`/write-review/${item.productId || item._id}`)}
                      >
                        write review
                      </button>
                      <button
                        className="btn-pill-red"
                        onClick={() => navigate(`/return-order/${order._id}`)}
                      >
                        Return
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewReturnOrderPage;