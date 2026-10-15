import React, { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios'; // Centralized Axios Instance with auth headers/interceptors
import './AdminCustomers.css';

const AdminCustomers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      
      const response = await API.get(`/admin/users`, {
        params: { search, page, limit: 5 }
      });

      console.log('API Response:', response.data);

      
      const userData = Array.isArray(response.data)
        ? response.data
        : response.data.users || response.data.data || [];

      const total = response.data.totalPages || response.data.pages || 1;

      setUsers(userData);
      setTotalPages(total);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleBlock = async (id, currentStatus, name) => {
    const actionText = currentStatus ? 'unblock' : 'block';
    if (window.confirm(`Are you sure you want to ${actionText} ${name}?`)) {
      try {
        await API.patch(`/admin/users/${id}/block`, {
          isBlocked: !currentStatus
        });
        fetchUsers();
      } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update block status');
      }
    }
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/users', formData);
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', address: '', password: '' });
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding user');
    }
  };

  return (
    <div className="admin-customers-container">
      <div className="top-header">
        <h2>Customers</h2>
        <div className="header-actions">
          <div className="search-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Search Customers"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button className="clear-search-btn" onClick={handleClearSearch}>
                ✕
              </button>
            )}
          </div>
          <button className="add-user-btn" onClick={() => setShowModal(true)}>
            Add User
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Loading customers...</p>
      ) : (
        <table className="customers-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Address</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user, index) => (
                <tr key={user._id || index}>
                  <td>{(page - 1) * 5 + index + 1}</td>
                  <td>{user.name || user.username || 'N/A'}</td>
                  <td>{user.email || 'N/A'}</td>
                  <td>{user.phone || user.mobile || 'N/A'}</td>
                  <td>{user.address || 'N/A'}</td>
                  <td>
                    <button
                      className={user.isBlocked ? 'btn-unblock' : 'btn-block'}
                      onClick={() =>
                        handleToggleBlock(user._id, user.isBlocked, user.name || user.username)
                      }
                    >
                      {user.isBlocked ? 'UNBLOCK' : 'BLOCK'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <div className="pagination-container">
        <button
          className="page-btn nav-btn"
          disabled={page === 1}
          onClick={() => setPage((prev) => prev - 1)}
        >
          Previous
        </button>
        {[...Array(totalPages || 1)].map((_, i) => (
          <button
            key={i + 1}
            className={`page-btn ${page === i + 1 ? 'active' : ''}`}
            onClick={() => setPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button
          className="page-btn nav-btn"
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>

      
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Customer</h3>
            <form onSubmit={handleAddUserSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  required
                  value={formData.address || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-btn">
                  Save
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;