import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import './AddBrand.css';

const AddBrand = () => {
  const navigate = useNavigate();
  const [brandName, setBrandName] = useState('');
  const [status, setStatus] = useState('Active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!brandName.trim()) {
      setError('Brand name is required!');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await API.post('/admin/brands', { name: brandName.trim(), status });

      navigate('/admin/brands');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add brand.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-main-content add-brand-page">
        <div className="add-brand-card">
          <h2>Brands</h2>
          <p className="section-subtitle">Add New Brand</p>

          {error && <p className="error-message">{error}</p>}

          <form onSubmit={handleSubmit} className="add-brand-form">
            <div className="form-group">
              <label>Brand Name</label>
              <input
                type="text"
                placeholder="Enter brand name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <button type="submit" className="btn-add" disabled={loading}>
              {loading ? 'Adding...' : 'Add Brand'}
            </button>
          </form>
        </div>
    </main>
  );
};

export default AddBrand;