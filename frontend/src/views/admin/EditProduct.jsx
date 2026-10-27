import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import axios from 'axios';
import API from '../../api/axios';
import './AddProduct.css';


const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        blob.name = `cropped_${Date.now()}.jpeg`;
        resolve(blob);
      }, 'image/jpeg');
    };
    image.onerror = (error) => reject(error);
  });
};

const EditProduct = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // URL path-il ninnu product ID edukkunnu

  const existingProduct = location.state?.product || {};

  
  const [formData, setFormData] = useState({
    productName: existingProduct.name || existingProduct.productName || '',
    brand: existingProduct.brand || '',
    category: existingProduct.category?._id || existingProduct.category || '',
    description: existingProduct.description || '',
    price: existingProduct.price || '',
    stockCount: existingProduct.stockCount || ''
  });

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [existingImages, setExistingImages] = useState(existingProduct.images || []); // Existing image URLs from DB
  const [newImages, setNewImages] = useState([]); // New cropped blobs
  const [newImagePreviews, setNewImagePreviews] = useState([]); // New preview URLs

  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${BASE_URL}/api/admin/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.data) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    API.get('/admin/brands')
      .then(({ data }) => setBrands((data.brands || []).filter((brand) => brand.status === 'Active')))
      .catch((error) => console.error('Error fetching brands:', error));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onFileChange = (e) => {
    const totalCurrentImages = existingImages.length + newImages.length;
    if (e.target.files && e.target.files.length > 0) {
      if (totalCurrentImages >= 4) {
        alert('Maximum 4 images allowed!');
        return;
      }
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result));
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  
  const handleCropSave = async () => {
    try {
      if (imageSrc && croppedAreaPixels) {
        const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
        const previewUrl = URL.createObjectURL(croppedBlob);

        setNewImages([...newImages, croppedBlob]);
        setNewImagePreviews([...newImagePreviews, previewUrl]);

        setImageSrc(null);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      }
    } catch (e) {
      console.error('Cropping error:', e);
    }
  };

  
  const handleRemoveExistingImage = (index) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

 
  const handleRemoveNewImage = (index) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
  };

  
  const getImageUrl = (imgPath) => {
    if (imgPath.startsWith('http')) return imgPath;
    const cleanPath = imgPath.startsWith('/') ? imgPath : `/uploads/${imgPath}`;
    return `${BASE_URL}${cleanPath}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const totalImages = existingImages.length + newImages.length;
    if (totalImages < 3) {
      alert('Minimum 3 images are required!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const productId = id || existingProduct._id;

      const data = new FormData();
      data.append('name', formData.productName);
      data.append('brand', formData.brand);
      data.append('category', formData.category);
      data.append('description', formData.description);
      data.append('price', formData.price || 0);
      data.append('stockCount', formData.stockCount || 0);

      
      data.append('existingImages', JSON.stringify(existingImages));

      
      newImages.forEach((imgBlob) => {
        data.append('images', imgBlob, imgBlob.name);
      });

      const response = await axios.put(`${BASE_URL}/api/admin/products/${productId}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success || response.status === 200) {
        alert('Product Updated Successfully!');
        navigate('/admin/products');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert(err.response?.data?.message || 'Failed to update product!');
    }
  };

  return (
    <div className="add-product-container">
      <h1 className="add-product-title">Products</h1>
      <h2 className="add-product-subtitle">Edit Product</h2>

      <form onSubmit={handleSubmit} className="add-product-form">
        <div className="form-group-product">
          <input
            type="text"
            name="productName"
            placeholder="Product Name"
            value={formData.productName}
            onChange={handleChange}
            className="product-input"
            required
          />
        </div>

        <div className="form-group-product">
          <select
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className="product-select"
            required
          >
            <option value="">Select Brand</option>
            {formData.brand && !brands.some((brand) => brand.name === formData.brand) && (
              <option value={formData.brand}>{formData.brand} (current)</option>
            )}
            {brands.map((brand) => <option key={brand._id} value={brand.name}>{brand.name}</option>)}
          </select>
        </div>

        <div className="form-group-product">
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="product-select"
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group-product">
          <input
            type="number"
            name="price"
            placeholder="Price (₹)"
            value={formData.price}
            onChange={handleChange}
            className="product-input"
            required
          />
        </div>

        <div className="form-group-product">
          <input
            type="number"
            name="stockCount"
            placeholder="Stock Count"
            value={formData.stockCount}
            onChange={handleChange}
            className="product-input"
            required
          />
        </div>

        <div className="form-group-product">
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            className="product-textarea"
            required
          />
        </div>

        
        <div className="image-crop-section">
          <label style={{ fontSize: '13px', fontWeight: '600' }}>
            Product Images (Minimum 3 required - Total: {existingImages.length + newImages.length})
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            disabled={existingImages.length + newImages.length >= 4}
            style={{ marginTop: '8px', display: 'block' }}
          />

          {imageSrc && (
            <div style={{ marginTop: '16px' }}>
              <div className="crop-container" style={{ position: 'relative', height: '250px', width: '100%' }}>
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <button
                type="button"
                className="btn-add-variants"
                onClick={handleCropSave}
                style={{ marginTop: '8px', backgroundColor: '#333', cursor: 'pointer' }}
              >
                Crop & Add Image
              </button>
            </div>
          )}

          
          <div className="image-preview-list" style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
            
            {existingImages.map((src, index) => (
              <div key={`existing-${index}`} style={{ position: 'relative' }}>
                <img
                  src={getImageUrl(src)}
                  alt={`existing-${index}`}
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px' }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(index)}
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            
            {newImagePreviews.map((src, index) => (
              <div key={`new-${index}`} style={{ position: 'relative' }}>
                <img
                  src={src}
                  alt={`new-${index}`}
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '2px solid green' }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveNewImage(index)}
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-add-variants" style={{ marginTop: '20px' }}>
          Update Product
        </button>
      </form>
    </div>
  );
};

export default EditProduct;