import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import API from '../../api/axios';
import './AddAddress.css';

const EditAddress = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const targetAddress = location.state?.address;
  const addressId = id || targetAddress?._id || targetAddress?.id;

  const [addressData, setAddressData] = useState({
    name: '',
    phone: '',
    houseName: '',
    locality: '',
    city: '',
    state: '',
    country: 'India',
    pincode: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (targetAddress) {
      setAddressData({
        name: targetAddress.name || '',
        phone: targetAddress.phone || '',
        houseName: targetAddress.houseName || targetAddress.addressLine || '',
        locality: targetAddress.locality || targetAddress.street || '',
        city: targetAddress.city || '',
        state: targetAddress.state || '',
        country: targetAddress.country || 'India',
        pincode: targetAddress.pincode || ''
      });
    } else if (addressId) {
      const fetchSingleAddress = async () => {
        try {
          const res = await API.get(`/user/address/${addressId}`);
          const addr = res.data?.address || res.data;
          if (addr) {
            setAddressData({
              name: addr.name || '',
              phone: addr.phone || '',
              houseName: addr.houseName || addr.addressLine || '',
              locality: addr.locality || addr.street || '',
              city: addr.city || '',
              state: addr.state || '',
              country: addr.country || 'India',
              pincode: addr.pincode || ''
            });
          }
        } catch (err) {
          console.error('Error fetching address:', err);
        }
      };
      fetchSingleAddress();
    }
  }, [addressId, targetAddress]);

  const handleChange = (e) => {
    setAddressData({
      ...addressData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!addressId) {
      alert('Address ID not found!');
      return;
    }

    setLoading(true);

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
        isDefault: false
      };

      const res = await API.put(`/user/address/${addressId}`, payload);

      if (res.status === 200 || res.data?.success) {
        alert('Address updated successfully!');
        navigate('/manage-address');
      }
    } catch (error) {
      console.error('Error updating address:', error);
      alert(error.response?.data?.message || 'Failed to update address');
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
              <li><Link to="/profile">👤 Personal Information</Link></li>
              <li className="active"><Link to="/manage-address">📍 Address</Link></li>
              <li><Link to="/my-orders">📦 Order</Link></li>
              <li><Link to="/wallet">💳 Wallet</Link></li>
              <li><Link to="/coupons">🎟️ Coupon</Link></li>
              <li><Link to="/referral">🎁 Referral Program</Link></li>
              <li><Link to="/password-change">🔑 Password Change</Link></li>
              <li>
                <button onClick={handleLogout} className="logout-btn">
                  🚪 Logout
                </button>
              </li>
            </ul>
          </aside>

          <section className="account-content">
            <div className="content-card">
              <h2 className="content-title">Edit Address</h2>

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
                      type="text"
                      id="phone"
                      name="phone"
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
                    value={addressData.pincode}
                    onChange={handleChange}
                    className="account-input"
                    required
                  />
                </div>

                <div className="form-action">
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Address'}
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

export default EditAddress;