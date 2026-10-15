const express = require('express');
const router = express.Router();
const { isUser } = require('../middlewares/authMiddleware');

const { 
  signup, 
  login,
  verifyOTP, 
  resendOTP, 
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  updateProfileImage,
  getReferralDashboard,
  loginWithGoogle,
  loginWithFacebook,
  getAddresses,
  getAddressById,
  addAddress,
  updateAddress,
  deleteAddress,
  getProducts,
  getCategories,    
  getHomePageSections,
  getProductDetails,
  getRelatedProducts,
  addToCart,
  getCart,
  getWishlist, 
  toggleWishlist,
  removeFromWishlist,
  updateCartQuantity,
  removeFromCart,
  sendEmailOTP,
  verifyEmailOTP,
  getWallet,
  addMoneyToWallet,
  useWalletForOrder
} = require('../controllers/userAuthController');
const {
  createOrder,
  getUserOrders,
  getUserOrderById,
  cancelUserOrder,
  returnUserOrder,
   downloadInvoice
} = require('../controllers/orderController');
const { applyCoupon, listAvailableCoupons } = require('../controllers/couponController');
const { profileImageUpload } = require('../middlewares/uploadMiddleware');
const { getBanner } = require('../controllers/bannerController');


router.post('/signup', signup);
router.post('/login', login);
router.post('/google', loginWithGoogle);
router.post('/facebook', loginWithFacebook);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/forgot-password/resend-otp', forgotPassword);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOtp);
router.post('/reset-password', resetPassword);
router.post('/send-email-otp', isUser, sendEmailOTP);
router.post('/verify-email-otp', isUser, verifyEmailOTP);
router.get('/products', getProducts);
router.get('/categories', getCategories);   
router.get('/home-sections', getHomePageSections);
router.get('/banner', getBanner);
router.get('/products/:id', getProductDetails);
router.get('/products/:id/related', getRelatedProducts);
router.post('/cart/add', isUser,addToCart);
router.get('/cart',isUser, getCart);
router.put('/cart/update',isUser, updateCartQuantity);
router.delete('/cart/remove/:productId',isUser, removeFromCart);
router.get('/wishlist', isUser, getWishlist);
router.post('/wishlist/toggle', isUser, toggleWishlist);
router.delete('/wishlist/:productId',isUser, removeFromWishlist);
router.get('/wallet', isUser, getWallet);
router.post('/wallet/add-money', isUser, addMoneyToWallet);
router.post('/wallet/use', isUser, useWalletForOrder);


router.get('/profile', isUser, getProfile);
router.put('/profile', isUser, updateProfile);
router.put('/profile/image', isUser, profileImageUpload.single('profileImage'), updateProfileImage);
router.patch('/change-password', isUser, changePassword);
router.get('/referral', isUser, getReferralDashboard);


router.get('/address', isUser, getAddresses);
router.get('/address/:id', isUser, getAddressById);
router.get('/addresses', isUser, getAddresses);
router.get('/addresses/:id', isUser, getAddressById);
router.post('/address', isUser, addAddress);
router.post('/addresses', isUser, addAddress);
router.put('/address/:id', isUser, updateAddress);
router.put('/addresses/:id', isUser, updateAddress);
router.delete('/address/:id', isUser, deleteAddress);
router.delete('/addresses/:id', isUser, deleteAddress);

router.post('/orders', isUser, createOrder);
router.get('/orders', isUser, getUserOrders);
router.get('/orders/:id', isUser, getUserOrderById);
router.patch('/orders/:id/cancel', isUser, cancelUserOrder);
router.patch('/orders/:id/return', isUser, returnUserOrder);
router.get('/orders/:id/invoice', isUser, downloadInvoice); 

router.get('/coupons', isUser, listAvailableCoupons);
router.post('/coupons/apply', isUser, applyCoupon);
module.exports = router;