import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';
import './CancelConfirmationPage.css';

const CancelConfirmationPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);

  const handleCancelConfirm = async () => {
    try {
      setLoading(true);
      await API.patch(`/user/orders/${id}/cancel`, {
        reason: 'User cancelled from order page'
      });
      alert('Order cancelled successfully!');
      navigate('/my-orders');
    } catch (error) {
      console.error('Cancel order error:', error);
      alert(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cancel-confirm-container">
      <div className="cancel-confirm-card">
        <h2 className="cancel-title">Cancel Order?</h2>
        <p className="cancel-text">
          Are you sure you want<br />to cancel this order?
        </p>

        <div className="cancel-btn-group">
          <button
            className="btn-cancel-action"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            No
          </button>
          <button
            className="btn-cancel-action"
            onClick={handleCancelConfirm}
            disabled={loading}
          >
            {loading ? 'Cancelling...' : 'Yes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelConfirmationPage;