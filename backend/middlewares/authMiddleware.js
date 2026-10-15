const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // ✅ Model name 'User' confirmed

const isUser = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

      
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been blocked by an administrator.'
        });
      }

      req.user = decoded;
      req.dbUser = user; 
      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  }

  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Unauthorized: Please log in to continue',
  });
};

const isAdmin = (req, res, next) => {
  isUser(req, res, () => {
    if (req.user && (req.user.role === 'admin' || req.user.isAdmin === true)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required',
    });
  });
};

module.exports = { isUser, isAdmin };