import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  
  const handleLogout = () => {
   
    localStorage.removeItem('token');
    localStorage.removeItem('user'); 

    
    navigate('/admin/login',{replace:true}); 
  };

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-logo">
        <h2>👜 BagHub</h2>
      </div>
      <ul className="sidebar-menu">
        <li className={location.pathname === '/admin/dashboard' ? 'active' : ''}>
          <Link to="/admin/dashboard">Dashboard</Link>
        </li>
        <li className={location.pathname === '/admin/products' ? 'active' : ''}>
          <Link to="/admin/products">Products</Link>
        </li>
        <li className={location.pathname === '/admin/customers' ? 'active' : ''}>
          <Link to="/admin/customers">Customers</Link>
        </li>
        <li className={location.pathname === '/admin/orders' ? 'active' : ''}>
          <Link to="/admin/orders">Orders</Link>
        </li>
        <li className={location.pathname === '/admin/coupons' ? 'active' : ''}>
          <Link to="/admin/coupons">Coupons</Link>
        </li>
        <li className={location.pathname === '/admin/category' ? 'active' : ''}>
          <Link to="/admin/category">Category</Link>
        </li>
        <li className={location.pathname === '/admin/brands' ? 'active' : ''}>
          <Link to="/admin/brands">Brands</Link>
        </li>
        <li className={location.pathname === '/admin/offers' ? 'active' : ''}>
          <Link to="/admin/offers">Offers</Link>
        </li>
        <li className={location.pathname === '/admin/banner' ? 'active' : ''}>
          <Link to="/admin/banner">Banner</Link>
        </li>
        <li className={location.pathname === '/admin/sales-report' ? 'active' : ''}>
          <Link to="/admin/sales-report">Sales Report</Link>
        </li>

        {/* Updated Logout Item with onClick */}
        <li 
          className="logout-item" 
          onClick={handleLogout}
          style={{ cursor: 'pointer' }}
        >
          Logout
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;