import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api/axios';
import './AdminAuth.css';

const AdminForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      await API.post('/admin/forgot-password', { email: email.trim() });
      alert('OTP sent to admin email');
      navigate('/admin/verify-otp', { state: { email: email.trim() } });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-container">
        <div className="admin-card-border">
          <h2 className="admin-auth-title">Forgot Password</h2>

          <form onSubmit={handleSubmit} className="admin-auth-form">
            <div className="input-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="button-group">
              <button type="submit" className="admin-black-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
              <Link to="/admin/login" className="admin-login-link">
                Login
              </Link>
            </div>
          </form>
        </div>
      </div>
      <footer className="admin-auth-footer">
        © 2026 BagHub. All Rights Reserved.
      </footer>
    </div>
  );
};

export default AdminForgotPassword;