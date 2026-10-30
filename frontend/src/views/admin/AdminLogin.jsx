import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './AdminLogin.css';
import { toast } from 'react-toastify';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

    if (adminToken && (adminUser.isAdmin || adminUser.role === 'admin')) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/admin/login', {
        email: credentials.email,
        password: credentials.password
      });

      const { token, user } = response.data;

      if (user && (user.isAdmin || user.role === 'admin')) {
        
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify(user));

        toast.success('Admin Login Successful!');

        navigate('/admin/dashboard', { replace: true });
      } else {
        toast.error('Access Denied: You do not have Admin privileges!');
      }
    } catch (error) {
      console.error('Admin Login Error:', error);
      toast.error(error.response?.data?.message || 'Invalid Admin Credentials!');
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-brand-logo">
        <span className="bag-icon">🛍️</span>
        <span className="brand-title">BagHub</span>
      </div>
      <div className="admin-login-card">
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="forgot-password-link">
            <Link to="/admin/forgot-password">Forgot Password?</Link>
          </div>
          <button type="submit" className="admin-login-btn">
            Login
          </button>
        </form>
      </div>
      <footer className="admin-login-footer">
        <p>© 2026 baghub . All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default AdminLogin;