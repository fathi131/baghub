import { useState, useEffect } from 'react';
import { Search, Heart, X, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import './CategoryPage.css';
import { toast } from 'react-toastify';

const CategoryPage = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('featured');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);

  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [activeMinPrice, setActiveMinPrice] = useState('');
  const [activeMaxPrice, setActiveMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

  const getImageUrl = (product) => {
    const imagePath = product?.images?.[0] || product?.image;
    if (!imagePath) return 'https://via.placeholder.com/400x400?text=No+Image';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/uploads/${imagePath}`;
    return `${BASE_URL}${cleanPath}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const prodRes = await API.get('/user/products', {
          params: { page, limit: 8 }
        });
        const productData = prodRes.data?.data || [];

        if (page === 1) {
          setProducts(productData);
        } else {
          setProducts(prev => [...prev, ...productData]);
        }

        if (productData.length < 8) setHasMore(false);

        try {
          const catRes = await API.get('/user/categories');
          const catData = catRes.data?.data || (Array.isArray(catRes.data) ? catRes.data : []);
          setCategories(catData.map(c => c.name || c));
        } catch {
          const extractedCats = [...new Set(productData.map(p => p.category?.name || p.category).filter(Boolean))];
          setCategories(extractedCats);
        }

        const extractedBrands = [...new Set(productData.map(p => p.brand).filter(Boolean))];
        setBrands(extractedBrands);

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page]);

  const handleCategoryChange = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleBrandChange = (brand) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const handleApplyPriceFilter = () => {
    setActiveMinPrice(minPriceInput);
    setActiveMaxPrice(maxPriceInput);
  };

  const handleAddToWishlist = async (e, productId) => {
    e.stopPropagation();
    try {
      const response = await API.post('/user/wishlist/toggle', { productId });
      toast.success(response.data?.message || 'Wishlist updated!');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.info('Please log in to add items to your wishlist!');
      } else {
        toast.error('Failed to update wishlist');
      }
    }
  };

  const filteredProducts = products
    .filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(p => {
      if (selectedCategories.length === 0) return true;
      const catName = p.category?.name || p.category;
      return selectedCategories.includes(catName);
    })
    .filter(p => selectedBrands.length === 0 || selectedBrands.includes(p.brand))
    .filter(p => !activeMinPrice || p.price >= Number(activeMinPrice))
    .filter(p => !activeMaxPrice || p.price <= Number(activeMaxPrice))
    .sort((a, b) => {
      if (sortOption === 'lowToHigh') return a.price - b.price;
      if (sortOption === 'highToLow') return b.price - a.price;
      if (sortOption === 'aToZ') return a.name.localeCompare(b.name);
      if (sortOption === 'zToA') return b.name.localeCompare(a.name);
      return 0;
    });

  return (
    <div className="category-page-container">
      <div className="category-title-section">
        <h1>Our Collection</h1>
        <div className="search-bar-wrapper">
          <input
            type="text"
            placeholder="Search Item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm ? (
            <button className="clear-btn" onClick={() => setSearchTerm('')}>
              <X size={16} />
            </button>
          ) : (
            <Search size={16} color="#888" />
          )}
        </div>
      </div>

      <div className="category-main-content">
        <div className="filter-sidebar">
          <div className="filter-group">
            <h4>Shop For Category</h4>
            {categories.length > 0 ? (
              categories.map(cat => (
                <label key={cat} className="filter-option">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => handleCategoryChange(cat)}
                  />
                  {cat}
                </label>
              ))
            ) : (
              <p style={{ fontSize: '12px', color: '#888' }}>No categories found</p>
            )}
          </div>

          <div className="filter-group">
            <h4>Brands</h4>
            {brands.length > 0 ? (
              brands.map(brand => (
                <label key={brand} className="filter-option">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => handleBrandChange(brand)}
                  />
                  {brand}
                </label>
              ))
            ) : (
              <p style={{ fontSize: '12px', color: '#888' }}>No brands found</p>
            )}
          </div>

          <div className="filter-group">
            <h4>Price Range</h4>
            <div className="price-range-inputs">
              <input
                type="number"
                placeholder="Min"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                className="price-input"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                className="price-input"
              />
            </div>
            <button className="btn-apply-filter" onClick={handleApplyPriceFilter}>
              Filter
            </button>
          </div>
        </div>

        <div className="products-content-area">
          <div className="top-sort-bar">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="sort-select"
            >
              <option value="featured">Sort by Featured</option>
              <option value="lowToHigh">Price: Low to High</option>
              <option value="highToLow">Price: High to Low</option>
              <option value="aToZ">Name: A to Z</option>
              <option value="zToA">Name: Z to A</option>
            </select>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px' }}>Loading Collection...</p>
          ) : (
            <div className="product-grid">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <div
                    key={product._id || product.id}
                    className="product-card"
                    onClick={() => navigate(`/product/${product._id || product.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Heart
                      size={18}
                      className="wishlist-icon"
                      onClick={(e) => handleAddToWishlist(e, product._id || product.id)}
                    />
                    <img
                      src={getImageUrl(product)}
                      alt={product.name}
                      className="product-img"
                    />
                    {product.offer && (
                      <div className="product-offer-badge">
                        <Tag size={14} aria-hidden="true" />
                        <span>
                          {product.offer.discountType === 'fixed'
                            ? `₹${Number(product.offer.discountValue).toLocaleString('en-IN')} off`
                            : `${Number(product.offer.discountValue)}% off`}
                        </span>
                      </div>
                    )}
                    <div className="product-name">{product.name}</div>
                    <div className="product-prices">
                      <span className="price-current">₹{product.price}</span>
                      {product.oldPrice && <span className="price-old">₹{product.oldPrice}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-products">No products found matching your filters.</p>
              )}
            </div>
          )}

          <div className="pagination-container">
            <button className="btn-load-more" onClick={() => setPage(prev => prev + 1)}>
              Load More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;