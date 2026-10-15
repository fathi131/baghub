import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import './MyOrdersPage.css';

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('Last 6 months');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await API.get('/user/orders');
        const list = res.data?.orders || [];
        setOrders(list);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) =>
    String(order.orderId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="account-layout-container">
      <div className="account-sidebar">
        <div className="sidebar-box">
          <h3>My Account</h3>
          <ul>
            <li><Link to="/profile">👤 Personal Information</Link></li>
            <li><Link to="/manage-address">🏠 Address</Link></li>
            <li className="active"><Link to="/my-orders">📦 Order</Link></li>
            <li><Link to="/wallet">👛 Wallet</Link></li>
            <li><Link to="/coupons">🏷 Coupon</Link></li>
            <li><Link to="/referral">🎁 Referral Program</Link></li>
            <li><Link to="/password-change">🔑 Password Change</Link></li>
            <li className="logout-item" onClick={() => { localStorage.clear(); navigate('/login'); }}>🚪 Logout</li>
          </ul>
        </div>
      </div>

      <div className="orders-main-content">
        <div className="orders-box">
          <div className="orders-header">
            <h2>My Orders</h2>
            <div className="orders-controls">
              <input
                type="text"
                placeholder="Search by Order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="order-search-input"
              />

              <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className="order-filter-select">
                <option value="Last 6 months">Last 6 months</option>
                <option value="Last 30 days">Last 30 days</option>
                <option value="2026">2026</option>
              </select>
            </div>
          </div>

          <div className="orders-table-header">
            <span>Order ID</span>
            <span>Items</span>
            <span>Total Amount</span>
            <span>Order Status</span>
          </div>

          <div className="orders-list">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <div className="order-row-card" key={order._id}>
                  <div className="col-id">#{order.orderId}</div>
                  <div className="col-items">{order.items?.length || 0}</div>
                  <div className="col-amount">₹ {Number(order.totalAmount || 0).toLocaleString()}</div>
                  <div className="col-status">
                    <div className="status-badge-container">
                      <span className={`status-dot ${String(order.status || '').toLowerCase().replace(/\s+/g, '-')}`}></span>
                      <strong>{order.status || 'Pending'}</strong>
                    </div>
                    <p className="status-subtext">{new Date(order.orderDate || order.createdAt).toLocaleDateString()}</p>
                    <button className="btn-view-orders" onClick={() => navigate(`/order-details/${order._id}`)}>
                      View Orders
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-orders">No orders found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyOrdersPage;