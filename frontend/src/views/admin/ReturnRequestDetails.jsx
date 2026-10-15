import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../api/axios';
import './ReturnRequestDetails.css';

const ReturnRequestDetails = () => {
  const { requestId } = useParams();
  

  const [returnDetails, setReturnDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  
  useEffect(() => {
    const fetchReturnDetails = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/admin/orders/${requestId}`);
        setReturnDetails(res.data?.order || null);
      } catch (err) {
        console.error('Error fetching return details:', err);
        setReturnDetails(null);
      } finally {
        setLoading(false);
      }
    };

    if (requestId) fetchReturnDetails();
  }, [requestId]);

  const handleStatusUpdate = async (newStatus) => {
    
    const backendStatus = newStatus === 'Approved' ? 'returned' : 'delivered';

    try {
      setUpdating(true);
      await API.patch(`/admin/orders/${requestId}/status`, { status: backendStatus });
      setReturnDetails((prev) => ({ ...prev, status: backendStatus }));
      alert(`Return Request ${newStatus} Successfully!`);
    } catch (err) {
      console.error('Status update error:', err);
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="loading-text">Loading return request...</div>;
  if (!returnDetails) return <div className="loading-text">Return request not found.</div>;

  const isPending = returnDetails.status === 'return requested';

  return (
    <div className="return-details-container">
      <h1 className="page-title">Return Request Details</h1>

      <div className="return-details-grid">
        
        <div className="details-card">
          <div className="card-header-banner">Customer Details</div>

          <div className="info-group">
            <div className="info-row">
              <span className="info-label">Customer Name</span>
              <span className="info-value">{returnDetails.shippingAddress?.name || 'N/A'}</span>
            </div>
            <hr className="divider" />

            <div className="info-row">
              <span className="info-label">Mobile Number</span>
              <span className="info-value">{returnDetails.shippingAddress?.phone || 'N/A'}</span>
            </div>
            <hr className="divider" />

            <div className="info-row">
              <span className="info-label">Type of Payment</span>
              <span className="info-value">{returnDetails.paymentMethod || 'N/A'}</span>
            </div>
            <hr className="divider" />

            <div className="info-row">
              <span className="info-label">Address</span>
              <span className="info-value address-value">
                {[
                  returnDetails.shippingAddress?.houseName,
                  returnDetails.shippingAddress?.locality,
                  returnDetails.shippingAddress?.city,
                  returnDetails.shippingAddress?.state,
                  returnDetails.shippingAddress?.pincode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
            <hr className="divider" />

            <div className="info-row">
              <span className="info-label">Order ID</span>
              <span className="info-value">{returnDetails.orderId}</span>
            </div>
          </div>
        </div>

        
        <div className="details-card">
          <div className="card-header-banner">Return Request</div>

          <div className="info-group right-group">
            <p>
              <strong>Return Reason :</strong> {returnDetails.returnReason || 'Not specified'}
            </p>
            <p>
              <strong>Order Amount :</strong> ₹ {Number(returnDetails.totalAmount || 0)}
            </p>
            <p>
              <strong>Request Date :</strong>{' '}
              {new Date(returnDetails.updatedAt || returnDetails.createdAt).toLocaleDateString(
                'en-GB'
              )}
            </p>
            <p>
              <strong>Request Status :</strong>{' '}
              <span
                className={`status-text ${(returnDetails.status || '').replace(/\s+/g, '-')}`}
              >
                {returnDetails.status}
              </span>
            </p>

            <div className="action-buttons">
              <button
                className="btn-reject"
                onClick={() => handleStatusUpdate('Rejected')}
                disabled={updating || !isPending}
              >
                {updating ? 'Updating...' : 'Reject'}
              </button>
              <button
                className="btn-approve"
                onClick={() => handleStatusUpdate('Approved')}
                disabled={updating || !isPending}
              >
                {updating ? 'Updating...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnRequestDetails;