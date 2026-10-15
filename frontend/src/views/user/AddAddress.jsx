import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios'; 
import './AddAddress.css';

const AddAddress = () => {
  const [addressData, setAddressData] = useState({
    name: '',
    phone: '',
    houseName: '',
    locality: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    isDefault: false
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        name: addressData.name,
        phone: addressData.phone,
        houseName: addressData.houseName,
        locality: addressData.locality,
        city: addressData.city,
        state: addressData.state,
        country: addressData.country,
        pincode: addressData.pincode,
        isDefault: addressData.isDefault
      };

      const res = await API.post('/user/address', payload);

      if (res.status === 201 || res.status === 200 || res.data?.success) {
        alert('Address added successfully!');
        navigate('/manage-address'); 
      }
    } catch (error) {
      console.error('Error adding address:', error);
      setErrorMsg(error.response?.data?.message || 'Failed to add address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="account-page">
      <main className="account-wrapper">
        <div className="account-container">
          
          
          <aside className="account-sidebar">
            <h3 className="sidebar-title">My Account</h3>
            <ul className="sidebar-menu">
              <li>
                <Link to="/profile">👤 Personal Information</Link>
              </li>
              <li className="active">
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
                  🚪 Logout
                </button>
              </li>
            </ul>
          </aside>

          
          <section className="account-content">
            <div className="content-card">
              <h2 className="content-title">Add New Address</h2>

              {errorMsg && <div className="error-banner" style={{ color: 'red', marginBottom: '10px' }}>{errorMsg}</div>}

              <form onSubmit={handleSubmit} className="add-address-form">
                
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={addressData.name}
                      onChange={handleChange}
                      className="account-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      pattern="[0-9]{10}"
                      placeholder="10-digit phone number"
                      value={addressData.phone}
                      onChange={handleChange}
                      className="account-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="houseName">House Name / Flat No.</label>
                  <input
                    type="text"
                    id="houseName"
                    name="houseName"
                    value={addressData.houseName}
                    onChange={handleChange}
                    className="account-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="locality">Locality / Street</label>
                  <input
                    type="text"
                    id="locality"
                    name="locality"
                    value={addressData.locality}
                    onChange={handleChange}
                    className="account-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="city">Town / City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={addressData.city}
                    onChange={handleChange}
                    className="account-input"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="state">State</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={addressData.state}
                      onChange={handleChange}
                      className="account-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={addressData.country}
                      onChange={handleChange}
                      className="account-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="pincode">Pincode</label>
                  <input
                    type="text"
                    id="pincode"
                    name="pincode"
                    pattern="[0-9]{6}"
                    placeholder="6-digit pincode"
                    value={addressData.pincode}
                    onChange={handleChange}
                    className="account-input"
                    required
                  />
                </div>

                <div className="form-action">
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default AddAddress;