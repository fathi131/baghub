import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './AddCategory.css';

const EditCategory = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.category) {
      setCategoryName(location.state.category.name || '');
      setDescription(location.state.category.description || '');
    } else if (id) {
     
      const fetchCategoryDetails = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/admin/categories/${id}`);
          const data = response.data.category || response.data;
          setCategoryName(data.name || '');
          setDescription(data.description || '');
        } catch (error) {
          console.error('Error fetching category:', error);
        }
      };
      fetchCategoryDetails();
    }
  }, [id, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const categoryId = id || location.state?.category?._id || location.state?.category?.id;

    try {
      setLoading(true);
      const response = await axios.put(`http://localhost:5000/api/admin/categories/${categoryId}`, {
        name: categoryName,
        description: description,
      });

      if (response.data.success || response.status === 200) {
        alert('Category updated successfully!');
        navigate('/admin/category');
      }
      setLoading(false);
    } catch (error) {
      console.error('Update failed:', error);
      alert(error.response?.data?.message || 'Failed to update category');
      setLoading(false);
    }
  };

  return (
    <div className="add-category-container">
      <h1 className="add-category-title">Edit Category</h1>

      <form onSubmit={handleSubmit} className="add-category-form">
        <div className="form-group">
          <input
            type="text"
            placeholder="Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-textarea"
            required
          />
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update'}
        </button>
      </form>
    </div>
  );
};

export default EditCategory;