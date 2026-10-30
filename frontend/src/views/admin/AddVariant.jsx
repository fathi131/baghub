import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import './AddVariant.css';
import { toast } from 'react-toastify';

const AddVariant = () => {
  const { productId: urlProductId } = useParams();
  const navigate = useNavigate();

  const [productId, setProductId] = useState(urlProductId || '');
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingVariants, setFetchingVariants] = useState(false);

  const [formData, setFormData] = useState({
    size: '',
    color: '',
    material: '',
    sku: '',
    price: '',
    oldPrice: '',
    stockCount: ''
  });

  
  useEffect(() => {
    if (urlProductId) return;
    API.get('/admin/products', { params: { limit: 100 } })
      .then((res) => setProducts(res.data?.data || []))
      .catch((err) => console.error('Fetch products error:', err));
  }, [urlProductId]);

  
  useEffect(() => {
    if (!productId) return;
    setFetchingVariants(true);
    API.get(`/admin/products/${productId}/variants`)
      .then((res) => setVariants(res.data?.variants || []))
      .catch((err) => console.error('Fetch variants error:', err))
      .finally(() => setFetchingVariants(false));
  }, [productId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productId) {
      toast.info('Please select a product');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      toast.error('Price is required');
      return;
    }

    try {
      setLoading(true);
      const res = await API.post(`/admin/products/${productId}/variants`, {
        size: formData.size.trim(),
        color: formData.color.trim(),
        material: formData.material.trim(),
        sku: formData.sku.trim(),
        price: Number(formData.price),
        oldPrice: formData.oldPrice ? Number(formData.oldPrice) : 0,
        stockCount: Number(formData.stockCount) || 0
      });

      toast.success('Variant added successfully!');
      setVariants(res.data?.variants || []);
      setFormData({
        size: '',
        color: '',
        material: '',
        sku: '',
        price: '',
        oldPrice: '',
        stockCount: ''
      });
    } catch (error) {
      console.error('Add variant error:', error);
      toast.error(error.response?.data?.message || 'Failed to add variant');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (variantId) => {
    if (!window.confirm('Delete this variant?')) return;

    try {
      await API.delete(`/admin/products/${productId}/variants/${variantId}`);
      setVariants((prev) => prev.filter((v) => v._id !== variantId));
      toast.success('Variant deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete variant');
    }
  };

  return (
    <div className="add-variant-container">
      <button
        type="button"
        onClick={() => navigate('/admin/products')}
        style={{
          background: '#f0f0f0',
          border: '1px solid #ccc',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '16px'
        }}
      >
        ← Back to Products
      </button>

      <h1 className="add-variant-title">Product Variants</h1>
      <h2 className="add-variant-subtitle">Add Product Variants</h2>

      
      {!urlProductId && (
        <div className="form-group-variant" style={{ marginBottom: '20px' }}>
          <label>Select Product</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="variant-input"
            style={{ padding: '10px' }}
          >
            <option value="">-- Choose a product --</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} (₹{p.price})
              </option>
            ))}
          </select>
        </div>
      )}

      
      <form onSubmit={handleSubmit} className="add-variant-form">
        <div className="form-group-variant">
          <label>Size</label>
          <input
            type="text"
            name="size"
            value={formData.size}
            onChange={handleChange}
            placeholder="e.g., Small, Medium, Large, 32L"
            className="variant-input"
          />
        </div>

        <div className="form-group-variant">
          <label>Color</label>
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder="e.g., Black, Red, Brown"
            className="variant-input"
          />
        </div>

        <div className="form-group-variant">
          <label>Material</label>
          <input
            type="text"
            name="material"
            value={formData.material}
            onChange={handleChange}
            placeholder="e.g., Leather, Canvas (optional)"
            className="variant-input"
          />
        </div>

        <div className="form-group-variant">
          <label>SKU (optional)</label>
          <input
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            placeholder="e.g., BAG-BLK-M"
            className="variant-input"
          />
        </div>

        <div className="form-group-variant">
          <label>Price *</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="e.g., 2500"
            className="variant-input"
            min="0"
            required
          />
        </div>

        <div className="form-group-variant">
          <label>Old Price</label>
          <input
            type="number"
            name="oldPrice"
            value={formData.oldPrice}
            onChange={handleChange}
            placeholder="e.g., 3500 (optional)"
            className="variant-input"
            min="0"
          />
        </div>

        <div className="form-group-variant">
          <label>Stock Count</label>
          <input
            type="number"
            name="stockCount"
            value={formData.stockCount}
            onChange={handleChange}
            placeholder="e.g., 10"
            className="variant-input"
            min="0"
          />
        </div>

        <button type="submit" className="btn-save-variant" disabled={loading}>
          {loading ? 'Saving...' : 'Save Variant'}
        </button>
      </form>

      
      {productId && (
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ color: '#03544c', marginBottom: '16px' }}>
            Existing Variants ({variants.length})
          </h2>

          {fetchingVariants ? (
            <p>Loading variants...</p>
          ) : variants.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic' }}>
              No variants added yet. Add your first variant above.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr style={{ background: '#03544c', color: '#fff' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Size</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Color</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Material</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Price</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Stock</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{v.size || '—'}</td>
                    <td style={{ padding: '12px' }}>{v.color || '—'}</td>
                    <td style={{ padding: '12px' }}>{v.material || '—'}</td>
                    <td style={{ padding: '12px' }}>₹{v.price}</td>
                    <td style={{ padding: '12px' }}>{v.stockCount}</td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleDelete(v._id)}
                        style={{
                          background: '#dc3545',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AddVariant;