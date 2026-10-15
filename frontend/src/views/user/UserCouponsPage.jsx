import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import './UserCouponsPage.css';

const UserCouponsPage = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isActive = true;
    const loadCoupons = () => {
      API.get('/user/coupons')
        .then((res) => {
          if (isActive) {
            setCoupons(res.data?.coupons || []);
            setLoadError('');
          }
        })
        .catch((error) => {
          console.error('Error fetching coupons:', error);
          if (isActive) {
            setCoupons([]);
            setLoadError(error.response?.data?.message || 'Could not load coupons. Please sign in again and retry.');
          }
        })
        .finally(() => {
          if (isActive) setLoading(false);
        });
    };

    loadCoupons();
    window.addEventListener('focus', loadCoupons);
    return () => {
      isActive = false;
      window.removeEventListener('focus', loadCoupons);
    };
  }, [refreshKey]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="profile-page-wrapper">
      <main className="profile-page">
        <div className="profile-container">
          <aside className="account-box">
            <h3 className="box-title">My Account</h3>
            <ul className="account-menu">
              <li><Link to="/profile"><span className="icon">👤</span> Personal Information</Link></li>
              <li><Link to="/manage-address"><span className="icon">📍</span> Address</Link></li>
              <li><Link to="/my-orders"><span className="icon">📦</span> Order</Link></li>
              <li><Link to="/wallet"><span className="icon">💳</span> Wallet</Link></li>
              <li className="active"><Link to="/coupons"><span className="icon">🎟️</span> Coupon</Link></li>
              <li><Link to="/referral"><span className="icon">🎁</span> Referral Program</Link></li>
              <li><Link to="/password-change"><span className="icon">🔑</span> Password Change</Link></li>
              <li onClick={handleLogout} className="logout-li"><span className="icon">🚪</span> Logout</li>
            </ul>
          </aside>

          <section className="info-box">
            <div className="content-card coupon-page-card">
              <div className="coupon-page-heading">
                <h2 className="content-title">Available Coupons</h2>
                <button
                  type="button"
                  className="coupon-refresh-btn"
                  onClick={() => {
                    setLoading(true);
                    setLoadError('');
                    setRefreshKey((key) => key + 1);
                  }}
                  disabled={loading}
                  aria-label="Refresh available coupons"
                >
                  {loading ? 'Checking...' : 'Refresh'}
                </button>
              </div>

              {loading ? (
                <p>Loading coupons...</p>
              ) : loadError ? (
                <p className="no-address-text" role="alert">{loadError}</p>
              ) : coupons.length === 0 ? (
                <p className="no-address-text">No coupons available right now.</p>
              ) : (
                <div className="coupon-list">
                  {coupons.map((coupon) => (
                    <div className="coupon-item" key={coupon._id || coupon.code}>
                      <div className="coupon-badge">{coupon.code}</div>
                      <div className="coupon-details">
                        <h4>{coupon.description || 'Store Discount'}</h4>
                        <p>
                          {coupon.discountType === 'fixed'
                            ? `Flat ₹${Number(coupon.discountValue).toLocaleString()} off`
                            : `${Number(coupon.discountValue)}% off`}
                        </p>
                        <small>
                          Min order: ₹{Number(coupon.minOrderAmount || 0).toLocaleString()} • Expires {new Date(coupon.expiryDate).toLocaleDateString('en-GB')}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default UserCouponsPage;
