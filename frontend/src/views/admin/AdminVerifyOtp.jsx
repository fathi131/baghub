import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../api/axios';
import './AdminAuth.css';

const AdminVerifyOtp = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/admin/forgot-password');
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [email, navigate]);

  const handleChange = (value, index) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      document.getElementById(`otp-input-${index + 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 4) {
      alert('Please enter a 4-digit OTP');
      return;
    }

    try {
      setLoading(true);
      const { data } = await API.post('/admin/verify-otp', { email, otp: enteredOtp });
      alert('OTP verified!');
      navigate('/admin/reset-password', {
        state: { email, resetToken: data.resetToken }
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await API.post('/admin/forgot-password', { email });
      setTimer(60);
      alert('New OTP sent to email');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-container">
        <div className="admin-card-border">
          <h2 className="admin-auth-title">Verify Your OTP</h2>

          <form onSubmit={handleSubmit} className="admin-auth-form">
            <div className="otp-boxes-wrapper">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, idx)}
                  className="otp-box"
                  disabled={loading}
                />
              ))}
            </div>

            <div className="otp-resend-row">
              <span className="resend-text">
                Didn't get the OTP?{' '}
                <button
                  type="button"
                  className="resend-btn"
                  onClick={handleResend}
                  disabled={timer > 0 || loading}
                >
                  Resend OTP
                </button>
              </span>
              <span className="timer-text">
                00:{timer < 10 ? `0${timer}` : timer}
              </span>
            </div>

            <button type="submit" className="admin-black-btn submit-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Submit'}
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

export default AdminVerifyOtp;