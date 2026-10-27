import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../../api/axios';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();

  const [trending, setTrending] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [handPicked, setHandPicked] = useState([]);
  const [loading, setLoading] = useState(true);

  const BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/300?text=No+Image';
    let cleanPath = String(imagePath).replace(/\\/g, '/');
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) return cleanPath;
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
    if (!cleanPath.includes('/uploads/')) cleanPath = `/uploads${cleanPath}`;
    return `${BASE_URL}${cleanPath}`;
  };

  const getItemPrice = (item) => {
    let basePrice = Number(item.price || 0);
    if (item.offer) {
      if (item.offer.discountType === 'fixed') {
        basePrice -= Number(item.offer.discountValue || 0);
      } else {
        const pctAmount = (basePrice * Number(item.offer.discountValue || 0)) / 100;
        const discount = item.offer.maxDiscount > 0
          ? Math.min(pctAmount, Number(item.offer.maxDiscount))
          : pctAmount;
        basePrice -= discount;
      }
    }
    return Math.max(0, basePrice);
  };

  useEffect(() => {
    const fetchHomeSections = async () => {
      try {
        setLoading(true);
        const res = await API.get('/user/home-sections');
        const data = res.data?.data || {};
        setTrending(data.trendingNow || []);
        setFeatured(data.featuredProducts || []);
        setHandPicked(data.handPicked || []);
      } catch (error) {
        console.error('Error fetching home sections:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeSections();
  }, []);

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1>
            Adventure Awaits with
            <br />
            Premium Backpacks
          </h1>
          <p>
            Discover our collection of durable, stylish, and
            <br />
            functional backpacks designed for every
            <br />
            journey.
            <br />
            From urban commutes to mountain adventures.
          </p>
          <button className="know-more-btn" onClick={() => navigate('/products')}>
            Know More
          </button>
        </div>
        <div className="hero-image-container">
          <img
            src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500"
            alt="Premium Backpack"
          />
        </div>
      </section>

      <section className="section-container">
        <h2 className="section-title">Featured Products</h2>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>Loading products...</p>
        ) : (
          <div className="products-grid">
            {featured.map((product) => (
              <Link
                to={`/product/${product._id}`}
                key={product._id}
                className="product-card"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="product-img-wrapper">
                  <img src={getImageUrl(product.images?.[0])} alt={product.name} />
                </div>
                <h3>{product.name}</h3>
                <p className="price">
                  {product.oldPrice && <span className="old-price">₹{product.oldPrice}</span>}{' '}
                  <span>₹{getItemPrice(product)}</span>
                </p>
              </Link>
            ))}
            <div className="see-more-wrapper">
              <button className="see-more-btn" onClick={() => navigate('/products')}>
                See more →
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="section-container">
        <h2 className="section-title">Shop Your Favourites</h2>
        <div className="favourites-grid">
          <div className="fav-card fav-large">
            <img
              src="https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400"
              alt="Model with Backpack"
            />
          </div>
          <div className="fav-column">
            <div className="fav-card fav-small">
              <img
                src="https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=400"
                alt="Collection on display"
              />
            </div>
            <div className="fav-card fav-small">
              <img
                src="https://images.unsplash.com/photo-1577733966973-d680bffd2e80?w=400"
                alt="Patterned Backpacks"
              />
            </div>
          </div>
          <div className="fav-card fav-large relative">
            <img
              src="https://images.unsplash.com/photo-1544816155-12df9643f363?w=400"
              alt="Woman with Green Backpack"
            />
            <button className="arrow-next-btn" onClick={() => navigate('/products')}>
              →
            </button>
          </div>
        </div>
      </section>

      <section className="section-container">
        <h2 className="section-title">Hand Picked</h2>
        <p className="section-subtitle">
          Discover our hand-picked collection, featuring backpacks chosen for their quality,
          <br />
          style, and timeless appeal.
        </p>
        <div className="handpicked-grid">
          {loading ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>Loading...</p>
          ) : handPicked.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
              No hand-picked products yet
            </p>
          ) : (
            handPicked.map((product) => (
              <Link
                to={`/product/${product._id}`}
                key={product._id}
                className="handpicked-card"
                style={{ textDecoration: 'none' }}
              >
                <img src={getImageUrl(product.images?.[0])} alt={product.name} />
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="trending-section">
        <h2 className="section-title">Trending Now</h2>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>Loading...</p>
        ) : (
          <div className="products-grid">
            {trending.map((product) => (
              <Link
                to={`/product/${product._id}`}
                key={product._id}
                className="product-card"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="product-img-wrapper">
                  <img src={getImageUrl(product.images?.[0])} alt={product.name} />
                </div>
                <h3>{product.name}</h3>
                <p className="price">
                  {product.oldPrice && <span className="old-price">₹{product.oldPrice}</span>}{' '}
                  <span>₹{getItemPrice(product)}</span>
                </p>
              </Link>
            ))}
            <div className="see-more-wrapper">
              <button className="see-more-btn" onClick={() => navigate('/products')}>
                See more →
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Landing;