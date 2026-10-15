import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';
import './AdminEditOrderPage.css';

const AdminEditOrderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isActive = true;
    API.get(`/admin/orders/${id}`)
      .then(({ data }) => {
        if (!isActive) return;
        setOrder(data.order);
        setSelectedStatus(data.order.status || 'pending');
        setError('');
      })
      .catch((requestError) => {
        if (isActive) setError(requestError.response?.data?.message || 'Could not load order details.');
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [id, refreshKey]);

  const handleUpdate = async () => {
    if (!order || selectedStatus === order.status) return;
    setSaving(true);
    try {
      const { data } = await API.patch(`/admin/orders/${id}/status`, { status: selectedStatus });
      setOrder(data.order);
      setSelectedStatus(data.order.status);
    } catch (requestError) {
      alert(requestError.response?.data?.message || 'Could not update order status.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-edit-order-container">Loading order details...</div>;
  }

  if (error || !order) {
    return (
      <div className="admin-edit-order-container" role="alert">
        <p>{error || 'Order not found.'}</p>
        <button type="button" className="btn-update-status" onClick={() => { setLoading(true); setError(''); setRefreshKey((key) => key + 1); }}>Retry</button>
        <button type="button" className="btn-back-orders" onClick={() => navigate('/admin/orders')}>Back to Orders</button>
      </div>
    );
  }

  const shippingAddress = order.shippingAddress || {};
  const addressText = [shippingAddress.houseName, shippingAddress.locality, shippingAddress.city, shippingAddress.state, shippingAddress.pincode]
    .filter(Boolean)
    .join(', ');
  const orderDate = order.orderDate || order.createdAt;

  return (
    <div className="admin-edit-order-container">
      <button type="button" className="btn-back-orders" onClick={() => navigate('/admin/orders')}>Back to Orders</button>
      <h1 className="page-title">Orders</h1>
      <h2 className="section-title">Order #{order.orderId}</h2>

      <div className="edit-order-grid">
        
        <div className="left-column">
          
          <div className="details-card">
            <table className="order-items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item) => (
                  <tr key={item._id || item.productId}>
                    <td>{item.name || 'Product'}</td>
                    <td>{item.quantity}</td>
                    <td>₹{Number(item.price || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="total-row">
              <span>Total</span>
              <span>₹{Number(order.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>

          
          <div className="details-card margin-top">
            <div className="card-header">Customer Details</div>
            <div className="info-table">
              <div className="info-row">
                <span className="info-label">Customer Name</span>
                <span className="info-value">{shippingAddress.name || 'Customer'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Mobile Number</span>
                <span className="info-value">{shippingAddress.phone || 'Not provided'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Type of payment</span>
                <span className="info-value">{order.paymentMethod || 'Not provided'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Address</span>
                <span className="info-value">{addressText || 'Address not provided'}</span>
              </div>
            </div>
          </div>
        </div>

        
        <div className="right-column">
          <div className="update-panel">
            <div className="panel-header">Order Update</div>
            <div className="panel-body">
              <div className="status-meta">
                <span>Ordered On :</span>
                <strong>{orderDate ? new Date(orderDate).toLocaleString('en-GB') : 'Not available'}</strong>
              </div>

              <div className="status-meta">
                <span>Current State :</span>
                <span className="highlight-state">{order.status || 'pending'}</span>
              </div>

              <div className="status-select-group">
                <label>Order Status :</label>
                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className="status-dropdown"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="out for delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="return requested">Return Requested</option>
                  <option value="returned">Returned</option>
                </select>
              </div>

              <button type="button" className="btn-update-status" onClick={handleUpdate} disabled={saving || selectedStatus === order.status}>
                {saving ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEditOrderPage;