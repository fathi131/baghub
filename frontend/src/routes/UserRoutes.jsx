import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { hasValidAuthToken } from "../services/authSession";


import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Contact from "../views/user/Contact";
import About from "../views/user/About";


import Landing from "../views/user/home/Landing";
import Home from "../views/user/home/Home";
import Login from "../views/user/Login";
import SignUp from "../views/user/SignUp";
import OtpVerification from "../views/user/OtpVerification";
import ForgotPassword from "../views/user/ForgotPassword";
import ForgotPasswordOtp from "../views/user/ForgotPasswordOtp";
import ResetPassword from "../views/user/ResetPassword";
import Profile from "../views/user/Profile";
import Address from "../views/user/Address";
import AddAddress from "../views/user/AddAddress";
import PasswordChange from "../views/user/PasswordChange";
import EditAddress from "../views/user/EditAddress";
import EditProfile from "../views/user/EditProfile";
import VerifyEmailOtp from "../views/user/VerifyEmailOtp";
import CategoryPage from '../views/user/CategoryPage';
import ProductDetails from "../views/user/ProductDetails";
import CartPage from '../views/user/CartPage';
import WishlistPage from '../views/user/wishlistPage';
import CheckoutPage from '../views/user/CheckoutPage';
import PaymentPage from '../views/user/PaymentPage';
import OrderSuccessPage from "../views/user/OrderSuccessPage";
import PaymentFailedPage from "../views/user/PaymentFailedPage";
import MyOrdersPage from "../views/user/MyOrdersPage";
import OrderDetailsPage from "../views/user/OrderDetailsPage";
import CancelConfirmationPage from "../views/user/CancelConfirmationPage";
import ViewReturnOrderPage from '../views/user/ViewReturnOrderPage';
import ReturnOrderPage from "../views/user/ReturnOrderPage";
import WriteReviewPage from "../views/user/WriteReviewPage";
import Wallet from '../views/user/Wallet';
import ReferralProgram from "../views/user/ReferralProgram";
import UserCouponsPage from "../views/user/UserCouponsPage";
import NotFound from "../views/NotFound";


const PublicRoute = ({ children }) => {
  return hasValidAuthToken() ? <Navigate to="/home" replace /> : children;
};


const ProtectedRoute = ({ children }) => {
  return hasValidAuthToken() ? children : <Navigate to="/login" replace />;
};


const UserLayout = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ flexGrow: 1 }}>
        <Outlet /> 
      </main>
      <Footer />
    </div>
  );
};

function UserRoutes() {
  return (
    <Routes>
      <Route element={<UserLayout />}>
        
        <Route path="/" element={<Home />} />
        <Route path="/landing" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/home" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        <Route path="/category" element={<CategoryPage />} />
        <Route path="/products" element={<CategoryPage/>} />
        <Route path="/product/:id" element={<ProductDetails />} />

       
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
        <Route path="/verify-otp" element={<PublicRoute><OtpVerification /></PublicRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/forgot-password-otp" element={<ForgotPasswordOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/manage-address" element={<ProtectedRoute><Address /></ProtectedRoute>} />
        <Route path="/add-address" element={<ProtectedRoute><AddAddress /></ProtectedRoute>} />
        <Route path="/password-change" element={<ProtectedRoute><PasswordChange /></ProtectedRoute>} />
        <Route path="/edit-address" element={<ProtectedRoute><EditAddress /></ProtectedRoute>} />
        <Route path="/edit-address/:id" element={<ProtectedRoute><EditAddress /></ProtectedRoute>} />
        <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/verify-email-otp" element={<ProtectedRoute><VerifyEmailOtp /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
        <Route path="/order-success" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
        <Route path="/payment-failed" element={<ProtectedRoute><PaymentFailedPage /></ProtectedRoute>} />
        <Route path="/my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
        <Route path="/order-details/:id" element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />
        <Route path="/cancel-order/:id" element={<ProtectedRoute><CancelConfirmationPage /></ProtectedRoute>} />
        <Route path="/view-return-order/:id" element={<ProtectedRoute><ViewReturnOrderPage /></ProtectedRoute>} />
        <Route path="/return-order/:id" element={<ProtectedRoute><ReturnOrderPage /></ProtectedRoute>} />
        <Route path="/write-review/:id" element={<ProtectedRoute><WriteReviewPage /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/coupons" element={<ProtectedRoute><UserCouponsPage /></ProtectedRoute>} />
        <Route path="/referral" element={<ProtectedRoute><ReferralProgram /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default UserRoutes;