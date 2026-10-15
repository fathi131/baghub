import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';
import './ReturnOrderPage.css';

const ReturnOrderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      alert('Please enter a reason for return');
      return;
    }

    try {
      setLoading(true);
      await API.patch(`/user/orders/${id}/return`, { reason: reason.trim() });
      alert('Return request submitted successfully!');
      navigate(`/view-return-order/${id}`);
    } catch (error) {
      console.error('Return request error:', error);
      alert(error.response?.data?.message || 'Failed to submit return request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="return-container">
     
      <div className="breadcrumb">
        My Account &gt; Order &gt; <span>Return Order</span>
      </div>

      
      <div className="return-card">
        <h2 className="return-title">Return Order</h2>

        <form onSubmit={handleSubmit} className="return-form">
          <label className="reason-label">Reason For Return</label>
          <textarea
            className="reason-textarea"
            rows="6"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
          ></textarea>

          <div className="action-buttons">
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Return'}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnOrderPage;