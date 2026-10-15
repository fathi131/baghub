import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import './AddOffer.css';

const AddOffer = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: 'product',
    targetId: '',
    discountType: 'percentage',
    startDate: '',
    expiryDate: '',
    discountValue: '',
    description: '',
    maxDiscount: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [targetLoadError, setTargetLoadError] = useState('');

  useEffect(() => {
    Promise.all([
      API.get('/admin/products', { params: { page: 1, limit: 1000 } }),
      API.get('/admin/categories', { params: { page: 1, limit: 1000, activeOnly: true } })
    ]).then(([productResponse, categoryResponse]) => {
      setProducts((productResponse.data?.data || []).filter((product) => !product.isBlocked && !product.isDeleted));
      setCategories(categoryResponse.data?.data || []);
    }).catch((requestError) => {
      setTargetLoadError(requestError.response?.data?.message || 'Could not load products/categories for targeting.');
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({ ...current, [name]: value, ...(name === 'type' ? { targetId: '' } : {}) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(formData.startDate) > new Date(formData.expiryDate)) {
      setError('Expiry date must be on or after the start date.');
      return;
    }
    try {
      setLoading(true);
      setError('');

      await API.post('/admin/offers', {
        ...formData,
        discountValue: Number(formData.discountValue),
        maxDiscount: Number(formData.maxDiscount || 0),
        targetId: formData.targetId || undefined
      });

      navigate('/admin/offers');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add offer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-main-content add-offer-page">
        <div className="add-offer-card">
          <h2>Offers</h2>
          <h3 className="section-title">Add new Offer</h3>

          {error && <p className="error-message">{error}</p>}

          <form onSubmit={handleSubmit} className="add-offer-form">
            <div className="form-grid">
              {/* Left Column */}
              <div className="form-column">
                <div className="form-group">
                  <label>Offer Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Starting Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Offer Description</label>
                  <textarea
                    name="description"
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>

              <div className="form-column">
                <div className="form-group">
                  <label>Select Discount Type</label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleChange}
                    required
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Flat Amount (₹)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Select Discount Applicable To</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="product">Product</option>
                    <option value="category">Category</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Discount Value</label>
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>

                {targetLoadError && formData.type !== 'referral' && <p className="error-message">{targetLoadError}</p>}
                {formData.type !== 'referral' && (
                  <div className="form-group">
                    <label>Select {formData.type === 'product' ? 'Product' : 'Category'}</label>
                    <select
                      name="targetId"
                      value={formData.targetId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select {formData.type === 'product' ? 'Product' : 'Category'}</option>
                      {(formData.type === 'product' ? products : categories).map((target) => (
                        <option key={target._id} value={target._id}>{target.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Max Discount</label>
                  <input
                    type="number"
                    name="maxDiscount"
                    placeholder="Optional max cap"
                    value={formData.maxDiscount}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="submit-btn-container">
              <button type="button" className="btn-cancel-offer" onClick={() => navigate('/admin/offers')}>Cancel</button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
    </main>
  );
};

export default AddOffer;