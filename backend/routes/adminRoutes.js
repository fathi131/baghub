const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware'); // Multer Upload Middleware
const { isAdmin } = require('../middlewares/authMiddleware'); // Admin Auth Middleware

const {
  adminLogin,
  adminForgotPassword,   
  adminVerifyOtp,      
  adminResetPassword,
  getUsers,
  createUser,
  toggleBlockUser,
  getCategories,
  getCategoryById,
  addCategory,
  editCategory,
  toggleCategoryStatus,
  deleteCategory,
  getAdminProducts,
  addProduct,
  editProduct,
  toggleBlockProduct,
  deleteProduct,
   addVariant,    
  updateVariant,     
  deleteVariant, 
  getVariants,  
  getAdminDashboard,
  getBrands,
  addBrand,
  updateBrand,
  updateBrandStatus,
} = require('../controllers/adminController');
const { getAllOrders, getAdminOrderById, updateOrderStatus } = require('../controllers/orderController');
const { getSalesReport } = require('../controllers/salesController');
const { listOffers, createOffer, updateOffer, updateOfferStatus, deleteOffer, getOfferSummary } = require('../controllers/offerController');
const { listCoupons, createCoupon, deleteCoupon } = require('../controllers/couponController');
const { getBanner, updateBannerContent, uploadBannerImage, removeBanner } = require('../controllers/bannerController');
const { bannerImageUpload } = require('../middlewares/uploadMiddleware');


router.post('/login', adminLogin);

router.post('/forgot-password', adminForgotPassword);
router.post('/verify-otp', adminVerifyOtp);
router.post('/reset-password', adminResetPassword);


router.get('/users', isAdmin, getUsers);
router.post('/users', isAdmin, createUser);
router.patch('/users/:id/block', isAdmin, toggleBlockUser);


router.get('/categories', getCategories);
router.get('/categories/:id', isAdmin, getCategoryById);
router.post('/add-category', isAdmin, upload.none(), addCategory);
router.put('/categories/:id', isAdmin, editCategory);
router.patch('/categories/toggle-status/:id', isAdmin, toggleCategoryStatus);
router.patch('/categories/:id/delete', isAdmin, deleteCategory);


router.get('/products', isAdmin, getAdminProducts);
router.post('/products', isAdmin, upload.array('images', 4), addProduct);
router.put('/products/:id', isAdmin, upload.array('images', 4), editProduct);
router.patch('/products/toggle-status/:id', isAdmin, toggleBlockProduct);
router.patch('/products/:id/delete', isAdmin, deleteProduct);


router.get('/products/:productId/variants', getVariants);
router.post('/products/:productId/variants', isAdmin, upload.array('images', 4), addVariant);
router.put('/products/:productId/variants/:variantId', isAdmin, updateVariant);
router.delete('/products/:productId/variants/:variantId', isAdmin, deleteVariant);

router.get('/dashboard', isAdmin, getAdminDashboard);
router.get('/banner', isAdmin, getBanner);
router.put('/banner', isAdmin, updateBannerContent);
router.post('/banner/upload', isAdmin, bannerImageUpload.single('bannerImage'), uploadBannerImage);
router.delete('/banner', isAdmin, removeBanner);
router.get('/brands', isAdmin, getBrands);
router.post('/brands', isAdmin, addBrand);
router.put('/brands/:id', isAdmin, updateBrand);
router.patch('/brands/:id/status', isAdmin, updateBrandStatus);
router.get('/orders', isAdmin, getAllOrders);
router.get('/orders/:id', isAdmin, getAdminOrderById);
router.patch('/orders/:id/status', isAdmin, updateOrderStatus);
router.get('/sales/report', isAdmin, getSalesReport);

router.get('/offers', isAdmin, listOffers);
router.post('/offers', isAdmin, createOffer);
router.put('/offers/:id', isAdmin, updateOffer);
router.patch('/offers/:id/status', isAdmin, updateOfferStatus);
router.delete('/offers/:id', isAdmin, deleteOffer);
router.get('/offers/summary', isAdmin, getOfferSummary);

router.get('/coupons', isAdmin, listCoupons);
router.post('/coupons', isAdmin, createCoupon);
router.delete('/coupons/:id', isAdmin, deleteCoupon);

module.exports = router;