const errorHandler = (err, req, res, next) => {
  console.error('Error Stack:', err.stack);

  
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `File Upload Error: ${err.message}`
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;