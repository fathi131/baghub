const User = require('../models/userModel');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Cart = require('../models/Cart');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const mongoose = require('mongoose');
const Wishlist = require('../models/wishlistModel');
const Offer = require('../models/Offer');
const crypto = require('crypto');
const { getApplicableOffer, getApplicableOffers } = require('./offerController');

const generateReferralCode = async (name) => {
  const prefix = String(name || 'BAG').replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase() || 'BAG';
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = `${prefix}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    if (!(await User.exists({ referralCode: code }))) return code;
  }
  throw new Error('Could not generate a unique referral code');
};

const signUserToken = (user) => jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET || 'secretkey',
  { expiresIn: '7d' }
);

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  profileImage: user.profileImage || '',
  role: user.role
});

const findOrCreateSocialUser = async ({ provider, providerId, email, name, picture, referralCode }) => {
  const normalizedEmail = email.toLowerCase().trim();
  let user = await User.findOne({ $or: [{ email: normalizedEmail }, { [`${provider}Id`]: providerId }] });

  if (user?.isBlocked) {
    const error = new Error('Your account has been blocked by an administrator.');
    error.status = 403;
    throw error;
  }

  if (!user) {
    const referrer = referralCode
      ? await User.findOne({ referralCode: String(referralCode).trim().toUpperCase() })
      : null;
    if (referralCode && !referrer) {
      const error = new Error('Referral code is invalid or no longer available');
      error.status = 400;
      throw error;
    }
    if (referrer?.email === normalizedEmail) {
      const error = new Error('You cannot use your own referral code');
      error.status = 400;
      throw error;
    }
    user = new User({
      name: name?.trim() || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      [`${provider}Id`]: providerId,
      profileImage: picture || '',
      referralCode: await generateReferralCode(name),
      referredBy: referrer?._id || null,
      isVerified: true
    });
  } else {
    user[`${provider}Id`] = providerId;
    user.isVerified = true;
    if (!user.profileImage && picture) user.profileImage = picture;
  }

  await user.save();
  return user;
};



const signup = async (req, res) => {
  try {
    const { name, email, password, phone = "", referralCode } = req.body;

    
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (name.trim().length < 3) {
      return res.status(400).json({ message: "Name must be at least 3 characters long" });
    }

   
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

   
    if (phone && !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone number must be a valid 10-digit number" });
    }

    
   
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!\%*?&#]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long, contain 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&)"
      });
    }

    
    let user = await User.findOne({ email });

    if (user && user.isVerified) {
      return res.status(400).json({ message: "Email already registered. Please login." });
    }

    const normalizedReferralCode = String(referralCode || '').trim().toUpperCase();
    const referrer = normalizedReferralCode
      ? await User.findOne({ referralCode: normalizedReferralCode })
      : null;
    if (normalizedReferralCode && !referrer) {
      return res.status(400).json({ message: 'Referral code is invalid or no longer available' });
    }
    if (user && referrer?._id.equals(user._id)) {
      return res.status(400).json({ message: 'You cannot use your own referral code' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpires = new Date(Date.now() + 60 * 1000); // 60 Seconds Timer

    if (!user) {
      user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password: hashedPassword,
        referralCode: await generateReferralCode(name),
        pendingReferredBy: referrer?._id || null,
        otp,
        otpExpires
      });
    } else {
      user.name = name.trim();
      user.phone = phone.trim();
      user.password = hashedPassword;
      user.otp = otp;
      user.otpExpires = otpExpires;
      if (referrer) user.pendingReferredBy = referrer._id;
    }

    await user.save();

    
    try {
      await sendEmail(email, "BagHub Verification Code", `Your OTP for signup is: ${otp}`);
    } catch (emailErr) {
      console.error("Nodemailer failed:", emailErr.message);
      return res.status(200).json({ 
        message: "Signup initiated, but failed to send OTP email. Please click Resend OTP.",
        email 
      });
    }

    res.status(200).json({ message: "OTP sent to your email", email });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Email or Password' });
    }

    
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email via OTP before logging in.' });
    }

    
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked by an administrator.' });
    }

    if (!user.password) {
      return res.status(400).json({ message: 'This account uses social sign-in. Continue with Google or Facebook.' });
    }

   
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Email or Password' });
    }

    res.status(200).json({
      message: 'Login successful',
      token: signUserToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const loginWithGoogle = async (req, res) => {
  try {
    const { accessToken, referralCode } = req.body;
    if (!accessToken) return res.status(400).json({ message: 'Google access token is required' });

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!profileResponse.ok) return res.status(401).json({ message: 'Google authentication failed' });

    const profile = await profileResponse.json();
    if (!profile.sub || !profile.email || profile.email_verified !== true) {
      return res.status(401).json({ message: 'Google did not return a verified email address' });
    }
    const user = await findOrCreateSocialUser({
      provider: 'google',
      providerId: profile.sub,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      referralCode
    });
    return res.status(200).json({ token: signUserToken(user), user: publicUser(user) });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || 'Google login failed' });
  }
};

const loginWithFacebook = async (req, res) => {
  try {
    const { accessToken, referralCode } = req.body;
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (!appId || !appSecret) {
      return res.status(503).json({ message: 'Facebook login is not configured on the server' });
    }
    if (!accessToken) return res.status(400).json({ message: 'Facebook access token is required' });

    const debugUrl = new URL('https://graph.facebook.com/debug_token');
    debugUrl.searchParams.set('input_token', accessToken);
    debugUrl.searchParams.set('access_token', `${appId}|${appSecret}`);
    const debugResponse = await fetch(debugUrl);
    const debugResult = await debugResponse.json();
    if (!debugResponse.ok || !debugResult.data?.is_valid || debugResult.data.app_id !== appId) {
      return res.status(401).json({ message: 'Facebook authentication failed' });
    }

    const profileUrl = new URL('https://graph.facebook.com/me');
    profileUrl.searchParams.set('fields', 'id,name,email,picture.type(large)');
    profileUrl.searchParams.set('access_token', accessToken);
    const profileResponse = await fetch(profileUrl);
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.id || !profile.email) {
      return res.status(401).json({ message: 'Facebook must provide an email address to sign in' });
    }
    const user = await findOrCreateSocialUser({
      provider: 'facebook',
      providerId: profile.id,
      email: profile.email,
      name: profile.name,
      picture: profile.picture?.data?.url,
      referralCode
    });
    return res.status(200).json({ token: signUserToken(user), user: publicUser(user) });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || 'Facebook login failed' });
  }
};



const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

   
    if (!user.otp || String(user.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    
    if (!user.otpExpires || new Date(user.otpExpires).getTime() < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired. Please resend.' });
    }

    user.isVerified = true;
    user.otp = undefined; 
    user.otpExpires = undefined;
    if (!user.referralCode) user.referralCode = await generateReferralCode(user.name);
    if (user.pendingReferredBy && !user.referredBy) user.referredBy = user.pendingReferredBy;
    user.pendingReferredBy = null;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secretkey', {
      expiresIn: '7d'
    });

    res.status(200).json({
      message: 'Account verified successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    
    user.otp = newOtp;
    user.otpExpires = new Date(Date.now() + 60 * 1000);
    await user.save();

    try{
     await sendEmail(email, 'BagHub New OTP', `Your new OTP is: ${newOtp}`);
     return res.status(200).json({ message: 'New OTP sent to email' });
    }catch (emailErr) {
      console.error('Nodemailer Error during Resend OTP:', emailErr.message);
      return res.status(500).json({ 
        message: 'Failed to send OTP email. Please check NodeMailer / App Password credentials.' 
      });
    }

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    const otp = crypto.randomInt(1000, 10000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    try {
      await sendEmail(normalizedEmail, 'BagHub Reset Password OTP', `Your OTP for resetting password is: ${otp}`);
      return res.status(200).json({ message: 'OTP sent to your email successfully' });
    } catch (emailErr) {
      console.error('Nodemailer Error in Forgot Password:', emailErr.message);
      return res.status(500).json({ 
        message: 'Failed to send OTP email. Please check NodeMailer / SMTP settings.' 
      });
    }

  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();
    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordOtp || user.resetPasswordOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    if (!user.resetPasswordOtpExpires || user.resetPasswordOtpExpires.getTime() < Date.now()) {
      user.resetPasswordOtp = null;
      user.resetPasswordOtpExpires = null;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;
    await user.save();
    return res.status(200).json({ message: 'OTP verified', resetToken });
  } catch (error) {
    return res.status(500).json({ message: 'Could not verify reset OTP', error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    if (!resetToken || !password) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({ message: 'Password must be 8+ characters with uppercase, lowercase, number, and special character' });
    }

    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() }
    });
    if (!user) return res.status(400).json({ message: 'Reset session expired. Request a new OTP.' });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not reset password', error: error.message });
  }
};
const sendEmailOTP = async (req, res) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const newEmail = String(req.body.newEmail || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address' });
    }
    if (newEmail === user.email.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'Enter a different email address' });
    }
    if (await User.exists({ email: newEmail, _id: { $ne: user._id } })) {
      return res.status(409).json({ success: false, message: 'That email is already registered' });
    }
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.pendingEmail = newEmail;
    user.emailChangeOtp = otp;
    user.emailChangeOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();
    await sendEmail(newEmail, 'BagHub Email Change OTP', `Your OTP to change email is: ${otp}`);
    return res.status(200).json({ success: true, message: 'OTP sent to email successfully' });
  } catch (error) {
    console.error('Send Email OTP Error:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Failed to send OTP email' });
  }
};


const verifyEmailOTP = async (req, res) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { otp } = req.body;
    if (!user.emailChangeOtp || String(user.emailChangeOtp) !== String(otp || '').trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP!' });
    }
    if (!user.emailChangeOtpExpires || user.emailChangeOtpExpires.getTime() < Date.now()) {
      user.pendingEmail = null;
      user.emailChangeOtp = null;
      user.emailChangeOtpExpires = null;
      await user.save();
      return res.status(400).json({ success: false, message: 'OTP has expired. Please resend.' });
    }
    if (!user.pendingEmail || await User.exists({ email: user.pendingEmail, _id: { $ne: user._id } })) {
      return res.status(409).json({ success: false, message: 'That email is no longer available' });
    }
    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.emailChangeOtp = null;
    user.emailChangeOtpExpires = null;
    await user.save();
    return res.status(200).json({
      success: true,
      message: 'Email updated successfully!',
      user: publicUser(user)
    });
  } catch (error) {
    console.error('Verify Email OTP Error:', error.message);
    return res.status(error.code === 11000 ? 409 : 500).json({ success: false, message: error.code === 11000 ? 'That email is already registered' : 'Server Error during email verification' });
  }
};


const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user?.id).select('-password -otp -otpExpires -emailChangeOtp -emailChangeOtpExpires -pendingEmail -resetPasswordToken -resetPasswordExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const name = String(req.body.name || req.body.username || '').trim();
    const requestedEmail = String(req.body.email || user.email).trim().toLowerCase();
    if (name.length < 3) return res.status(400).json({ message: 'Name must be at least 3 characters long' });
    if (requestedEmail !== user.email.toLowerCase()) {
      return res.status(400).json({ message: 'Email changes must be verified with an OTP' });
    }
    const phone = String(req.body.phone ?? user.phone ?? '').trim();
    if (phone && !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be a valid 10-digit number' });
    }
    user.name = name;
    user.phone = phone;
    await user.save();
    return res.status(200).json({ message: 'Profile updated successfully', user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Could not update profile', error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.password) return res.status(400).json({ message: 'This account uses social sign-in and has no password to change' });
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current and new passwords are required' });
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({ message: 'New password must be 8+ characters with uppercase, lowercase, number, and special character' });
    }
    if (await bcrypt.compare(newPassword, user.password)) {
      return res.status(400).json({ message: 'New password must be different from the current password' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not change password', error: error.message });
  }
};

const updateProfileImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please choose an image file' });
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.profileImage = `/uploads/profiles/${req.file.filename}`;
    await user.save();
    return res.status(200).json({ message: 'Profile image updated', profileImage: user.profileImage });
  } catch (error) {
    return res.status(500).json({ message: 'Could not update profile image', error: error.message });
  }
};

const getReferralDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.referralCode) {
      user.referralCode = await generateReferralCode(user.name);
      await user.save();
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);
    const [offer, referredUsers] = await Promise.all([
      Offer.findOne({
        type: 'referral',
        isActive: true,
        startDate: { $lte: now },
        expiryDate: { $gte: startOfToday }
      }).sort({ createdAt: -1 }),
      User.find({ referredBy: user._id })
        .select('createdAt referralRewardEarned referralRewardAmount referralRewardedAt')
        .sort({ createdAt: -1 })
    ]);

    const referrals = referredUsers.map((referredUser) => ({
      joinedAt: referredUser.createdAt,
      rewardEarned: referredUser.referralRewardEarned,
      rewardAmount: referredUser.referralRewardAmount || 0,
      rewardedAt: referredUser.referralRewardedAt
    }));
    const rewardedCount = referrals.filter((referral) => referral.rewardEarned).length;
    const rewardTotal = referrals.reduce((total, referral) => total + referral.rewardAmount, 0);
    const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

    return res.status(200).json({
      referralCode: user.referralCode,
      referralLink: `${baseUrl}/signup?ref=${encodeURIComponent(user.referralCode)}`,
      rewardOffer: offer ? {
        name: offer.name,
        description: offer.description,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        maxDiscount: offer.maxDiscount,
        expiryDate: offer.expiryDate
      } : null,
      stats: {
        invited: referrals.length,
        rewarded: rewardedCount,
        pending: referrals.length - rewardedCount,
        totalEarned: Number(rewardTotal.toFixed(2))
      },
      referrals
    });
  } catch (error) {
    return res.status(500).json({ message: 'Could not load referral details', error: error.message });
  }
};



const getAddresses = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    
    res.status(200).json({ 
      success: true, 
      addresses: user.addresses || [] 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching addresses', error: error.message });
  }
};

const getAddressById = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const address = user.addresses.id(id);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.status(200).json({ success: true, address });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching address', error: error.message });
  }
};

const addAddress = async (req, res) => {
  
  console.log("=== ADD ADDRESS REQUEST BODY ===", req.body);

  try {
    const userId = req.user?._id || req.user?.id;
    
    
    if (!userId) {
      console.log("ERROR: User ID missing from req.user");
      return res.status(401).json({ message: 'Unauthorized, user missing' });
    }

    const { 
      name, fullName,
      phone, phoneNumber,
      houseName, addressLine,
      locality, street,
      city, town,
      state, pincode, isDefault 
    } = req.body;

    const finalName = name || fullName;
    const finalPhone = phone || phoneNumber;
    const finalHouseName = houseName || addressLine;
    const finalLocality = locality || street;
    const finalCity = city || town;

    
    if (!finalName || !finalPhone || !finalHouseName || !finalLocality || !finalCity || !state || !pincode) {
      console.log("VALIDATION FAILED:", { finalName, finalPhone, finalHouseName, finalLocality, finalCity, state, pincode });
      return res.status(400).json({ message: 'All address fields are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      name: finalName,
      phone: finalPhone,
      houseName: finalHouseName,
      locality: finalLocality,
      city: finalCity,
      state,
      pincode,
      isDefault: Boolean(isDefault)
    };

    user.addresses.push(newAddress);
    await user.save();

    console.log("ADDRESS ADDED SUCCESSFULLY!");
    res.status(201).json({ message: 'Address added successfully', addresses: user.addresses });
  } catch (error) {
    console.error("CATCH ERROR IN ADD ADDRESS:", error);
    res.status(500).json({ message: 'Error adding address', error: error.message });
  }
};


const updateAddress = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params; // Address sub-document _id

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const address = user.addresses.id(id);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const {
      name, fullName,
      phone, phoneNumber,
      houseName, addressLine,
      locality, street,
      city, town,
      state,
      country,
      pincode,
      isDefault
    } = req.body;

    const finalName = name || fullName || address.name;
    const finalPhone = phone || phoneNumber || address.phone;
    const finalHouseName = houseName || addressLine || address.houseName;
    const finalLocality = locality || street || address.locality;
    const finalCity = city || town || address.city;
    const finalState = state || address.state;
    const finalPincode = pincode || address.pincode;

    if (!finalName || !finalPhone || !finalHouseName || !finalLocality || !finalCity || !finalState || !finalPincode) {
      return res.status(400).json({ message: 'All address fields are required' });
    }

    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    address.name = finalName;
    address.phone = finalPhone;
    address.houseName = finalHouseName;
    address.locality = finalLocality;
    address.city = finalCity;
    address.state = finalState;
    address.pincode = finalPincode;
    address.country = country || address.country || 'India';
    address.isDefault = Boolean(isDefault ?? address.isDefault);

    await user.save();
    res.status(200).json({ message: 'Address updated successfully', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ message: 'Error updating address', error: error.message });
  }
};

// 4. Delete Address
const deleteAddress = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.addresses = user.addresses.filter((addr) => addr._id.toString() !== id);
    await user.save();

    res.status(200).json({ message: 'Address deleted successfully', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting address', error: error.message });
  }
};

// 🛒 User Side Product Listing (Enhanced Search, Category, Filter, Sort, Pagination)
  
const getProducts = async (req, res) => {
  try {
    const {
      search = '',
      category = '', // Can be Category ID, Category Name, or comma-separated names/IDs
      minPrice,
      maxPrice,
      brand = '',
      sort = '',
      page = 1,
      limit = 8
    } = req.query;

    // 1. Unlisted / Blocked Products & Categories Filter
    
    const activeCategories = await Category.find({
      isBlocked: false,
      isDeleted: false
    }).select('_id');

    const activeCategoryIds = activeCategories.map((c) => c._id);

    
    const query = {
      isBlocked: false,
      isDeleted: false,
      category: { $in: activeCategoryIds }
    };

    
    const cleanSearch = search.trim();
    if (cleanSearch) {
      query.$or = [
        { name: { $regex: cleanSearch,$options: 'i' } },
        { brand: { $regex: cleanSearch,$options: 'i' } },
        { description: { $regex: cleanSearch,$options: 'i' } }
      ];
    }

    
    if (category) {
      const categoryArray = category.split(',').map((c) => c.trim());
      const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

      const objectIds = categoryArray.filter((c) => isValidObjectId(c));
      const categoryNames = categoryArray.filter((c) => !isValidObjectId(c));

      if (categoryNames.length > 0) {
        const foundCategories = await Category.find({
          name: { $in: categoryNames.map((n) => new RegExp(`^${n}$`, 'i')) },
          isBlocked: false,
          isDeleted: false
        }).select('_id');

        const foundIds = foundCategories.map((c) => c._id);
        const combinedCategoryIds = [...objectIds, ...foundIds];

        query.category = { $in: combinedCategoryIds };
      } else if (objectIds.length > 0) {
        query.category = { $in: objectIds };
      }
    }

    
    if (brand) {
      const brandArray = brand.split(',').map((b) => b.trim());
      query.brand = {
        $in: brandArray.map((b) => new RegExp(b, 'i'))
      };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    
    let sortOptions = { createdAt: -1 }; // Default: Newest first

    if (sort === 'price_low_high') {
      sortOptions = { price: 1 };
    } else if (sort === 'price_high_low') {
      sortOptions = { price: -1 };
    } else if (sort === 'a_z') {
      sortOptions = { name: 1 };
    } else if (sort === 'z_a') {
      sortOptions = { name: -1 };
    }

    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 8;
    const skip = (pageNum - 1) * limitNum;

    
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const productOffers = await getApplicableOffers(products);
    const productsWithOffers = products.map((product, index) => ({
      ...product.toObject(),
      offer: productOffers[index]
    }));

    const totalProducts = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: productsWithOffers,
      pagination: {
        total: totalProducts,
        page: pageNum,
        totalPages: Math.ceil(totalProducts / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      isDeleted: false,
      isBlocked: false
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};



const getHomePageSections = async (req, res) => {
  try {
    
    const activeCategories = await Category.find({
      isBlocked: false,
      isDeleted: false
    }).select('_id');

    const activeCategoryIds = activeCategories.map((c) => c._id);

    const baseQuery = {
      isBlocked: false,
      isDeleted: false,
      category: { $in: activeCategoryIds }
    };

    
    const trendingNow = await Product.find(baseQuery)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(4);

    
    let featuredProducts = await Product.find({ ...baseQuery, isFeatured: true })
      .populate('category', 'name')
      .limit(4);

    if (featuredProducts.length === 0) {
      featuredProducts = await Product.find(baseQuery)
        .populate('category', 'name')
        .sort({ price: -1 })
        .limit(4);
    }

    
    const handPicked = await Product.aggregate([
      { $match: { isBlocked: false, isDeleted: false, category: { $in: activeCategoryIds } } },
      { $sample: { size: 4 } }
    ]);

    await Product.populate(handPicked, { path: 'category', select: 'name' });

    res.status(200).json({
      success: true,
      data: {
        trendingNow,
        featuredProducts,
        handPicked
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid Product ID format' });
    }

    const product = await Product.findById(id).populate('category', 'name description');

   
    if (!product || product.isDeleted || product.isBlocked || !product.isAvailable) {
      return res.status(404).json({
        success: false,
        redirectToListing: true, // Frontend-ൽ listing-ലേക്ക് redirect ചെയ്യാൻ ഈ flag ഉപകരിക്കും
        message: 'Product is currently unavailable or blocked'
      });
    }

    
    let stockStatus = 'In Stock';
    if (product.stockCount <= 0) {
      stockStatus = 'Out of Stock';
    } else if (product.stockCount <= 5) {
      stockStatus = `Only ${product.stockCount} left in stock!`;
    }

    const applicableOffer = await getApplicableOffer(product._id, product.category?._id, product.price);
    const productOffer = applicableOffer ? {
      name: applicableOffer.name,
      description: applicableOffer.description,
      discountType: applicableOffer.discountType,
      discountValue: applicableOffer.discountValue,
      maxDiscount: applicableOffer.maxDiscount,
      expiryDate: applicableOffer.expiryDate
    } : null;

    res.status(200).json({
      success: true,
      data: {
        ...product._doc,
        offer: productOffer,
        stockStatus,
        isOutOfStock: product.stockCount <= 0,
        // Breadcrumbs formatting for frontend
        breadcrumbs: [
          { name: 'Home', url: '/' },
          { name: 'Products', url: '/products' },
          { name: product.category?.name || 'Category', url: `/products?category=${product.category?._id}` },
          { name: product.name, url: `/products/${product._id}` }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;

    const currentProduct = await Product.findById(id);
    if (!currentProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    
    const relatedProducts = await Product.find({
      category: currentProduct.category,
      _id: { $ne: id },
      isDeleted: false,
      isBlocked: false,
      isAvailable: true
    })
      .populate('category', 'name')
      .limit(4); // 4 Recommendations

    res.status(200).json({
      success: true,
      data: relatedProducts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};





const addToCart = async (req, res) => {
  try {
   
    const userId = req.user?._id || req.user?.id || req.body?.userId;
    const { productId, quantity = 1 } = req.body;

    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication failed. Please log in again.' 
      });
    }

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    
    const product = await Product.findById(productId);

    if (!product || product.isDeleted || product.isBlocked || !product.isAvailable) {
      return res.status(400).json({ success: false, message: 'Product is unavailable or blocked' });
    }

    if (product.stockCount <= 0) {
      return res.status(400).json({ success: false, message: 'Product is out of stock' });
    }

   
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

   
    const itemIndex = cart.items.findIndex(
      (item) => item.productId && item.productId.toString() === productId.toString()
    );

    if (itemIndex > -1) {
      let newQuantity = cart.items[itemIndex].quantity + Number(quantity);

      if (product.maxQuantityLimit && newQuantity > product.maxQuantityLimit) {
        return res.status(400).json({
          success: false,
          message: `Maximum quantity limit is ${product.maxQuantityLimit}`
        });
      }

      if (newQuantity > product.stockCount) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stockCount} items available in stock`
        });
      }

      cart.items[itemIndex].quantity = newQuantity;
    } else {
      if (product.maxQuantityLimit && quantity > product.maxQuantityLimit) {
        return res.status(400).json({
          success: false,
          message: `Maximum quantity limit is ${product.maxQuantityLimit}`
        });
      }

      if (quantity > product.stockCount) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stockCount} items in stock`
        });
      }

      cart.items.push({ productId, quantity: Number(quantity) });
    }

    
    await cart.save();

    
    await Wishlist.findOneAndUpdate(
      { userId },
      { $pull: { products: productId } }
    );

    return res.status(200).json({ 
      success: true, 
      message: 'Product added to cart and removed from wishlist', 
      data: cart 
    });
  } catch (error) {
    console.error('Add to Cart Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCart = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;

    const cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      populate: { path: 'category', select: 'name' }
    });

    if (!cart) {
      return res.status(200).json({ success: true, data: { items: [], checkoutAllowed: true } });
    }

    let checkoutAllowed = true;

    const processedItems = cart.items.map(item => {
      const prod = item.productId;
      let isItemValid = true;
      let statusMessage = 'Available';

      if (!prod || prod.isDeleted || prod.isBlocked || !prod.isAvailable) {
        isItemValid = false;
        checkoutAllowed = false;
        statusMessage = 'Product Unavailable';
      } else if (prod.stockCount <= 0) {
        isItemValid = false;
        checkoutAllowed = false;
        statusMessage = 'Out of Stock';
      } else if (item.quantity > prod.stockCount) {
        checkoutAllowed = false;
        statusMessage = `Only ${prod.stockCount} left`;
      }

      return {
        _id: item._id,
        product: prod,
        quantity: item.quantity,
        isItemValid,
        statusMessage
      };
    });

    res.status(200).json({
      success: true,
      data: {
        items: processedItems,
        checkoutAllowed
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { productId, action } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const item = cart.items.find(i => i.productId.toString() === productId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not in cart' });

    const product = await Product.findById(productId);

    if (action === 'inc') {
      if (item.quantity + 1 > product.maxQuantityLimit) {
        return res.status(400).json({ success: false, message: `Max limit is ${product.maxQuantityLimit}` });
      }
      if (item.quantity + 1 > product.stockCount) {
        return res.status(400).json({ success: false, message: 'Exceeds available stock' });
      }
      item.quantity += 1;
    } else if (action === 'dec') {
      if (item.quantity > 1) {
        item.quantity -= 1;
      } else {
        cart.items = cart.items.filter(i => i.productId.toString() !== productId);
      }
    }

    await cart.save();
    res.status(200).json({ success: true, message: 'Cart updated', data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const removeFromCart = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    await cart.save();

    res.status(200).json({ success: true, message: 'Product removed from cart' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getWishlist = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    
    let wishlist = await Wishlist.findOne({ userId }).populate('products');

    if (!wishlist) {
      return res.status(200).json({ success: true, products: [] });
    }

    
    res.status(200).json({ 
      success: true, 
      products: wishlist.products || [] 
    });
  } catch (error) {
    console.error('Get Wishlist Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 2. Toggle Wishlist (Add / Remove)
const toggleWishlist = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id; 
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid Product ID format' });
    }

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
     
      wishlist = new Wishlist({
        userId: userId,
        products: [productId]
      });
    } else {
     
      const productIndex = wishlist.products.findIndex(
        (id) => id.toString() === productId.toString()
      );

      if (productIndex > -1) {
        
        wishlist.products.splice(productIndex, 1);
      } else {
       
        wishlist.products.push(productId);
      }
    }

    await wishlist.save();
    
    
    await wishlist.populate('products');

    res.status(200).json({ 
      success: true, 
      message: 'Wishlist updated successfully', 
      products: wishlist.products 
    });
  } catch (error) {
    console.error('Wishlist Toggle Error:', error);
    res.status(500).json({ message: error.message });
  }
};


const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { productId } = req.params;

    const wishlist = await Wishlist.findOneAndUpdate(
      { userId },
      { $pull: { products: productId } },
      { new: true }
    ).populate('products');

    res.status(200).json({ 
      success: true, 
      message: 'Removed from wishlist', 
      products: wishlist ? wishlist.products : [] 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getWallet = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId).select('walletBalance walletTransactions');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      walletBalance: Number(user.walletBalance || 0),
      walletTransactions: user.walletTransactions || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wallet', error: error.message });
  }
};

const addMoneyToWallet = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const amount = Number(req.body.amount || 0);

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.walletBalance = Number(user.walletBalance || 0) + amount;
    user.walletTransactions.unshift({
      type: 'credit',
      amount,
      reason: 'Wallet top-up',
      orderId: req.body.orderId || '',
      createdAt: new Date()
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Wallet topped up successfully',
      walletBalance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding money to wallet', error: error.message });
  }
};

const useWalletForOrder = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const amount = Number(req.body.amount || 0);

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid order amount is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (Number(user.walletBalance || 0) < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    user.walletBalance = Number(user.walletBalance || 0) - amount;
    user.walletTransactions.unshift({
      type: 'debit',
      amount,
      reason: 'Order payment',
      orderId: req.body.orderId || '',
      createdAt: new Date()
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Wallet debited successfully',
      walletBalance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({ message: 'Error using wallet for order', error: error.message });
  }
};


module.exports = { 
  signup,
  login, 
  verifyOTP, 
  resendOTP, 
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
  sendEmailOTP,     
  verifyEmailOTP,
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
  updateCartQuantity,
  removeFromCart,
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
  getWallet,
  addMoneyToWallet,
  useWalletForOrder
};