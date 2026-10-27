import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import './Profile.css';

const getProfileImageUrl = (image) => (
 image?.startsWith('http') ? image : image ? `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}${image}` : ''
);

const Profile = () => {
  const navigate = useNavigate();
  const imageInputRef = useRef(null);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    profileImage: ''
  });
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/user/profile').then(({ data }) => {
      setUserData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        profileImage: data.profileImage || ''
      });
      setAddresses(data.addresses || []);
      localStorage.setItem('user', JSON.stringify(data));
    }).catch((error) => {
      alert(error.response?.data?.message || 'Could not load your profile');
    }).finally(() => setLoading(false));
  }, []);

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('profileImage', file);
    try {
      const { data } = await API.put('/user/profile/image', formData);
      setUserData((current) => ({ ...current, profileImage: data.profileImage }));
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...storedUser, profileImage: data.profileImage }));
    } catch (error) {
      alert(error.response?.data?.message || 'Could not upload profile image');
    } finally {
      event.target.value = '';
    }
  };

  const handleLogout = () => {
    ['token', 'role', 'isLoggedIn', 'user', 'googleToken'].forEach((key) => localStorage.removeItem(key));
    navigate('/login', { replace: true });
  };

  const displayAddress = addresses.find((address) => address.isDefault) || addresses[0];

  return (
    <div className="profile-page-wrapper">
      <main className="profile-page">
        <div className="profile-container">
          
          
          <div className="account-box">
            <h3 className="box-title">My Account</h3>
            <ul className="account-menu">
              <li className="active" onClick={() => navigate('/profile')}>
                <span className="icon">👤</span> Personal Information
              </li>
              <li onClick={() => navigate('/manage-address')}>
                <span className="icon">📍</span> Address
              </li>
              <li onClick={() => navigate('/my-orders')}>
                <span className="icon">📦</span> Order
              </li>
              <li onClick={() => navigate('/wallet')}>
                <span className="icon">💳</span> Wallet
              </li>
              <li onClick={() => navigate('/coupons')}>
                <span className="icon">🎟️</span> Coupon
              </li>
              <li onClick={() => navigate('/referral')}>
                <span className="icon">🎁</span> Referral Program
              </li>
              <li onClick={() => navigate('/password-change')}>
                <span className="icon">🔑</span> Password Change
              </li>
              <li onClick={handleLogout}>
                <span className="icon">🚪</span> Logout
              </li>
            </ul>
          </div>

          
          <div className="info-box">
            <h3 className="box-title-center">Personal Information</h3>

            <div className="profile-photo-area">
              {userData.profileImage ? (
                <img className="profile-photo" src={getProfileImageUrl(userData.profileImage)} alt="Profile" />
              ) : (
                <div className="profile-photo profile-photo-fallback" aria-label="No profile image">
                  {userData.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <button type="button" className="profile-photo-button" onClick={() => imageInputRef.current?.click()}>
                Change photo
              </button>
              <input
                ref={imageInputRef}
                className="profile-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
              />
            </div>
            
            <form className="personal-info-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label>username</label>
                <input 
                  type="text" 
                  value={userData.name} 
                  readOnly 
                  className="rounded-input" 
                  placeholder="Loading name..."
                />
              </div>

              <div className="form-group">
                <label>email</label>
                <input 
                  type="email" 
                  value={userData.email} 
                  readOnly 
                  className="rounded-input" 
                  placeholder="Loading email..."
                />
              </div>

              <div className="form-group">
                <label>phone</label>
                <input type="tel" value={userData.phone} readOnly className="rounded-input" placeholder="Not provided" />
              </div>

              <div className="form-action">
                <button 
                  type="button" 
                  className="update-btn"
                  onClick={() => navigate('/edit-profile')}
                >
                  Edit Profile
                </button>
              </div>
            </form>

            <section className="profile-address-section">
              <div className="profile-address-heading">
                <h4>Address</h4>
                <button type="button" onClick={() => navigate('/manage-address')}>Manage addresses</button>
              </div>
              {loading ? <p>Loading address...</p> : displayAddress ? (
                <address>
                  <strong>{displayAddress.name}</strong><br />
                  {displayAddress.houseName}, {displayAddress.locality}<br />
                  {displayAddress.city}, {displayAddress.state} {displayAddress.pincode}<br />
                  {displayAddress.phone}
                </address>
              ) : <p>No address added yet.</p>}
            </section>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Profile;