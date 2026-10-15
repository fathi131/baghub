import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../../api/axios';
import './OtpVerification.css'; 

const ForgotPasswordOtp = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

 
  const email = location.state?.email;
  const canResend = timer === 0;

  useEffect(() => {
    if (timer <= 0) return undefined;
    const interval = setInterval(() => setTimer((prev) => Math.max(prev - 1, 0)), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 3) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // 🔑 Resend OTP
  const handleResend = async () => {
    if (!canResend) return;

    if (!email) {
      setErrorMsg('Email address missing! Please go back and try again.');
      return;
    }

    setLoading(true);
    setMessage('');
    setErrorMsg('');

    try {
      const response = await API.post('/user/forgot-password/resend-otp', { email });

      if (response.status === 200) {
        setMessage('New OTP sent to your email!');
        setTimer(60);
        setOtp(['', '', '', '']);
      }
    } catch (error) {
      console.error('Resend Error:', error.response);
      if (error.response && error.response.data) {
        setErrorMsg(error.response.data.message || 'Failed to resend OTP');
      } else {
        setErrorMsg('Server connection failed!');
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔑 Submit OTP Verification
  const handleSubmit = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');

    if (enteredOtp.length < 4) {
      setErrorMsg('Please enter complete 4-digit OTP');
      return;
    }

    if (!email) {
      setErrorMsg('Email not found. Please restart the forgot password process.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setMessage('');

    try {
     
      const response = await API.post('/user/forgot-password/verify-otp', {
        email,
        otp: enteredOtp
      });

      if (response.status === 200) {
        setMessage('OTP Verified successfully!');
        setTimeout(() => {
          navigate('/reset-password', { state: { email, resetToken: response.data.resetToken } });
        }, 1000);
      }
    } catch (error) {
      console.error('Verify Error:', error.response);
      if (error.response && error.response.data) {
        setErrorMsg(error.response.data.message || 'Invalid OTP');
      } else {
        setErrorMsg('Server error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-page">
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

      <main className="otp-wrapper">
        <div className="otp-card">
          <h2 className="otp-title">Verify Your OTP</h2>

          {message && <p style={{ color: 'green', textAlign: 'center', fontSize: '14px', marginBottom: '10px' }}>{message}</p>}
          {errorMsg && <p style={{ color: 'red', textAlign: 'center', fontSize: '14px', marginBottom: '10px' }}>{errorMsg}</p>}

          <form onSubmit={handleSubmit}>
            <div className="otp-grey-box">
              <div className="otp-inputs-container">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    value={digit}
                    ref={(el) => (inputRefs.current[index] = el)}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="otp-input"
                    required
                  />
                ))}
              </div>
            </div>

            <div className="otp-timer-row">
              <span className="resend-text">
                Didn't get the OTP?{' '}
                <button
                  type="button"
                  className={`resend-btn ${!canResend || loading ? 'disabled' : ''}`}
                  onClick={handleResend}
                  disabled={!canResend || loading}
                >
                  {loading ? 'Sending...' : 'Resend OTP'}
                </button>
              </span>
              <span className="timer-count">
                00:{timer < 10 ? `0${timer}` : timer}
              </span>
            </div>

            <button type="submit" className="otp-submit-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Submit'}
            </button>
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

export default ForgotPasswordOtp;