import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import './AdminOrdersPage.css';

const AdminOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const itemsPerPage = 4;

  useEffect(() => {
    let isActive = true;
    API.get('/admin/orders')
      .then((res) => {
        if (isActive) {
          setOrders(res.data?.orders || []);
          setLoadError('');
        }
      })
      .catch((error) => {
        console.error('Error fetching admin orders:', error);
        if (isActive) setLoadError(error.response?.data?.message || 'Could not load orders. Check your admin access and retry.');
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [refreshKey]);

  const filteredAndSortedOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const userName = order.shippingAddress?.name || '';
        const matchesSearch =
          String(order.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          userName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || String(order.status || '').toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.orderDate || a.createdAt).getTime();
        const dateB = new Date(b.orderDate || b.createdAt).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [orders, searchTerm, statusFilter, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const currentItems = useMemo(() => {
    const indexOfLastItem = safeCurrentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredAndSortedOrders.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredAndSortedOrders, safeCurrentPage]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await API.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      setOrders((prevOrders) =>
        prevOrders.map((ord) => (ord._id === orderId ? { ...ord, status: newStatus } : ord))
      );
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusClass = (status) => {
    switch (String(status || '').toLowerCase()) {
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      case 'processing':
      case 'pending':
        return 'status-processing';
      case 'shipped':
      case 'out for delivery':
        return 'status-shipped';
      case 'return requested':
      case 'returned':
        return 'status-return';
      default:
        return '';
    }
  };

  return (
    <div className="admin-orders-container">
      <h1 className="page-title">Orders</h1>

      <div className="controls-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search Orders by ID or Name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-sort-group">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="select-dropdown">
            <option value="All">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="out for delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="return requested">Return Requested</option>
            <option value="returned">Returned</option>
          </select>

          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="select-dropdown">
            <option value="desc">Date: Newest First</option>
            <option value="asc">Date: Oldest First</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>Name</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="no-data">Loading orders...</td></tr>
            ) : loadError ? (
              <tr>
                <td colSpan="6" className="no-data" role="alert">
                  {loadError}{' '}
                  <button type="button" className="retry-orders-btn" onClick={() => { setLoading(true); setLoadError(''); setRefreshKey((key) => key + 1); }}>Retry</button>
                </td>
              </tr>
            ) : currentItems.length > 0 ? (
              currentItems.map((order) => (
                <tr key={order._id}>
                  <td className="font-bold">#{order.orderId}</td>
                  <td>{order.shippingAddress?.name || 'Customer'}</td>
                  <td>{order.paymentMethod}</td>
                  <td>
                    <select value={order.status || 'pending'} disabled={updatingOrderId === order._id} onChange={(e) => handleStatusChange(order._id, e.target.value)} className={`status-select ${getStatusClass(order.status)}`}>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="out for delivery">Out for delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="return requested">Return Requested</option>
                      <option value="returned">Returned</option>
                    </select>
                  </td>
                  <td>₹{Number(order.totalAmount || 0).toFixed(2)}</td>
                  <td>
                    <button className="btn-more-details" onClick={() => navigate(`/admin/orders/edit/${order._id}`)} >More Details</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">
                  {orders.length ? 'No orders match these filters.' : 'No orders have been placed yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="page-btn nav-btn" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(1, Math.min(prev, totalPages) - 1))}>Previous</button>
        {[...Array(totalPages)].map((_, idx) => (
          <button key={idx + 1} className={`page-btn ${safeCurrentPage === idx + 1 ? 'active' : ''}`} onClick={() => setCurrentPage(idx + 1)}>{idx + 1}</button>
        ))}
        <button className="page-btn nav-btn" disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage((prev) => Math.min(totalPages, Math.min(prev, totalPages) + 1))}>Next</button>
      </div>
    </div>
  );
};

export default AdminOrdersPage;