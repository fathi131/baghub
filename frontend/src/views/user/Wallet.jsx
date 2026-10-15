import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import './Wallet.css';

const Wallet = () => {
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState([]);

  const fetchWallet = async () => {
    try {
      const res = await API.get('/user/wallet');
      setWalletBalance(Number(res.data?.walletBalance || 0));
      setTransactions(res.data?.walletTransactions || []);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleAddQuickMoney = (val) => {
    setAmount(val);
  };

  const handleAddMoney = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    try {
      await API.post('/user/wallet/add-money', { amount: Number(amount) });
      setAmount('');
      await fetchWallet();
    } catch (error) {
      console.error('Error adding money to wallet:', error);
      alert(error.response?.data?.message || 'Failed to add money to wallet');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="wallet-page-container">
      
      <aside className="my-account-sidebar">
        <h3>My Account</h3>
        <ul>
          <li><Link to="/profile">👤 Personal Information</Link></li>
          <li><Link to="/manage-address">📍 Address</Link></li>
          <li><Link to="/my-orders">📦 Order</Link></li>
          <li className="active"><Link to="/wallet">💳 Wallet</Link></li>
          <li><Link to="/coupons">🎟️ Coupon</Link></li>
          <li><Link to="/referral">🎁 Referral Program</Link></li>
          <li><Link to="/password-change">🔒 Password Change</Link></li>
          <li onClick={handleLogout} style={{ cursor: 'pointer' }}>🚪 Logout</li>
        </ul>
      </aside>

      
      <main className="wallet-main-content">
      
        <div className="wallet-card">
          <h2>My Wallet</h2>
          <div className="balance-box">
            <div className="balance-header">
              <span>Wallet</span>
              <strong className="balance-amount">₹{walletBalance.toFixed(2)}</strong>
            </div>

            <form onSubmit={handleAddMoney} className="add-money-section">
              <label>Add money to wallet</label>
              <input
                type="number"
                placeholder="₹1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="quick-buttons">
                <button type="button" onClick={() => handleAddQuickMoney('2000')}>+ ₹2,000</button>
                <button type="button" onClick={() => handleAddQuickMoney('1000')}>+ ₹1,000</button>
                <button type="button" onClick={() => handleAddQuickMoney('500')}>+ ₹500</button>
              </div>
              <button type="submit" className="submit-wallet-btn">Add your money to wallet</button>
            </form>
          </div>
        </div>

        
        <div className="transaction-card">
          <h3>Transaction History</h3>
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Order Id</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No wallet transactions yet.</td>
                </tr>
              ) : (
                transactions.map((item, index) => {
                  const formattedDate = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';
                  const amountText = `${item.type === 'credit' ? '+' : '-'}₹${Number(item.amount || 0)}`;
                  const status = item.type === 'credit' ? 'Successful' : 'Debited';
                  const color = item.type === 'credit' ? 'green' : 'black';

                  return (
                    <tr key={`${item.orderId || 'wallet'}-${index}`}>
                      <td>{formattedDate}</td>
                      <td>{item.reason || (item.type === 'credit' ? 'Added' : 'Used')}</td>
                      <td>{item.orderId || '—'}</td>
                      <td>{amountText}</td>
                      <td className={`status-${color}`}>{status}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Wallet;