import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

  // ✅ FIX: OTP paste handler (multi-digit)
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 0) {
      const newOtp = [...otp];
      digits.split('').forEach((digit, i) => {
        if (i < 4) newOtp[i] = digit;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 3);
      inputRefs.current[nextIndex]?.focus();
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
          navigate('/reset-password', {
            state: { email, resetToken: response.data.resetToken }
          });
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
    <main className="otp-wrapper">
      <div className="otp-card">
        <h2 className="otp-title">Verify Your OTP</h2>

        {message && (
          <p style={{ color: 'green', textAlign: 'center', fontSize: '14px', marginBottom: '10px' }}>
            {message}
          </p>
        )}
        {errorMsg && (
          <p style={{ color: 'red', textAlign: 'center', fontSize: '14px', marginBottom: '10px' }}>
            {errorMsg}
          </p>
        )}

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
                  onPaste={handlePaste}
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
  );
};

export default ForgotPasswordOtp;