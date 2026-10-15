import { useState, useEffect } from 'react';
import API from '../../api/axios';
import './couponManagement.css';

const initialForm = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  maxDiscount: '',
  minOrderAmount: '',
  expiryDate: '',
  description: ''
};

const CouponManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [couponLoadError, setCouponLoadError] = useState('');

  const fetchCoupons = async () => {
    try {
      const res = await API.get('/admin/coupons');
      setCoupons(res.data?.coupons || []);
      setCouponLoadError('');
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setCoupons([]);
      setCouponLoadError(error.response?.data?.message || 'Could not load coupons. Check your admin login and try again.');
    }
  };

  useEffect(() => {
    let isActive = true;
    API.get('/admin/coupons')
      .then((res) => {
        if (isActive) setCoupons(res.data?.coupons || []);
      })
      .catch((error) => {
        if (isActive) {
          console.error('Error fetching coupons:', error);
          setCouponLoadError(error.response?.data?.message || 'Could not load coupons. Check your admin login and try again.');
        }
      })
      .finally(() => {
        if (isActive) setLoadingCoupons(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post('/admin/coupons', {
        ...form,
        discountValue: Number(form.discountValue),
        maxDiscount: Number(form.maxDiscount || 0),
        minOrderAmount: Number(form.minOrderAmount || 0)
      });

      setForm(initialForm);
      await fetchCoupons();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlist = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;

    try {
      await API.delete(`/admin/coupons/${id}`);
      await fetchCoupons();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete coupon');
    }
  };

  const filteredCoupons = coupons.filter((item) =>
    String(item.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="coupon-management-page">
      <main className="coupon-main-content">
        <div className="coupon-card">
          <div className="coupon-header">
            <h2>Coupons</h2>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search Coupon"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>

          <form onSubmit={handleAddCoupon} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <input name="code" value={form.code} onChange={handleInputChange} placeholder="Coupon code" required />
            <select name="discountType" value={form.discountType} onChange={handleInputChange}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
            <input name="discountValue" type="number" min="1" value={form.discountValue} onChange={handleInputChange} placeholder="Discount value" required />
            <input name="maxDiscount" type="number" min="0" value={form.maxDiscount} onChange={handleInputChange} placeholder="Max discount" />
            <input name="minOrderAmount" type="number" min="0" value={form.minOrderAmount} onChange={handleInputChange} placeholder="Min order" />
            <input name="expiryDate" type="date" value={form.expiryDate} onChange={handleInputChange} required />
            <input name="description" value={form.description} onChange={handleInputChange} placeholder="Description" />
            <button type="submit" className="btn-add-coupon" disabled={loading}>{loading ? 'Saving...' : 'Add Coupon'}</button>
          </form>

          <table className="coupon-table">
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Discount /Type</th>
                <th>Start Date</th>
                <th>Expiry Date</th>
                <th>Max Amount</th>
                <th>Min Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingCoupons ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Loading coupons...</td></tr>
              ) : couponLoadError ? (
                <tr><td colSpan="7" role="alert" style={{ textAlign: 'center', padding: '20px', color: '#b71c1c' }}>{couponLoadError}</td></tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No coupons found.</td>
                </tr>
              ) : (
                filteredCoupons.map((item) => (
                  <tr key={item._id || item.id}>
                    <td><strong>{item.code}</strong></td>
                    <td>{item.discountType === 'fixed' ? `₹${item.discountValue}` : `${item.discountValue}%`}</td>
                    <td>{new Date(item.startDate).toLocaleDateString('en-GB')}</td>
                    <td>{new Date(item.expiryDate).toLocaleDateString('en-GB')}</td>
                    <td>{item.maxDiscount ? `₹${item.maxDiscount}` : '—'}</td>
                    <td>{item.minOrderAmount ? `₹${item.minOrderAmount}` : '—'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-unlist" onClick={() => handleUnlist(item._id || item.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default CouponManagement;