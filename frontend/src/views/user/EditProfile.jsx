import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import './EditProfile.css';

const EditProfile = () => {
  const [initialEmail, setInitialEmail] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    API.get('/user/profile').then(({ data }) => {
      setFormData({
        username: data.name || '',
        email: data.email || '',
        phone: data.phone || ''
      });
      setInitialEmail(data.email || '');
    }).catch((error) => {
      alert(error.response?.data?.message || 'Could not load your profile');
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEmailChanged = formData.email.trim().toLowerCase() !== initialEmail.trim().toLowerCase();
    try {
      const response = await API.put('/user/profile', {
        name: formData.username,
        email: initialEmail,
        phone: formData.phone
      });
      localStorage.setItem('user', JSON.stringify(response.data.user));

      if (isEmailChanged) {
        await API.post('/user/send-email-otp', { newEmail: formData.email.trim() });
        navigate('/verify-email-otp', {
          state: { oldEmail: initialEmail, newEmail: formData.email.trim(), isEmailChange: true }
        });
      } else {
        alert('Profile updated successfully!');
        navigate('/profile');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update profile.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('googleToken');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  return (
    <div className="edit-profile-wrapper">
      
      <div className="account-container">
       
        <aside className="account-sidebar">
          <h3 className="sidebar-title">My Account</h3>
          <ul className="sidebar-menu">
            <li className="active">
              <Link to="/profile">👤 Personal Information</Link>
            </li>
            <li>
              <Link to="/manage-address">📍 Address</Link>
            </li>
            <li>
              <Link to="/my-orders">📦 Order</Link>
            </li>
            <li>
              <Link to="/wallet">💳 Wallet</Link>
            </li>
            <li>
              <Link to="/coupons">🎟️ Coupon</Link>
            </li>
            <li>
              <Link to="/referral">🎁 Referral Program</Link>
            </li>
            <li>
              <Link to="/password-change">🔑 Password Change</Link>
            </li>
            <li>
              <button onClick={handleLogout} className="logout-btn">
                🔄 Logout
              </button>
            </li>
          </ul>
        </aside>

        {/* Content Box */}
        <section className="account-content">
          <div className="content-card">
            <h2 className="content-title">Edit Personal Information</h2>

            <form onSubmit={handleSubmit} className="edit-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="rounded-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="rounded-input"
                  pattern="[0-9]{10}"
                  title="Enter a 10-digit phone number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="rounded-input"
                  required
                />
                <small className="email-note">
                  * Changing email requires OTP verification sent to the new email
                </small>
              </div>

              <div className="form-action">
                <button type="submit" className="save-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EditProfile;