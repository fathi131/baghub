require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');


const errorHandler = require('./middlewares/errorHandler');

const app = express();


connectDB();


app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


const adminRoutes = require('./routes/adminRoutes');
const userAuthRoutes = require('./routes/userAuthRoutes');
const reviewRoutes = require('./routes/reviewRoutes');  
const razorpayRoutes = require('./routes/razorpayRoutes');   

app.use('/api/admin', adminRoutes);
app.use('/api/user', userAuthRoutes);
app.use('/api/reviews', reviewRoutes); 
app.use('/api/razorpay', razorpayRoutes); 


app.use(errorHandler);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});