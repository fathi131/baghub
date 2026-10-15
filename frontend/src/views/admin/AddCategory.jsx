import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddCategory.css';

const AddCategory = () => {
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = categoryName.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setError('Category name is required');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Category name must be at least 2 characters');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post('http://localhost:5000/api/admin/add-category', {
        name: trimmedName,
        description: trimmedDescription,
      });

      if (response.status === 200 || response.status === 201 || response.data.success) {
        alert('Category added successfully!');
        navigate('/admin/category');
      }
    } catch (err) {
      console.error('Error adding category:', err.response);
      
      const backendMessage = err.response?.data?.message || err.response?.data?.error;
      const defaultError = err.message ? `Error: ${err.message}` : 'Failed to add category. Try again.';
      
      setError(backendMessage || defaultError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-category-container">
      <h1 className="add-category-title">Add Category</h1>

      {error && <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

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
            rows="4"
          />
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Adding...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default AddCategory;