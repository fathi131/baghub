import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import API from '../../api/axios';
import './WriteReviewPage.css';

const WriteReviewPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const orderId = location.state?.orderId;

  const [product, setProduct] = useState(null);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  
  useEffect(() => {
    if (!id) return;

    API.get(`/user/products/${id}`)
      .then((res) => setProduct(res.data?.data || null))
      .catch((err) => console.error('Product fetch error:', err));
  }, [id]);

  
  useEffect(() => {
    if (!orderId) {
      alert('Order information missing. Please start from your order page.');
      navigate('/my-orders');
    }
  }, [orderId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!comment.trim()) {
      alert('Please enter your comment');
      return;
    }

    if (!orderId) {
      alert('Order ID missing');
      return;
    }

    try {
      setLoading(true);
      await API.post('/reviews/add', {
        productId: id,
        orderId,
        rating,
        title: title.trim(),
        comment: comment.trim()
      });

      alert('Review submitted successfully!');
      navigate('/my-orders');
    } catch (error) {
      console.error('Review submit error:', error);
      alert(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/150?text=No+Image';
    const cleanPath = String(imagePath).replace(/\\/g, '/');
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) return cleanPath;
    const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    const finalPath = normalizedPath.includes('/uploads/') ? normalizedPath : `/uploads${normalizedPath}`;
    return `http://localhost:5000${finalPath}`;
  };

  return (
    <div className="review-container">
      <div className="review-card">
        <h2 className="review-main-title">Product Reviews</h2>

        <div className="review-body">
         
          <div className="review-left-section">
            <div className="product-image-box">
              <img
                src={getImageUrl(product?.images?.[0])}
                alt={product?.name || 'Product'}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                }}
              />
            </div>
            <p className="product-title">{product?.name || 'Loading...'}</p>
          </div>

          <div className="review-right-section">
            <h3 className="section-subtitle">Leave a Review</h3>

            <form onSubmit={handleSubmit} className="review-form">
              {/* Star Rating */}
              <div className="star-rating">
                {[...Array(5)].map((_, index) => {
                  const starValue = index + 1;
                  return (
                    <span
                      key={index}
                      className={`star ${starValue <= (hover || rating) ? 'filled' : ''}`}
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHover(starValue)}
                      onMouseLeave={() => setHover(0)}
                      style={{ cursor: 'pointer', fontSize: '24px' }}
                    >
                      ★
                    </span>
                  );
                })}
              </div>

              
              <input
                type="text"
                placeholder="Review title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="review-title-input"
                maxLength={100}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ccc'
                }}
              />

              
              <textarea
                className="comment-box"
                placeholder="Enter your comment here"
                rows="4"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={loading}
                required
              ></textarea>

              <div className="button-container">
                <button
                  type="button"
                  className="btn-back"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WriteReviewPage;