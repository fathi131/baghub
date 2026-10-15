import { useState,useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import API from '../../api/axios';
import {
  authenticateWithFacebook,
  authenticateWithGoogle,
  persistUserSession
} from '../../services/socialAuth';
import { hasValidAuthToken } from '../../services/authSession';
import './SignUp.css';



const SignUp = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: new URLSearchParams(location.search).get('ref') || ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
  const role = localStorage.getItem('role');

  if (hasValidAuthToken()) {
    if (role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate('/home', { replace: true });
    }
  }
}, [navigate]);
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const session = await authenticateWithGoogle(tokenResponse.access_token, formData.referralCode);
        persistUserSession(session);
        navigate('/home', { replace: true });
      } catch (error) {
        setErrorMsg(error.response?.data?.message || error.message || 'Google sign-up failed');
      }
    },
    onError: () => setErrorMsg('Google sign-up failed')
  });

  const handleFacebookSignup = async () => {
    try {
      const session = await authenticateWithFacebook(formData.referralCode);
      persistUserSession(session);
      navigate('/home', { replace: true });
    } catch (error) {
      setErrorMsg(error.response?.data?.message || error.message || 'Facebook sign-up failed');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. Username Validation
    if (formData.username.trim().length < 3) {
      setErrorMsg('Username must be at least 3 characters long!');
      return;
    }

    
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!strongPasswordRegex.test(formData.password)) {
      setErrorMsg('Password must be 8+ characters with uppercase, lowercase, number, and special character!');
      return;
    }

    
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match!');
      return;
    }

    try {
      setLoading(true);
      
      const res = await API.post('http://localhost:5000/api/user/signup', {
        name: formData.username,
        email: formData.email,
        password: formData.password,
        referralCode: formData.referralCode.trim()
      });

      if (res.status === 200 || res.status === 201) {
        navigate('/verify-otp', { state: { email: formData.email },replace:true });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Signup failed! Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="signup-wrapper">
      <div className="signup-card">
        <h2 className="signup-title">Signup</h2>

        {errorMsg && <p style={{ color: 'red', textAlign: 'center', fontSize: '14px', marginBottom: '10px' }}>{errorMsg}</p>}

        <form onSubmit={handleSubmit} className="signup-form">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="referralCode"
            placeholder="Referral code (optional)"
            value={formData.referralCode}
            onChange={handleChange}
            autoComplete="off"
          />
          
          
          <div className="password-field-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              style={{ paddingRight: '55px' }}
              required
            />
            <span 
              className="password-toggle-icon"
              onClick={() => setShowPassword(!showPassword)}
              style={{ fontSize: '13px', fontWeight: '600', color: '#007bff' }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </span>
          </div>

          
          <div className="password-field-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={{ paddingRight: '55px' }}
              required
            />
            <span 
              className="password-toggle-icon"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{ fontSize: '13px', fontWeight: '600', color: '#007bff' }}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </span>
          </div>

          <div className="action-row">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Signup'}
            </button>
            <Link to="/login" className="login-link">
              Login
            </Link>
          </div>
        </form>

        <div className="divider">
          <span>Or</span>
        </div>

        
        <button className="google-btn" type="button" onClick={() => handleGoogleLogin()}>
          <svg className="google-icon" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
        <button className="google-btn facebook-btn" type="button" onClick={handleFacebookSignup}>
          <span className="facebook-icon" aria-hidden="true">f</span>
          <span>Continue with Facebook</span>
        </button>
      </div>
    </main>
  );
};

export default SignUp;