import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true
});

API.interceptors.request.use(
  (config) => {
    const userToken = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');
    const currentPath = window.location.pathname;

    if (currentPath.includes('/admin') && adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 403) {
      const message = error.response.data?.message || '';
      if (message.toLowerCase().includes('blocked')) {
        localStorage.removeItem('token');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        localStorage.removeItem('adminUser');
        
        alert('Your account has been blocked. You have been logged out.');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;