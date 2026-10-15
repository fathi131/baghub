import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import './OfferManagement.css';

const OfferManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOffers = async () => {
    try {
      const res = await API.get('/admin/offers');
      setOffers(res.data?.offers || []);
      setLoadError('');
    } catch (error) {
      console.error('Error fetching offers:', error);
      setLoadError(error.response?.data?.message || 'Could not load offers. Check admin access and retry.');
    }
  };

  useEffect(() => {
    let isActive = true;
    API.get('/admin/offers')
      .then(({ data }) => {
        if (isActive) setOffers(data.offers || []);
      })
      .catch((error) => {
        if (isActive) setLoadError(error.response?.data?.message || 'Could not load offers. Check admin access and retry.');
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [refreshKey]);

  const handleStatusToggle = async (offer) => {
    setUpdatingId(offer._id);
    try {
      const { data } = await API.patch(`/admin/offers/${offer._id}/status`, { isActive: !offer.isActive });
      setOffers((current) => current.map((item) => item._id === offer._id ? data.offer : item));
    } catch (error) {
      alert(error.response?.data?.message || 'Could not update offer status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this offer?')) return;

    try {
      await API.delete(`/admin/offers/${id}`);
      await fetchOffers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete offer');
    }
  };

  const filteredOffers = offers.filter((offer) =>
    String(offer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(offer.type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="offer-management-page">
        <div className="offer-card">
          <div className="offer-header">
            <h2>Offers</h2>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search offers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>

          <table className="offer-table">
            <thead>
              <tr>
                <th>Sl.No</th>
                <th>Offer Name</th>
                <th>Offer Type</th>
                <th>Start Date</th>
                <th>ExpiryDate</th>
                <th>Discount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="offer-empty-state">Loading offers...</td></tr>
              ) : loadError ? (
                <tr><td colSpan="8" className="offer-empty-state" role="alert">
                  {loadError}{' '}
                  <button type="button" className="btn-edit-offer" onClick={() => { setLoading(true); setLoadError(''); setRefreshKey((key) => key + 1); }}>Retry</button>
                </td></tr>
              ) : filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>{offers.length ? 'No offers match your search.' : 'No offers have been created yet.'}</td>
                </tr>
              ) : (
                filteredOffers.map((offer, index) => (
                  <tr key={offer._id || offer.id}>
                    <td>{index + 1}</td>
                    <td>{offer.name}</td>
                    <td>{offer.type}</td>
                    <td><strong>{new Date(offer.startDate).toLocaleDateString('en-GB')}</strong></td>
                    <td><strong>{new Date(offer.expiryDate).toLocaleDateString('en-GB')}</strong></td>
                    <td>{offer.discountType === 'fixed' ? `₹${offer.discountValue}` : `${offer.discountValue}%`}</td>
                    <td>{offer.isActive ? 'Active' : 'Inactive'}</td>
                    <td>
                      <div className="action-btns">
                        <button type="button" className="btn-edit-offer" onClick={() => navigate(`/admin/offers/edit/${offer._id}`)}>Edit</button>
                        <button type="button" className="btn-toggle-offer" disabled={updatingId === offer._id} onClick={() => handleStatusToggle(offer)}>
                          {updatingId === offer._id ? 'Saving...' : offer.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="btn-remove" onClick={() => handleRemove(offer._id || offer.id)}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="add-offer-wrapper">
            <button type="button" className="btn-add-offer" onClick={() => navigate('/admin/offers/add')}>Add new Offer</button>
          </div>
        </div>
    </main>
  );
};

export default OfferManagement;