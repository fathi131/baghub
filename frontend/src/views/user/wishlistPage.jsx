import React, { useEffect, useState } from 'react';
import API from '../../api/axios';

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

  
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/150?text=No+Image';
    let cleanPath = String(imagePath).replace(/\\/g, '/');
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      return cleanPath;
    }
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
    if (!cleanPath.includes('/uploads/')) cleanPath = `/uploads${cleanPath}`;
    return `${BASE_URL}${cleanPath}`;
  };

 
  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await API.get('/user/wishlist');
      
      const rawItems = 
        res.data?.products || 
        res.data?.wishlist || 
        res.data?.data || 
        (Array.isArray(res.data) ? res.data : []);

      
      const normalizedItems = rawItems.map((item) => {
        if (item && item.product && typeof item.product === 'object') {
          return item.product;
        }
        return item;
      });

      setWishlist(normalizedItems.filter(Boolean));
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  
  const handleRemove = async (productId) => {
    try {
      const res = await API.post('/user/wishlist/toggle', { productId });
      
      if (res.data?.products) {
        const updated = res.data.products.map((item) => item.product || item);
        setWishlist(updated);
      } else {
        setWishlist((prev) => prev.filter((item) => (item._id || item.id) !== productId));
      }
    } catch (error) {
      console.error('Error removing item via toggle:', error);
      
      try {
        await API.delete(`/user/wishlist/remove/${productId}`);
        setWishlist((prev) => prev.filter((item) => (item._id || item.id) !== productId));
      } catch (err) {
        alert('Failed to remove item');
      }
    }
  };

 
  const handleAddToCart = async (productId) => {
    try {
      const res = await API.post('/user/cart/add', { productId, quantity: 1 });
      if (res.status === 200 || res.status === 201) {
        alert('Product added to cart!');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(error.response?.data?.message || 'Failed to add item to cart');
    }
  };

  
  const handleAddAllToCart = async () => {
    if (wishlist.length === 0) return;
    try {
      for (const item of wishlist) {
        const id = item._id || item.id;
        if (id) {
          await API.post('/user/cart/add', { productId: id, quantity: 1 });
        }
      }
      alert('All items added to cart!');
    } catch (error) {
      console.error('Error adding all to cart:', error);
      alert('Failed to add all items to cart');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: '#666' }}>
        Loading Wishlist...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px', minHeight: '60vh', fontFamily: 'sans-serif' }}>
      {wishlist.length === 0 ? (
        /* Empty Wishlist View */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', textAlign: 'center' }}>
          <div style={{ width: '260px', height: '200px', marginBottom: '16px' }}>
            <svg width="100%" height="100%" viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 40 110 C 30 50 85 25 140 20 C 195 15 235 50 240 100 C 245 150 195 185 140 185 C 85 185 50 170 40 110 Z" fill="#EAEAEA" />
              <path d="M 45 60 L 53 68 M 53 60 L 45 68" stroke="#E53935" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 230 70 L 238 78 M 238 70 L 230 78" stroke="#E53935" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="80" cy="35" r="3.5" fill="#333333" />
              <circle cx="190" cy="30" r="3.5" fill="#E53935" />
              <rect x="90" y="45" width="85" height="110" rx="8" fill="#FFFFFF" stroke="#2D3748" strokeWidth="2.5" />
              <rect x="115" y="38" width="35" height="12" rx="3" fill="#E2E8F0" stroke="#2D3748" strokeWidth="2" />
              <line x1="104" y1="65" x2="145" y2="65" stroke="#2D3748" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="104" y1="78" x2="155" y2="78" stroke="#2D3748" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="82" y1="162" x2="182" y2="162" stroke="#2D3748" strokeWidth="3" strokeLinecap="round" />
              <g transform="translate(136, 76) scale(1.65)">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#FF4D4D" stroke="#2D3748" strokeWidth="1.5" />
              </g>
            </svg>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#E53935', margin: 0 }}>Your Wishlist is Empty!</h2>
        </div>
      ) : (
        /* Wishlist Items Table */
        <div>
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#222', margin: 0 }}>My Wishlist ({wishlist.length})</h1>
            <button
              onClick={handleAddAllToCart}
              style={{
                backgroundColor: '#004D40',
                color: '#fff',
                padding: '10px 24px',
                borderRadius: '24px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Add all to cart
            </button>
          </div>

          
          <div style={{ border: '1px solid #D1D5DB', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#fff' }}>
            
          
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', backgroundColor: '#D9D9D9', padding: '12px 20px', fontWeight: '600', color: '#333', textAlign: 'center', fontSize: '15px' }}>
              <div>Product</div>
              <div>Details</div>
              <div>Price</div>
            </div>

            
            {wishlist.map((item) => {
              const productId = item._id || item.id;
              const imageSrc = getImageUrl(item.images?.[0] || item.image);

              return (
                <div
                  key={productId}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 2fr 1fr',
                    alignItems: 'center',
                    padding: '20px',
                    borderBottom: '1px solid #E5E7EB'
                  }}
                >
                 
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <img
                      src={imageSrc}
                      alt={item.name || 'Product'}
                      style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                      }}
                    />
                    <button
                      onClick={() => handleRemove(productId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6B7280',
                        fontSize: '12px',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Remove
                    </button>
                  </div>

                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>{item.name}</span>
                    <button
                      onClick={() => handleAddToCart(productId)}
                      style={{
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '500',
                        padding: '8px 20px',
                        borderRadius: '16px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Add To Cart
                    </button>
                  </div>

                  
                  <div style={{ textAlign: 'center', fontWeight: '700', color: '#111827', fontSize: '15px' }}>
                    ₹{item.price}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;