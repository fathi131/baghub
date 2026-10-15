import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Share2 } from 'lucide-react';
import API from '../../api/axios';
import './ReferralProgram.css';

const ReferralProgram = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let isActive = true;
    API.get('/user/referral')
      .then(({ data }) => {
        if (isActive) setDashboard(data);
      })
      .catch((requestError) => {
        if (isActive) setError(requestError.response?.data?.message || 'Could not load referral details. Please sign in again.');
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const copyText = async (value, successMessage) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(successMessage);
      window.setTimeout(() => setNotice(''), 2000);
    } catch {
      setNotice('Clipboard access is unavailable in this browser.');
    }
  };

  const handleShare = async () => {
    if (!dashboard?.referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join BagHub',
          text: `Sign up with my referral code ${dashboard.referralCode}`,
          url: dashboard.referralLink
        });
      } catch (shareError) {
        if (shareError.name !== 'AbortError') {
          await copyText(dashboard.referralLink, 'Referral link copied');
        }
      }
    } else {
      await copyText(dashboard.referralLink, 'Referral link copied');
    }
  };

  const handleLogout = () => {
    ['token', 'role', 'isLoggedIn', 'user', 'googleToken'].forEach((key) => localStorage.removeItem(key));
    navigate('/login', { replace: true });
  };

  const rewardDescription = (offer) => {
    if (!offer) return 'Referral rewards are not active right now.';
    const value = offer.discountType === 'fixed'
      ? `₹${Number(offer.discountValue).toLocaleString()}`
      : `${Number(offer.discountValue)}%${offer.maxDiscount ? ` (up to ₹${Number(offer.maxDiscount).toLocaleString()})` : ''}`;
    return `${value} wallet reward for you and your friend after their first order is delivered.`;
  };

  return (
    <div className="referral-page-container">
      {/* Left Sidebar */}
      <aside className="my-account-sidebar">
        <h3>My Account</h3>
        <ul>
          <li><Link to="/profile">👤 Personal Information</Link></li>
          <li><Link to="/manage-address">📍 Address</Link></li>
          <li><Link to="/my-orders">📦 Order</Link></li>
          <li><Link to="/wallet">💳 Wallet</Link></li>
          <li><Link to="/coupons">🎟️ Coupon</Link></li>
          <li className="active"><Link to="/referral">🎁 Referral Program</Link></li>
          <li><Link to="/password-change">🔒 Password Change</Link></li>
          <li onClick={handleLogout} style={{ cursor: 'pointer' }}>🚪 Logout</li>
        </ul>
      </aside>

      {/* Main Referral Content */}
      <main className="referral-main-content">
        <div className="referral-card">
          <h2>Referral Program</h2>
            <p className="referral-subtitle">Invite friends and track your rewards</p>

            {loading ? <p>Loading referral details...</p> : error ? (
              <p className="referral-error" role="alert">{error}</p>
            ) : dashboard ? (
              <>
                <section className="referral-reward-banner">
                  <h3>{dashboard.rewardOffer?.name || 'Referral reward'}</h3>
                  <p>{rewardDescription(dashboard.rewardOffer)}</p>
                  {dashboard.rewardOffer?.expiryDate && (
                    <small>Offer ends {new Date(dashboard.rewardOffer.expiryDate).toLocaleDateString('en-GB')}</small>
                  )}
                </section>

                <div className="referral-stats">
                  <div><span>Friends invited</span><strong>{dashboard.stats.invited}</strong></div>
                  <div><span>Rewards earned</span><strong>{dashboard.stats.rewarded}</strong></div>
                  <div><span>Wallet rewards</span><strong>₹{Number(dashboard.stats.totalEarned).toLocaleString()}</strong></div>
                </div>

                <div className="code-box-wrapper">
                  <div className="code-card">
                    <span className="code-title">Your Referral Code</span>
                    <div className="code-display">{dashboard.referralCode}</div>
                    <div className="action-buttons">
                      <button className="copy-btn" type="button" onClick={() => copyText(dashboard.referralCode, 'Referral code copied')}>
                        <Copy size={16} aria-hidden="true" /> Copy code
                      </button>
                      <button className="share-icon-btn" type="button" title="Share referral link" aria-label="Share referral link" onClick={handleShare}>
                        <Share2 size={18} aria-hidden="true" />
                      </button>
                    </div>
                    <div className="referral-link-row">
                      <input aria-label="Referral signup link" readOnly value={dashboard.referralLink} />
                      <button type="button" onClick={() => copyText(dashboard.referralLink, 'Referral link copied')}>Copy link</button>
                    </div>
                    {notice && <p className="referral-notice" role="status">{notice}</p>}
                  </div>
                </div>

                <section className="referral-history">
                  <h3>Invitations</h3>
                  {dashboard.referrals.length === 0 ? (
                    <p>No friends have joined with your code yet.</p>
                  ) : dashboard.referrals.map((referral, index) => (
                    <div className="referral-history-row" key={`${referral.joinedAt}-${index}`}>
                      <span>Joined {new Date(referral.joinedAt).toLocaleDateString('en-GB')}</span>
                      <strong className={referral.rewardEarned ? 'reward-complete' : 'reward-pending'}>
                        {referral.rewardEarned ? `Rewarded ₹${Number(referral.rewardAmount).toLocaleString()}` : 'Waiting for first delivered order'}
                      </strong>
                    </div>
                  ))}
                </section>
              </>
            ) : null}
        </div>
      </main>
    </div>
  );
};

export default ReferralProgram;