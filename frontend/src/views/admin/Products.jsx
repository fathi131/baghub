import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import axios from 'axios';
import './Products.css';

const Products = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 5
  });

  const BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

  
  const fetchProducts = async (page = 1, search = searchQuery) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${BASE_URL}/api/admin/products`, {
        params: { page, limit: 5, search },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data && res.data.success) {
        setProducts(res.data.data || []);
        if (res.data.pagination) {
          setPagination({
            currentPage: res.data.pagination.page,
            totalPages: res.data.pagination.totalPages,
            total: res.data.pagination.total,
            limit: 5
          });
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1, searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  
  const handleToggleStatus = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.patch(
        `${BASE_URL}/api/admin/products/toggle-status/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success || response.status === 200) {
        fetchProducts(pagination.currentPage, searchQuery);
      }
    } catch (error) {
      console.error('Error toggling product status:', error);
      alert(error.response?.data?.message || 'Failed to update product status');
    }
  };

  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchProducts(newPage, searchQuery);
    }
  };

  return (
    <div className="products-container">
      <div className="products-card">
        
        
        <div className="products-header">
          <h1>Products Detail</h1>
          <div className="products-header-right">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search product"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <Search className="search-icon" />
            </div>
            <button 
              className="btn-add-product"
              onClick={() => navigate('/admin/add-product')}
            >
              Add new Product
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Loading products...</p>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Description</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.brand}</td>
                    <td><strong>{item.category?.name || 'N/A'}</strong></td>
                    <td>{item.description}</td>
                    <td>₹{item.price}</td>
                    <td><strong>{item.stockCount}</strong></td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-edit"
                          onClick={() => navigate(`/admin/edit-product/${item._id}`, { state: { product: item } })}
                        >
                          Edit
                        </button>
                        <button 
                          className={item.isBlocked ? 'btn-list' : 'btn-unlist'}
                          onClick={() => handleToggleStatus(item._id)}
                        >
                          {item.isBlocked ? 'List' : 'Unlist'}
                        </button>
                        <button 
                          className="btn-variants"
                          onClick={() => navigate(`/admin/add-variant/${item._id}`)}
                          style={{
                            backgroundColor: '#03544c',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            marginLeft: '4px'
                          }}
                        >
                          + Variants
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                    No products found!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button 
              className="page-btn"
              disabled={pagination.currentPage === 1}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
            >
              Previous
            </button>

            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i + 1}
                className={`page-num ${pagination.currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button 
              className="page-btn"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Products;