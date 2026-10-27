import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';  
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const { cartItems } = useCart();  
  const cartCount = cartItems?.length || 0;  

  return (
    <header className="main-navbar">
      <nav className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/products">Shop</Link>
        <Link to="/contact">Contact Us</Link>
        <Link to="/about">About Us</Link>
      </nav>

      <div className="logo">
        <Link to="/">🎒 <span>BagHub</span></Link>
      </div>

      <div className="nav-right">
        {location.pathname === '/landing' && (
          <div className="user-auth">
            <span className="welcome-text">WELCOME</span>
            <Link to="/login" className="login-link">LOG IN / REGISTER</Link>
          </div>
        )}
        <div className="nav-icons">
          
          <Link to="/cart" title="Cart" className="cart-link">
            🛒
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </Link>
          <Link to="/profile" title="Profile">👤</Link>
          <Link to="/wishlist" title="Wishlist">❤️</Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;