import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import './ResetPassword.css';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!strongPasswordRegex.test(formData.password)) {
      setErrorMessage('Use at least 8 characters with uppercase, lowercase, number, and special character.');
      return;
    }
    const resetToken = location.state?.resetToken;
    if (!resetToken) {
      setErrorMessage('Reset session expired. Request a new OTP.');
      return;
    }

    setLoading(true);
    try {
      await API.post('/user/reset-password', { resetToken, password: formData.password });
      alert('Password reset successfully. Please log in with your new password.');
      navigate('/login', { replace: true });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <header className="auth-navbar">
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <a href="#shop">Shop</a>
          <a href="#contact">Contact Us</a>
          <a href="#about">About Us</a>
        </nav>
        <div className="logo"><span>🎒 BagHub</span></div>
        <div className="nav-icons"><span>🛒</span><span>👤</span><span>❤️</span></div>
      </header>

      <main className="reset-wrapper">
        <div className="reset-card">
          <h2 className="reset-title">Reset Password</h2>
          {errorMessage && <p role="alert" style={{ color: '#b71c1c', marginBottom: '16px' }}>{errorMessage}</p>}

          <form onSubmit={handleSubmit} className="reset-form">
            <input
              type="password"
              name="password"
              placeholder="Enter New Password"
              value={formData.password}
              onChange={handleChange}
              className="reset-input"
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm New Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="reset-input"
              required
            />

            <div className="reset-action-row">
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-logo"><h2>🎒 BagHub</h2></div>
        <div className="footer-bottom"><p>© 2026 baghub . All Rights Reserved.</p></div>
      </footer>
    </div>
  );
};

export default ResetPassword;