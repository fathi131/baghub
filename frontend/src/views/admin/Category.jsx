import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import axios from 'axios';
import './Category.css';

const Category = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 5
  });

  const fetchCategories = async (page = 1, search = searchQuery) => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/admin/categories', {
        params: { page, limit: 5, search }
      });
      
      const data = response.data;

      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
        if (data.pagination) {
          setPagination({
            currentPage: data.pagination.page,
            totalPages: data.pagination.totalPages,
            total: data.pagination.total,
            limit: 5
          });
        }
      } else if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
      setLoading(false);
    }
  };

  
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories(1, searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  
  const handleToggleStatus = async (id) => {
    try {
      const token = localStorage.getItem('token'); 

      const response = await axios.patch(
        `http://localhost:5000/api/admin/categories/toggle-status/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success || response.status === 200) {
        await fetchCategories(pagination.currentPage, searchQuery);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Failed to update status.');
    }
  };

 
  const handleEdit = (category) => {
    const categoryId = category._id || category.id;
    navigate(`/admin/edit-category/${categoryId}`, { state: { category } });
  };

  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchCategories(newPage, searchQuery);
    }
  };

  const categoryList = Array.isArray(categories) ? categories : [];

  return (
    <div className="category-container">
      <div className="category-card">
        
       
        <div className="category-header">
          <h1>Category</h1>
          <div className="category-header-right">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search Category"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <Search className="search-icon" />
            </div>
            <button 
              className="btn-add-category"
              onClick={() => navigate('/admin/add-category')}
            >
              Add New Category
            </button>
          </div>
        </div>

        
        <table className="category-table">
          <thead>
            <tr>
              <th>SL.No</th>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                  Loading categories...
                </td>
              </tr>
            ) : categoryList.length > 0 ? (
              categoryList.map((item, index) => {
                const isUnlisted = item.isBlocked || item.status === 'Unlisted';
                const categoryId = item._id || item.id;
                const slNo = (pagination.currentPage - 1) * pagination.limit + index + 1;

                return (
                  <tr key={categoryId}>
                    <td>{slNo}</td>
                    <td>{item.name}</td>
                    <td>{item.description || '-'}</td>
                    <td>
                      <span className={`status-badge ${isUnlisted ? 'unlisted' : 'listed'}`}>
                        {isUnlisted ? 'Unlisted' : 'Listed'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-edit"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>
                        <button 
                          className={isUnlisted ? 'btn-list' : 'btn-unlist'}
                          onClick={() => handleToggleStatus(categoryId)}
                        >
                          {isUnlisted ? 'List' : 'Unlist'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                  No categories found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        
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

export default Category;