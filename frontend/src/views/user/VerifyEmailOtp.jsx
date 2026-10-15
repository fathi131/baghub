import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import './EditProfile.css';

const VerifyEmailOtp = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(56);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];
  const location = useLocation();
  const navigate = useNavigate();

  const oldEmail = location.state?.oldEmail;
  const newEmail = location.state?.newEmail || location.state?.email || '';
  const isEmailChange = location.state?.isEmailChange || false;

  const targetEmail = isEmailChange ? oldEmail : newEmail;

  
  useEffect(() => {
    const countdown = timer > 0 && setInterval(() => setTimer(prev => prev - 1), 1000);
    return () => clearInterval(countdown);
  }, [timer]);

  
  const handleInputChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Single character only
    setOtp(newOtp);

   
    if (value && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  
  const handleVerify = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length < 4) {
      alert('Please enter complete 4-digit OTP');
      return;
    }

    if (!targetEmail) {
      alert('Email missing. Please try again.');
      return;
    }

    try {
      setLoading(true);

      const res = await API.post('/user/verify-email-otp', { otp: otpString });

      if (res.status === 200 || res.data.success) {
        if (isEmailChange) {
          localStorage.setItem('user', JSON.stringify(res.data.user));

          alert('Email updated successfully!');
          navigate('/profile');
        } else {
          alert('Email verified successfully!');
          navigate('/login');
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Invalid or Expired OTP');
    } finally {
      setLoading(false);
    }
  };

  
  const handleResendOtp = async () => {
    if (!targetEmail) {
      alert('Email missing! Please try again.');
      return;
    }

    try {
      setResending(true);

      const res = await API.post('/user/send-email-otp', { newEmail });

      alert(res.data.message || 'New OTP sent to your email!');
      setTimer(56); // Timer Reset
      setOtp(['', '', '', '']); // Clear inputs
      inputRefs[0].current.focus();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="account-page" style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
      <div 
        style={{
          border: '2px solid #084839',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          backgroundColor: '#fff'
        }}
      >
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px', color: '#111' }}>
          Verify Your OTP
        </h2>

        <form onSubmit={handleVerify}>
          
          <div 
            style={{
              backgroundColor: '#e0e0e0',
              borderRadius: '12px',
              padding: '24px 16px',
              display: 'flex',
              justify: 'center',
              gap: '16px',
              marginBottom: '16px'
            }}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  outline: 'none'
                }}
                required
              />
            ))}
          </div>

          
          <div 
            style={{ 
              display: 'flex', 
              justify: 'space-between', 
              alignItems: 'center',
              fontSize: '13px', 
              color: '#333', 
              marginBottom: '24px',
              padding: '0 4px'
            }}
          >
            <span>
              Didn't get the OTP?{' '}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={timer > 0 || resending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: timer > 0 ? '#888' : '#084839',
                  cursor: timer > 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  padding: 0
                }}
              >
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            </span>
            <span style={{ fontWeight: '600' }}>
              00:{timer < 10 ? `0${timer}` : timer}
            </span>
          </div>

          
          <button 
            type="submit" 
            disabled={loading}
            style={{
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 48px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Verifying...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmailOtp;