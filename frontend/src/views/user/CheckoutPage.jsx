import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../api/axios';
import { useCart } from '../../context/CartContext';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems: contextCartItems } = useCart();

  const cartItems = location.state?.cartItems || contextCartItems || [];
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const getEmptyForm = () => ({
    name: '',
    phone: '',
    houseName: '',
    street: '',
    city: '',
    state: '',
    country: 'India',
    zipCode: ''
  });

  const [formData, setFormData] = useState(getEmptyForm());

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const fetchAddresses = async () => {
    try {
      const res = await API.get('/user/address');
      const list = res.data?.addresses || [];
      setAddresses(list);
      const defaultAddress = list.find((addr) => addr.isDefault) || list[0];
      setSelectedAddressId(defaultAddress ? defaultAddress._id || defaultAddress.id : null);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/80';
    const cleanPath = String(imagePath).replace(/\\/g, '/');
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) return cleanPath;
    const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    const finalPath = normalizedPath.includes('/uploads/') ? normalizedPath : `/uploads${normalizedPath}`;
    return `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}${finalPath}`;
  };

  const getItemPrice = (item) => {
    let basePrice = Number(item.price || item.product?.price || 0);
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

  const subTotal = cartItems.reduce((acc, item) => acc + getItemPrice(item) * (item.quantity || 1), 0);

  const shipping = 0;
  const tax = Math.round(subTotal * 0.05);
  const discount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  const grandTotal = Math.max(0, subTotal + tax + shipping - discount);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');

    if (appliedCoupon) {
      setCouponError('A coupon is already applied. Remove it first.');
      return;
    }

    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    try {
      setCouponLoading(true);
      const res = await API.post('/user/coupons/apply', {
        couponCode: couponCode.trim(),
        orderAmount: subTotal
      });

      if (res.data && res.data.coupon) {
        setAppliedCoupon(res.data.coupon);
        setCouponCode('');
      } else {
        setCouponError('Invalid response from server.');
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid or expired coupon code.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      phone: formData.phone,
      houseName: formData.houseName,
      locality: formData.street,
      city: formData.city,
      state: formData.state,
      country: formData.country || 'India',
      pincode: formData.zipCode,
      isDefault: false
    };

    try {
      if (editingAddressId) {
        await API.put(`/user/address/${editingAddressId}`, payload);
      } else {
        await API.post('/user/address', payload);
      }
      setEditingAddressId(null);
      setFormData(getEmptyForm());
      await fetchAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      alert(error.response?.data?.message || 'Unable to save address');
    }
  };

  const handleEditAddress = (addr) => {
    const id = addr._id || addr.id;
    setEditingAddressId(id);
    setFormData({
      name: addr.name || '',
      phone: addr.phone || '',
      houseName: addr.houseName || '',
      street: addr.locality || addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      country: addr.country || 'India',
      zipCode: addr.pincode || ''
    });
  };

  const handleProceedToPayment = () => {
    if (!selectedAddressId) {
      alert('Please select a shipping address!');
      return;
    }
    if (cartItems.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    const selectedAddr = addresses.find((addr) => (addr._id || addr.id) === selectedAddressId);

    navigate('/payment', {
      state: {
        shippingAddress: selectedAddr,
        cartItems,
        subTotal,
        tax,
        shippingFee: shipping,
        discount,
        appliedCoupon: appliedCoupon ? appliedCoupon.code : null,
        grandTotal
      }
    });
  };

  return (
    <div className="checkout-container">
      <h1 className="checkout-title">Checkout</h1>

      <div className="checkout-content">
        <div className="checkout-left">
          <div className="shipping-box">
            <h3>Shipping</h3>

            <form className="address-form" onSubmit={handleSaveAddress}>
              <input type="text" name="name" placeholder="Full name*" value={formData.name} onChange={handleInputChange} required />
              <div className="form-row">
                <input type="text" name="houseName" placeholder="House Name*" value={formData.houseName} onChange={handleInputChange} required />
                <input type="text" name="street" placeholder="Street*" value={formData.street} onChange={handleInputChange} required />
              </div>
              <div className="form-row">
                <input type="text" name="city" placeholder="City*" value={formData.city} onChange={handleInputChange} required />
                <input type="text" name="state" placeholder="State*" value={formData.state} onChange={handleInputChange} required />
              </div>
              <div className="form-row">
                <input type="text" name="zipCode" placeholder="Zip Code*" value={formData.zipCode} onChange={handleInputChange} required />
                <input type="text" name="country" placeholder="Country*" value={formData.country} onChange={handleInputChange} required />
              </div>
              <input type="text" name="phone" placeholder="Phone number*" value={formData.phone} onChange={handleInputChange} required />

              <div className="btn-add-wrapper">
                <button type="submit" className="btn-add-new-address">
                  {editingAddressId ? 'Update Address' : 'Add New Address'}
                </button>
              </div>
            </form>

            <div className="checkout-items-box" style={{ margin: '18px 0' }}>
              <h3>Products</h3>
              {cartItems.length === 0 ? (
                <p>Your cart is empty.</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.productId || item._id} className="checkout-item-row" style={{ display: 'flex', gap: '12px', alignItems: 'center', border: '1px solid #eee', padding: '10px', borderRadius: '10px', marginBottom: '10px' }}>
                    <img 
                      src={getImageUrl(item.image || item.images?.[0])} 
                      alt={item.name} 
                      style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px' }} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/80';
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <strong>{item.name}</strong>
                      <p style={{ margin: '4px 0', color: '#555' }}>Qty: {item.quantity}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong>₹{(Number(getItemPrice(item)) * Number(item.quantity || 1))}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="address-cards-grid">
              {addresses.map((addr, index) => {
                const addrId = addr._id || addr.id;
                return (
                  <div key={addrId} className={`address-card ${selectedAddressId === addrId ? 'active' : ''}`} onClick={() => setSelectedAddressId(addrId)}>
                    <div className="address-card-header">
                      <input type="radio" name="selectedAddress" checked={selectedAddressId === addrId} onChange={() => setSelectedAddressId(addrId)} />
                      <strong>{addr.isDefault ? 'Default Address' : `Address${index + 1}`}</strong>
                    </div>
                    <div className="address-info">
                      <p className="addr-name">{addr.name}</p>
                      <p>{addr.houseName || addr.addressLine}, {addr.city}</p>
                      <p>{addr.state} - {addr.pincode}</p>
                      <p>phn: {addr.phone}</p>
                    </div>
                    <button type="button" className="btn-edit-addr" onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }} style={{ marginTop: '8px' }}>Edit</button>
                  </div>
                );
              })}
            </div>

            <div className="btn-continue-wrapper">
              <button className="btn-continue" onClick={handleProceedToPayment}>Continue</button>
            </div>
          </div>
        </div>

        <div className="checkout-right">
          <div className="order-summary-box">
            <h3>Order Summary</h3>
            <div className="price-breakdown">
              <div className="price-row"><span>Item Sub Total</span><span>₹{subTotal}</span></div>
              <div className="price-row"><span>Tax (5%)</span><span>₹{tax}</span></div>
              <div className="price-row"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
              {appliedCoupon && (
                <div className="price-row discount-row" style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>- ₹{discount}</span>
                </div>
              )}
              <div className="price-row total-row"><strong>Total</strong><strong>₹{grandTotal}</strong></div>
            </div>

            <div className="coupon-container" style={{ margin: '15px 0' }}>
              {!appliedCoupon ? (
                <form onSubmit={handleApplyCoupon} className="coupon-input-box" style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="Coupon code" 
                    value={couponCode} 
                    onChange={(e) => setCouponCode(e.target.value)} 
                    style={{ flex: 1, padding: '8px' }}
                  />
                  <button type="submit" disabled={couponLoading} style={{ padding: '8px 16px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </form>
              ) : (
                <div className="applied-coupon-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#e8f5e9', padding: '8px 12px', borderRadius: '4px' }}>
                  <span style={{ color: '#2e7d32', fontSize: '13px' }}>Coupon <strong>{appliedCoupon.code}</strong> Applied</span>
                  <button type="button" onClick={handleRemoveCoupon} style={{ background: '#d32f2f', color:'#fff', border:'none', padding:'4px 8px', borderRadius:'4px', cursor:'pointer', fontSize:'12px' }}>Remove</button>
                </div>
              )}
              {couponError && <p style={{ color: '#d32f2f', fontSize: '12px', marginTop:'5px' }}>{couponError}</p>}
            </div>

            <button className="btn-continue-green" onClick={handleProceedToPayment}>CONTINUE</button>
            <p className="delivery-estimate">Estimated Delivery<br /><strong>10–12 July 2026</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;