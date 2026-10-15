import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import './BrandManagement.css';

const BrandManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let isActive = true;
    API.get('/admin/brands')
      .then(({ data }) => {
        if (isActive) setBrands(data.brands || []);
      })
      .catch((error) => {
        if (isActive) setLoadError(error.response?.data?.message || 'Could not load brands. Check admin access and retry.');
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [refreshKey]);

  const handleToggleStatus = async (brand) => {
    const status = brand.status === 'Active' ? 'Inactive' : 'Active';
    setSavingId(brand._id);
    try {
      const { data } = await API.patch(`/admin/brands/${brand._id}/status`, { status });
      setBrands((current) => current.map((item) => item._id === brand._id ? data.brand : item));
    } catch (error) {
      alert(error.response?.data?.message || 'Could not update brand status');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveName = async (id) => {
    setSavingId(id);
    try {
      const { data } = await API.put(`/admin/brands/${id}`, { name: editingName });
      setBrands((current) => current.map((brand) => brand._id === id ? data.brand : brand));
      setEditingId(null);
      setEditingName('');
    } catch (error) {
      alert(error.response?.data?.message || 'Could not rename brand');
    } finally {
      setSavingId(null);
    }
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="admin-main-content">
        <div className="brand-card">
          <div className="brand-header">
            <h2>Brand Details</h2>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>

          <table className="brand-table">
            <thead>
              <tr>
                <th>Sl No</th>
                <th>Brand Name</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="brand-empty-state">Loading brands...</td></tr>
              ) : loadError ? (
                <tr><td colSpan="4" className="brand-empty-state" role="alert">
                  {loadError}{' '}
                  <button type="button" className="btn-edit" onClick={() => { setLoading(true); setLoadError(''); setRefreshKey((key) => key + 1); }}>Retry</button>
                </td></tr>
              ) : filteredBrands.length ? filteredBrands.map((brand, index) => (
                <tr key={brand._id}>
                  <td>{index + 1}</td>
                  <td>
                    {editingId === brand._id ? (
                      <input className="brand-name-edit" value={editingName} onChange={(event) => setEditingName(event.target.value)} autoFocus />
                    ) : brand.name}
                  </td>
                  <td className={brand.status === 'Active' ? 'status-active' : 'status-inactive'}>{brand.status}</td>
                  <td>
                    <div className="action-btns">
                      {editingId === brand._id ? (
                        <>
                          <button className="btn-edit" disabled={savingId === brand._id} onClick={() => handleSaveName(brand._id)}>
                            {savingId === brand._id ? 'Saving...' : 'Save'}
                          </button>
                          <button className="btn-cancel-edit" onClick={() => { setEditingId(null); setEditingName(''); }}>Cancel</button>
                        </>
                      ) : (
                        <button className="btn-edit" onClick={() => { setEditingId(brand._id); setEditingName(brand.name); }}>Edit</button>
                      )}
                      <button
                        className="btn-unlist"
                        disabled={savingId === brand._id}
                        onClick={() => handleToggleStatus(brand)}
                      >
                        {brand.status === 'Active' ? 'Unlist' : 'List'}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="brand-empty-state">{searchTerm ? 'No brands match your search.' : 'No brands have been added yet.'}</td></tr>
              )}
            </tbody>
          </table>

          <div className="add-brand-wrapper">
            <button type="button" className="btn-add-brand" onClick={() => navigate('/admin/brands/add')}>Add new Brand</button>
          </div>

        </div>
    </main>
  );
};

export default BrandManagement;