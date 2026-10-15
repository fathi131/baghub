import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import API from '../../api/axios';
import './OtpVerification.css';

const OtpVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  const oldEmail = location.state?.oldEmail;
  const newEmail = location.state?.newEmail || location.state?.email || '';
  const isEmailChange = location.state?.isEmailChange || false;
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

  // 1. Resend OTP
  const handleResend = async () => {
    if (!canResend) return;

    const targetEmail = isEmailChange ? oldEmail : newEmail;
    if (!targetEmail) {
      setErrorMsg('Email missing. Please try again.');
      return;
    }

    try {
      setErrorMsg('');
      
      const res = isEmailChange
        ? await API.post('/user/send-email-otp', { newEmail })
        : await axios.post('http://localhost:5000/api/user/resend-otp', { email: targetEmail });

      alert(res.data.message || 'New OTP sent to your email!');
      setTimer(60);
      setOtp(['', '', '', '']);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');

    if (enteredOtp.length < 4) {
      setErrorMsg('Please enter the full 4-digit OTP');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      if (isEmailChange) {
        const res = await API.post('/user/verify-email-otp', { otp: enteredOtp });

        if (res.status === 200 || res.data.success) {
          localStorage.setItem('user', JSON.stringify(res.data.user));

          alert('Email updated successfully!');
          navigate('/profile');
        }
      } else {
        const res = await axios.post('http://localhost:5000/api/user/verify-otp', {
          email: newEmail,
          otp: enteredOtp
        });

        if (res.status === 200) {
          alert('Verification Successful!');
          if (res.data.token) {
            localStorage.setItem('token', res.data.token);
          }
          navigate('/login');
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid or Expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="otp-wrapper">
      <div className="otp-card">
        <h2 className="otp-title">Verify Your OTP</h2>
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          OTP sent to <strong>{isEmailChange ? oldEmail : newEmail}</strong>
        </p>

        {errorMsg && <p style={{ color: 'red', textAlign: 'center', fontSize: '14px' }}>{errorMsg}</p>}

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
                className={`resend-btn ${!canResend ? 'disabled' : ''}`}
                onClick={handleResend}
                disabled={!canResend}
              >
                Resend OTP
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

export default OtpVerification;