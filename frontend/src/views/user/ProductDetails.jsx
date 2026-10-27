import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, ChevronRight, Tag, Star } from 'lucide-react';
import API from '../../api/axios';
import './ProductDetails.css';
import { useCart } from '../../context/CartContext';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center center' });

  const [variants, setVariants] = useState([]);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [distribution, setDistribution] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

  const BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/500x500?text=No+Image';
    let cleanPath = String(imagePath).replace(/\\/g, '/');
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) return cleanPath;
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
    if (!cleanPath.includes('/uploads/')) cleanPath = `/uploads${cleanPath}`;
    return `${BASE_URL}${cleanPath}`;
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/user/products/${id}`);
        const data = res.data?.data || res.data;

        setProduct(data);

        const imgList = data?.images?.length > 0 ? data.images : (data?.image ? [data.image] : []);
        if (imgList.length > 0) setSelectedImage(imgList[0]);

        if (data?.isInWishlist) setIsInWishlist(true);

        if (data?.variants?.length > 0) {
          setVariants(data.variants);
          const firstAvailable =
            data.variants.find((v) => v.isAvailable !== false && v.stockCount > 0) ||
            data.variants[0];
          setSelectedVariant(firstAvailable);
          setSelectedSize(firstAvailable.size || '');
          setSelectedColor(firstAvailable.color || '');
        }
      } catch (error) {
        console.error('Fetch Product Error:', error);
        alert(error.response?.data?.message || 'Product not found');
        navigate('/category');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProductDetails();
  }, [id, navigate]);

  useEffect(() => {
    const fetchVariants = async () => {
      try {
        const res = await API.get(`/admin/products/${id}/variants`);
        if (res.data?.variants?.length > 0 && variants.length === 0) {
          setVariants(res.data.variants);
          if (!selectedVariant) {
            const firstAvailable =
              res.data.variants.find((v) => v.isAvailable !== false && v.stockCount > 0) ||
              res.data.variants[0];
            setSelectedVariant(firstAvailable);
            setSelectedSize(firstAvailable.size || '');
            setSelectedColor(firstAvailable.color || '');
          }
        }
      } catch (error) {
      }
    };
    if (id) fetchVariants();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await API.get(`/reviews/product/${id}`);
        const data = res.data || {};
        setReviews(data.reviews || []);
        setAvgRating(data.avgRating || 0);
        setReviewCount(data.totalCount || 0);
        setDistribution(data.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
      } catch (error) {
        console.error('Fetch reviews error:', error);
      }
    };
    if (id) fetchReviews();
  }, [id]);

  const uniqueSizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
  const uniqueColors = [...new Set(variants.map((v) => v.color).filter(Boolean))];

  useEffect(() => {
    if (variants.length === 0) return;

    const matched = variants.find((v) => {
      const sizeMatch = !uniqueSizes.length || v.size === selectedSize;
      const colorMatch = !uniqueColors.length || v.color === selectedColor;
      return sizeMatch && colorMatch;
    });

    setSelectedVariant(matched || null);

    if (matched && quantity > matched.stockCount) {
      setQuantity(Math.max(1, matched.stockCount));
    }
  }, [selectedSize, selectedColor, variants, uniqueSizes.length, uniqueColors.length]);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%` });
  };

  const currentPrice = selectedVariant ? Number(selectedVariant.price) : Number(product?.price || 0);
  const currentOldPrice = selectedVariant
    ? Number(selectedVariant.oldPrice || 0)
    : Number(product?.oldPrice || 0);
  const currentStock = selectedVariant ? Number(selectedVariant.stockCount) : Number(product?.stockCount || 0);

  const isOutOfStock = currentStock <= 0;
  const hasVariants = variants.length > 0;

  let offerDiscount = 0;
  if (product?.offer) {
    if (product.offer.discountType === 'fixed') {
      offerDiscount = Number(product.offer.discountValue || 0);
    } else {
      const pctAmount = (currentPrice * Number(product.offer.discountValue || 0)) / 100;
      offerDiscount = product.offer.maxDiscount > 0
        ? Math.min(pctAmount, Number(product.offer.maxDiscount))
        : pctAmount;
    }
  }
  const finalPrice = Math.max(0, currentPrice - offerDiscount);

  const handleQuantityChange = (type) => {
    if (type === 'decrease' && quantity > 1) setQuantity(quantity - 1);
    else if (type === 'increase' && quantity < currentStock) setQuantity(quantity + 1);
  };

  const buildProductPayload = () => {
    return {
      ...product,
      _id: product?._id || id,
      productId: product?._id || id,
      price: finalPrice,
      image: getImageUrl(selectedImage || product?.images?.[0] || product?.image),
      images: product?.images?.length ? product.images : product?.image ? [product.image] : [],
      variantId: selectedVariant?._id || null,
      variantDetails: selectedVariant
        ? {
            size: selectedVariant.size,
            color: selectedVariant.color,
            material: selectedVariant.material
          }
        : null,
      stockCount: currentStock
    };
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return alert('This variant is out of stock');
    if (hasVariants && !selectedVariant) return alert('Please select a valid variant');

    try {
      const productToBuy = buildProductPayload();
      await addToCart(productToBuy, quantity);
      navigate('/checkout', {
        state: {
          cartItems: [
            {
              _id: productToBuy._id,
              productId: productToBuy._id,
              name: productToBuy.name,
              price: productToBuy.price,
              quantity,
              image: productToBuy.image,
              images: productToBuy.images,
              stockCount: productToBuy.stockCount,
              variantId: productToBuy.variantId,
              variantDetails: productToBuy.variantDetails
            }
          ],
          subTotal: productToBuy.price * quantity,
          grandTotal: productToBuy.price * quantity
        }
      });
    } catch (error) {
      console.error('Buy now failed:', error);
    }
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) return alert('This variant is out of stock');
    if (hasVariants && !selectedVariant) return alert('Please select a valid variant');

    try {
      const productToAdd = buildProductPayload();
      await addToCart(productToAdd, quantity);
      alert('Added to Cart!');
    } catch (error) {
      console.error('Add to cart failed:', error);
    }
  };

  const handleAddToWishlist = async () => {
    try {
      const response = await API.post('/user/wishlist/toggle', { productId: product._id || id });
      setIsInWishlist(!isInWishlist);
      alert(response.data?.message || 'Wishlist updated successfully!');
    } catch (error) {
      if (error.response?.status === 401) alert('Please log in to add items to your wishlist!');
      else alert(error.response?.data?.message || 'Failed to update wishlist');
    }
  };

  if (loading) {
    return (
      <div
        className="product-details-container"
        style={{ textAlign: 'center', padding: '50px' }}
      >
        Loading Product Details...
      </div>
    );
  }

  if (!product) return null;

  const imageList =
    product.images?.length > 0 ? product.images : product.image ? [product.image] : [];

  const renderStars = (ratingValue) =>
    [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={16}
        fill={i < Math.round(ratingValue) ? '#ffb400' : 'none'}
        color="#ffb400"
      />
    ));

  return (
    <div className="product-details-container">
      <div className="breadcrumbs">
        <span className="breadcrumb-link" onClick={() => navigate('/')}>
          Home
        </span>
        <ChevronRight size={14} />
        <span className="breadcrumb-link" onClick={() => navigate('/category')}>
          Shop
        </span>
        <ChevronRight size={14} />
        <span className="breadcrumb-link" onClick={() => navigate('/category')}>
          {product.category?.name || product.category || 'Category'}
        </span>
        <ChevronRight size={14} />
        <span className="breadcrumb-active">{product.name}</span>
      </div>

      <div className="product-details-main">
        <div className="product-gallery">
          <div className="thumbnail-list">
            {imageList.map((img, index) => (
              <img
                key={index}
                src={getImageUrl(img)}
                alt="thumb"
                className={`thumbnail-img ${selectedImage === img ? 'active' : ''}`}
                onClick={() => setSelectedImage(img)}
              />
            ))}
          </div>

          <div className="zoom-image-container" onMouseMove={handleMouseMove}>
            <img
              src={getImageUrl(selectedImage || imageList[0])}
              alt={product.name}
              style={zoomStyle}
            />
          </div>
        </div>

        <div className="product-info-section">
          <div className="product-title-header">
            <h1>{product.name}</h1>
            <button
              className="wishlist-btn-inline"
              onClick={handleAddToWishlist}
              title="Add to Wishlist"
            >
              <Heart
                size={20}
                color={isInWishlist ? 'red' : 'currentColor'}
                fill={isInWishlist ? 'red' : 'none'}
              />
            </button>
          </div>

          <div className="price-container-detail">
            <span className="current-price-detail">₹{finalPrice}</span>
            {currentOldPrice > 0 && (
              <span className="original-price-detail">₹{currentOldPrice}</span>
            )}
            {product.discount && <span className="discount-badge">{product.discount}</span>}
          </div>

          {product.offer && (
            <section className="product-offer-banner" aria-label="Available offer">
              <Tag size={18} aria-hidden="true" />
              <div>
                <strong>{product.offer.name}</strong>
                <p>
                  {product.offer.discountType === 'fixed'
                    ? `₹${Number(product.offer.discountValue).toLocaleString('en-IN')} off`
                    : `${Number(product.offer.discountValue)}% off${
                        product.offer.maxDiscount
                          ? ` (up to ₹${Number(product.offer.maxDiscount).toLocaleString('en-IN')})`
                          : ''
                      }`}
                </p>
                {product.offer.description && <small>{product.offer.description}</small>}
                <small>
                  Valid through {new Date(product.offer.expiryDate).toLocaleDateString('en-GB')}
                </small>
              </div>
            </section>
          )}

          {product.couponCode && (
            <div className="coupon-box">
              🎟️ Coupon: <strong>{product.couponCode}</strong>
            </div>
          )}

          <div className="rating-brand-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="star-rating" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                {renderStars(avgRating || 0)}
                <strong style={{ marginLeft: '6px' }}>{avgRating || 0}</strong>
              </span>
              <span>
                | {reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'}
              </span>
            </div>
            {product.brand && (
              <div>
                Brand: <strong>{product.brand}</strong>
              </div>
            )}
          </div>

          {hasVariants && (
            <div
              className="variant-selector"
              style={{
                marginTop: '20px',
                padding: '16px',
                background: '#f9f9f9',
                borderRadius: '10px'
              }}
            >
              <h4 style={{ marginBottom: '14px', color: '#03544c' }}>Select Options</h4>

              {uniqueSizes.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontWeight: 600,
                      color: '#333'
                    }}
                  >
                    Size:
                  </label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      fontSize: '14px',
                      minWidth: '200px',
                      cursor: 'pointer',
                      background: '#fff'
                    }}
                  >
                    <option value="">-- Select Size --</option>
                    {uniqueSizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {uniqueColors.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontWeight: 600,
                      color: '#333'
                    }}
                  >
                    Color:
                  </label>
                  <select
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      fontSize: '14px',
                      minWidth: '200px',
                      cursor: 'pointer',
                      background: '#fff'
                    }}
                  >
                    <option value="">-- Select Color --</option>
                    {uniqueColors.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedVariant && (
                <div style={{ marginTop: '12px', fontSize: '14px', color: '#555' }}>
                  <strong>Selected:</strong> {selectedVariant.size || '—'} ·{' '}
                  {selectedVariant.color || '—'}{' '}
                  {selectedVariant.material ? `· ${selectedVariant.material}` : ''}
                </div>
              )}

              {!selectedVariant && hasVariants && (
                <div style={{ marginTop: '12px', color: '#dc3545', fontWeight: 500 }}>
                  ⚠️ This combination is not available
                </div>
              )}
            </div>
          )}

          {product.highlights?.length > 0 && (
            <div className="product-highlights">
              <h4>Product Highlights</h4>
              <ul>
                {product.highlights.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {isOutOfStock ? (
            <div className="out-of-stock-banner">
              ⚠️ Currently Out of Stock. This item is temporarily unavailable.
            </div>
          ) : (
            <div className="stock-status in-stock">
              ✓ In Stock ({currentStock} items left)
            </div>
          )}

          <div className="variant-selectors-row">
            <span>Qty:</span>
            <div className="quantity-controller">
              <button
                onClick={() => handleQuantityChange('decrease')}
                disabled={isOutOfStock || quantity <= 1}
              >
                -
              </button>
              <span>{quantity}</span>
              <button
                onClick={() => handleQuantityChange('increase')}
                disabled={isOutOfStock || quantity >= currentStock}
              >
                +
              </button>
            </div>
          </div>

          <div className="action-buttons-group">
            <button className="btn-buy-now" disabled={isOutOfStock} onClick={handleBuyNow}>
              {isOutOfStock ? 'Sold Out' : 'Buy Now'}
            </button>
            <button className="btn-add-cart" disabled={isOutOfStock} onClick={handleAddToCart}>
              {isOutOfStock ? 'Unavailable' : 'Add To Cart'}
            </button>
          </div>
        </div>
      </div>

      <section
        className="product-reviews-section"
        style={{ marginTop: '40px', padding: '20px', borderTop: '2px solid #eee' }}
      >
        <h2 style={{ marginBottom: '20px', color: '#03544c' }}>Customer Reviews</h2>

        {reviewCount === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '30px' }}>
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '48px', fontWeight: '700', color: '#03544c' }}>
                  {avgRating}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '2px',
                    margin: '6px 0'
                  }}
                >
                  {renderStars(avgRating)}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>
                  {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = distribution[star] || 0;
                  const percent = reviewCount ? (count / reviewCount) * 100 : 0;
                  return (
                    <div
                      key={star}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '6px',
                        fontSize: '13px'
                      }}
                    >
                      <span style={{ width: '20px' }}>{star}★</span>
                      <div
                        style={{
                          flex: 1,
                          height: '8px',
                          background: '#e0e0e0',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            width: `${percent}%`,
                            height: '100%',
                            background: '#ffb400',
                            transition: 'width 0.3s'
                          }}
                        />
                      </div>
                      <span style={{ width: '30px', textAlign: 'right', color: '#666' }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              {reviews.map((review) => (
                <div
                  key={review._id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #eee',
                    marginBottom: '10px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: '#03544c',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600'
                        }}
                      >
                        {review.userId?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <strong>{review.userId?.name || 'User'}</strong>
                        {review.isVerifiedPurchase && (
                          <span
                            style={{
                              marginLeft: '8px',
                              fontSize: '11px',
                              color: '#03544c',
                              background: '#e8f5e9',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            ✓ Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{ color: '#999', fontSize: '13px' }}>
                      {new Date(review.createdAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
                    {renderStars(review.rating)}
                  </div>

                  {review.title && (
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{review.title}</div>
                  )}
                  <p style={{ color: '#444', margin: 0, lineHeight: '1.5' }}>{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProductDetails;