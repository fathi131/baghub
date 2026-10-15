import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer" style={{ backgroundColor: '#03544c', color: '#ffffff' }}>
      <div className="footer-logo">
        <h2>BagHub</h2>
      </div>

      <div className="footer-content">
        <div className="footer-column">
          <h4>SHOP</h4>
          <ul>
            <li>Backpacks</li>
            <li>Travel Bags</li>
            <li>Messenger Bags</li>
            <li>Laptop Bags</li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>SUPPORT</h4>
          <ul>
            <li>Order Status</li>
            <li>Product Support</li>
            <li>Shipping & Return Policy</li>
            <li>Complaint Registration</li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>ABOUT US</h4>
          <ul>
            <li>Contact Us</li>
            <li>Privacy Policy</li>
            <li>Terms of Use</li>
            <li>FAQ</li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>CONTACT</h4>
          <p>Email: baghub@gmail.com</p>
          <p>Phone: +91 8888888888</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2025 BagHub. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;