import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './AdminLogin.css';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (token && (user.isAdmin || user.role === 'admin')) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/api/admin/login', {
        email: credentials.email,
        password: credentials.password
      });

      const { token, user } = response.data;

      if (user && (user.isAdmin || user.role === 'admin')) {
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        alert('Admin Login Successful!');

        
        navigate('/admin/dashboard', { replace: true });
      } else {
        alert('Access Denied: You do not have Admin privileges!');
      }
    } catch (error) {
      console.error('Admin Login Error:', error);
      alert(error.response?.data?.message || 'Invalid Admin Credentials!');
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