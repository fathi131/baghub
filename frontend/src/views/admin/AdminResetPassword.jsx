import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../api/axios';
import './AdminAuth.css';

const AdminResetPassword = () => {
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const resetToken = location.state?.resetToken;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resetToken) {
      alert('Reset session expired. Please start over.');
      navigate('/admin/forgot-password');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    try {
      setLoading(true);
      await API.post('/admin/reset-password', {
        resetToken,
        password: passwords.newPassword
      });
      alert('Password reset successful! Please login.');
      navigate('/admin/login');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-container">
        <div className="admin-card-border">
          <h2 className="admin-auth-title">Reset Password</h2>

          <form onSubmit={handleSubmit} className="admin-auth-form">
            <div className="input-group">
              <input
                type="password"
                placeholder="New Password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="Confirm Password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="admin-black-btn submit-btn" disabled={loading}>
              {loading ? 'Resetting...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
      <footer className="admin-auth-footer">
        © 2026 BagHub. All Rights Reserved.
      </footer>
    </div>
  );
};

export default AdminResetPassword;