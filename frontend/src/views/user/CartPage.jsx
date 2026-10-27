import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, loading, fetchCart, removeFromCart, updateQuantity } = useCart();

  useEffect(() => {
    if (fetchCart) fetchCart();
  }, []);

  const BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/100?text=No+Image';
    let cleanPath = String(imagePath).replace(/\\/g, '/');
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) return cleanPath;
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
    if (!cleanPath.includes('/uploads/')) cleanPath = `/uploads${cleanPath}`;
    return `${BASE_URL}${cleanPath}`;
  };

  const getItemPrice = (item) => {
    let basePrice = Number(item.price || 0);
    if (item.offer) {
      if (item.offer.discountType === 'fixed') {
        basePrice -= Number(item.offer.discountValue || 0);
      } else {
        const pctAmount = (basePrice * Number(item.offer.discountValue || 0)) / 100;
        const discount = item.offer.maxDiscount > 0
          ? Math.min(pctAmount, Number(item.offer.maxDiscount))
          : pctAmount;
        basePrice -= discount;
      }
    }
    return Math.max(0, basePrice);
  };

  const itemSubTotal = cartItems.reduce((acc, item) => acc + getItemPrice(item) * item.quantity, 0);
  const shippingFee = 0;
  const grandTotal = itemSubTotal + shippingFee;

  const hasOutOfStockItems = cartItems.some(
    (item) => item.stockCount <= 0 || item.isBlocked || item.isAvailable === false
  );

  const handleCheckout = () => {
    if (hasOutOfStockItems) {
      alert('Please remove Out of Stock or Unavailable items before proceeding to checkout.');
      return;
    }

    navigate('/checkout', {
      state: {
        cartItems: cartItems,
        subTotal: itemSubTotal,
        grandTotal: grandTotal
      }
    });
  };

  if (loading) {
    return (
      <div className="cart-page-wrapper" style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Loading Cart...</h2>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="cart-page-wrapper">
        <h1 className="cart-title">My Cart</h1>
        <div className="empty-cart-view">
          <p>Your cart is currently empty.</p>
          <button onClick={() => navigate('/products')}>Continue Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-wrapper">
      <h1 className="cart-title">My Cart</h1>

      <div className="cart-content-layout">
        <div className="cart-table-container">
          <div className="cart-header-row">
            <div>Product</div>
            <div>Price</div>
            <div>Quantity</div>
            <div>Total</div>
          </div>

          {cartItems.map((item) => {
            const isOutOfStock = item.stockCount <= 0 || item.isBlocked || item.isAvailable === false;
            const maxAllowed = Math.min(item.stockCount || 5, item.maxQuantityLimit || 5);
            const targetProductId = item.productId || item._id;

            return (
              <div key={targetProductId} className="cart-item-row">
                <div className="cart-product-info">
                  <img
                    src={getImageUrl(item.image || item.images?.[0])}
                    alt={item.name}
                    className="cart-product-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                    }}
                  />
                  <div className="cart-product-details">
                    <span className="cart-product-name">{item.name}</span>
                    <span className={`status-badge ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
                      {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                    </span>
                    <button
                      className="btn-remove-link"
                      onClick={() => removeFromCart(targetProductId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="cart-item-price">₹{getItemPrice(item)}</div>

                <div className="cart-item-qty">
                  <div className="quantity-pill-control">
                    <button
                      onClick={() => updateQuantity(targetProductId, -1)}
                      disabled={item.quantity <= 1 || isOutOfStock}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(targetProductId, 1)}
                      disabled={item.quantity >= maxAllowed || isOutOfStock}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="cart-item-total">₹{getItemPrice(item) * item.quantity}</div>
              </div>
            );
          })}
        </div>

        <div className="order-summary-card">
          <h3 className="summary-heading">Order Summary</h3>

          <div className="summary-row">
            <span>Item Sub Total</span>
            <span>₹{itemSubTotal}</span>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <span>{shippingFee === 0 ? 'Free' : `₹${shippingFee}`}</span>
          </div>

          <div className="summary-row total-row">
            <span>Total</span>
            <span>₹{grandTotal}</span>
          </div>

          <hr className="summary-divider" />

          <button
            className="btn-checkout"
            onClick={handleCheckout}
            disabled={hasOutOfStockItems}
          >
            CHECKOUT
          </button>

          {hasOutOfStockItems && (
            <div className="out-stock-warning-banner">
              ⚠️ Remove out-of-stock items to enable Checkout.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartPage;