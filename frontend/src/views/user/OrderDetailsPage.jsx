import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import './OrderDetailsPage.css';

const OrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await API.get(`/user/orders/${id}`);
        setOrder(res.data?.order || null);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    try {
      const confirmed = window.confirm('Cancel this order?');
      if (!confirmed) return;
      await API.patch(`/user/orders/${id}/cancel`, { reason });
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleReturnOrder = async () => {
    if (!reason.trim()) {
      alert('Please provide a return reason.');
      return;
    }

    try {
      await API.patch(`/user/orders/${id}/return`, { reason });
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to request return');
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/100?text=No+Image';
    const cleanPath = String(imagePath).replace(/\\/g, '/');
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) return cleanPath;
    const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    const finalPath = normalizedPath.includes('/uploads/') ? normalizedPath : `/uploads${normalizedPath}`;
    return `http://localhost:5000${finalPath}`;
  };

  const handleDownloadInvoice = async () => {
  if (!order || !order.orderId) {
    alert('Order details not loaded yet. Please wait...');
    return;
  }

  try {
    const response = await API.get(`/user/orders/${id}/invoice`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${order.orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    alert('Failed to download invoice');
  }
};
if (loading) return <div className="loading-text">Loading order details...</div>;
if (!order) return <div className="loading-text">Order not found.</div>;
  return (
    <div className="order-details-container">
      <div className="breadcrumb">
        My Account &gt; Order &gt; <span>Order details</span>
      </div>

      <div className="order-details-card">
        <div className="details-left-pane">
          <div className="info-block">
            <p><strong>Order #{order.orderId}</strong></p>
            <p className="sub-info">Date: {new Date(order.orderDate || order.createdAt).toLocaleDateString()}</p>
            <p className="sub-info">Status : <span className="status-shipped">{order.status}</span></p>
          </div>

          <hr className="pane-divider" />

          <div className="info-block">
            <h4>Shipping Address</h4>
            <p>{order.shippingAddress?.name}</p>
            <p>{order.shippingAddress?.houseName}</p>
            <p>{order.shippingAddress?.locality}</p>
            <p>{order.shippingAddress?.city} {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
            <p>{order.shippingAddress?.country}</p>
          </div>

          <hr className="pane-divider" />

          <div className="info-block">
            <h4>Payment Method</h4>
            <p>{order.paymentMethod}</p>
          </div>

          <hr className="pane-divider" />

          <div className="info-block summary-block">
            <h4>Order Summary</h4>
            <div className="summary-row"><span>Total Items :</span> <span>{order.items?.length || 0}</span></div>
            <div className="summary-row"><span>Subtotal :</span> <span>₹ {Number(order.subtotal || 0)}</span></div>
            <div className="summary-row"><span>Shipping :</span> <span>{Number(order.shippingFee || 0) === 0 ? 'Free' : `₹ ${order.shippingFee}`}</span></div>
            <div className="summary-row total-row"><span>Total :</span> <span>₹ {Number(order.totalAmount || 0)}</span></div>
          </div>
        </div>

        <div className="details-right-pane">
          <div className="pane-header">
            <h2>Order Details</h2>
            <button className="btn-download-invoice" onClick={handleDownloadInvoice}>Download Invoice</button>
          </div>

          <div className="items-list">
            {order.items?.map((item) => (
              <div className="item-row" key={item.productId || item._id}>
                <div className="item-img-box">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                    }}
                  />
                </div>

                <div className="item-details-box">
                  <h4 className="item-title">{item.name}</h4>
                  <span className="item-qty">Qty: {item.quantity}</span>
                  <span className="item-price">₹ {Number(item.total || item.price || 0)}</span>
                </div>

                <div className="item-action-box">
  <div className="delivery-status-green">
    <span className="dot green-dot"></span>
    <span>{order.status}</span>
  </div>

  {!['cancelled', 'returned', 'delivered', 'return requested'].includes(order.status) && (
    <button className="btn-cancel" onClick={handleCancelOrder}>Cancel</button>
  )}

  {order.status === 'delivered' && (
    <button
      className="btn-cancel"
      style={{ background: '#03544c', marginTop: '6px' }}
      onClick={() =>
        navigate(`/write-review/${item.productId || item._id}`, {
          state: { orderId: order._id }
        })
      }
    >
      Write Review
    </button>
  )}
</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px' }}>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={order.status === 'delivered' ? 'Return reason (required)' : 'Optional cancellation reason'}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
            {order.status === 'delivered' && (
              <button className="btn-cancel" style={{ marginTop: '10px' }} onClick={handleReturnOrder}>Return Order</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;