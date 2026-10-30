import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios'; 
import './Address.css';
import { toast } from 'react-toastify';

const Address = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  
useEffect(() => {
  const fetchAddresses = async () => {
  try {
    setLoading(true);   
    
    
    const token = localStorage.getItem('token'); 

    // API Call
    const response = await API.get('/user/address', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("FETCHED DATA:", response.data);

    
    const addressList = response.data.addresses || response.data || [];
    setAddresses(addressList);
  } catch (error) {
    console.error("Error fetching addresses:", error);
  } finally {
   
    setLoading(false); 
  }
};

  fetchAddresses();
}, []);
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      await API.delete(`/user/address/${id}`);
      
      setAddresses((prev) => prev.filter((addr) => (addr._id || addr.id) !== id));
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error(error.response?.data?.message || 'Failed to delete address');
    }
  };

  
  const handleEdit = (addr) => {
    const addressId = addr._id || addr.id;
    
    navigate(`/edit-address/${addressId}`, { state: { address: addr } });
  };

  return (
    <div className="profile-page-wrapper">
      
      <div className="page-header-title">
        <h2>Manage Address</h2>
      </div>

      
      <main className="profile-page">
        <div className="profile-container">
          
          
          <aside className="account-box">
            <h3 className="box-title">My Account</h3>
            <ul className="account-menu">
              <li>
                <Link to="/profile">
                  <span className="icon">👤</span> Personal Information
                </Link>
              </li>
              <li className="active">
                <Link to="/manage-address">
                  <span className="icon">📍</span> Address
                </Link>
              </li>
              <li>
                <Link to="/my-orders">
                  <span className="icon">📦</span> Order
                </Link>
              </li>
              <li>
                <Link to="/wallet">
                  <span className="icon">💳</span> Wallet
                </Link>
              </li>
              <li>
                <Link to="/coupons">
                  <span className="icon">🎟️</span> Coupon
                </Link>
              </li>
              <li>
                <Link to="/referral">
                  <span className="icon">🎁</span> Referral Program
                </Link>
              </li>
              <li>
                <Link to="/password-change">
                  <span className="icon">🔑</span> Password Change
                </Link>
              </li>
              <li onClick={handleLogout} className="logout-li">
                <span className="icon">🚪</span> Logout
              </li>
            </ul>
          </aside>

          
          <section className="info-box">
            <div className="address-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="box-title-center" style={{ margin: 0 }}>Address Management</h3>
              <Link to="/add-address" className="add-address-btn" style={{ textDecoration: 'none', background: '#000', color: '#fff', padding: '8px 16px', borderRadius: '20px', fontSize: '13px' }}>
                + Add New Address
              </Link>
            </div>

            <div className="address-list">
              {loading ? (
                <p>Loading addresses...</p>
              ) : addresses.length === 0 ? (
                <p className="no-address-text">No addresses saved yet.</p>
              ) : (
                addresses.map((addr) => {
                  const addrId = addr._id || addr.id;
                  return (
                    <div key={addrId} className="address-card" style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '10px', marginBottom: '15px' }}>
                      {addr.isDefault && <span className="default-badge" style={{ background: '#000', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '4px' }}>DEFAULT</span>}
                      <h4 style={{ margin: '8px 0' }}>{addr.name}</h4>
                      <p style={{ margin: '4px 0', fontSize: '13px', color: '#555' }}>
                        {addr.addressLine || addr.street}, {addr.city}
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '13px', color: '#555' }}>
                        {addr.state} - {addr.pincode}
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '13px', color: '#555' }}>
                        Phone: {addr.phone}
                      </p>

                      <div className="address-card-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button 
                          className="edit-btn" 
                          onClick={() => handleEdit(addr)} 
                          style={{ cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDelete(addrId)}
                          style={{ color: 'red', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default Address;