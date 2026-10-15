import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './bannerManagement.css';

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

const BannerManagement = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState(null);

  const token = localStorage.getItem('token');

  const fetchBanner = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/admin/banner`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.banner) {
        setBanner(res.data.banner);
      }
    } catch (err) {
      console.error("Failed to fetch banner", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanner();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('bannerImage', selectedFile);

    try {
      setUploading(true);
      setError('');

      const res = await axios.post(`${API_BASE_URL}/admin/banner/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.banner) {
        setBanner(res.data.banner);
      } else {
        fetchBanner();
      }
      setSelectedFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload banner.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveBanner = async () => {
    if (window.confirm('Are you sure you want to remove the current main banner?')) {
      try {
        await axios.delete(`${API_BASE_URL}/admin/banner/${banner._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBanner(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to remove banner.');
      }
    }
  };

  return (
    <div className="banner-page-wrapper" style={{ padding: '20px' }}>
      <div className="banner-card">
        <h2>Banner Management</h2>

        {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}

        {/* Drag & Drop Upload Zone */}
        <div
          className="drop-zone"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="drop-zone-icon">🖼️</div>
          <p className="drop-zone-text">
            {selectedFile ? selectedFile.name : 'Drag & Drop File Here'}
          </p>
          <label className="btn-select-image">
            Select Image
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              hidden
            />
          </label>
          {selectedFile && (
            <button
              className="btn-upload-submit"
              onClick={handleUpload}
              disabled={uploading}
              style={{ marginTop: '10px' }}
            >
              {uploading ? 'Uploading...' : 'Upload Selected Banner'}
            </button>
          )}
        </div>

        
        <div className="main-banner-section" style={{ marginTop: '30px' }}>
          <h3>Main Banner</h3>

          {loading ? (
            <p>Loading Banner...</p>
          ) : banner ? (
            <div className="banner-preview-box">
              <div className="banner-text-content">
                <h1>{banner.title || 'Main Banner'}</h1>
                <p>{banner.subtitle || ''}</p>
                <button className="btn-remove-banner" onClick={handleRemoveBanner}>
                  Remove
                </button>
              </div>
              <div className="banner-image-wrapper">
                <img src={banner.image || banner.bannerUrl} alt="Main Banner" style={{ maxWidth: '100%' }} />
              </div>
            </div>
          ) : (
            <p className="no-banner-text">No active main banner found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BannerManagement;