import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Backend API Call
      const response = await axios.post('/user/forgot-password', { email });

      if (response.status === 200) {
        setSuccessMsg('OTP sent successfully!');
        
        setTimeout(() => {
          navigate('/forgot-password-otp', { state: { email } });
        }, 1000);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setErrorMsg(error.response.data.message || 'Failed to send OTP!');
      } else {
        setErrorMsg('Failed to send OTP!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="forgot-wrapper">
      <div className="forgot-card">
        <h2 className="forgot-title">Forgot Password</h2>

        
        {errorMsg && <p style={{ color: 'red', textAlign: 'center', fontSize: '14px' }}>{errorMsg}</p>}
        {successMsg && <p style={{ color: 'green', textAlign: 'center', fontSize: '14px' }}>{successMsg}</p>}

        <form onSubmit={handleSubmit} className="forgot-form">
          <input
            type="email"
            className="forgot-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="forgot-action-row">
            <button type="submit" className="send-otp-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            <Link to="/login" className="login-link-btn">
              Login
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
};

export default ForgotPassword;
