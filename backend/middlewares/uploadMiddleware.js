const multer = require('multer');
const path = require('path');
const fs = require('fs');


const uploadDir = path.join(__dirname, '../public/uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed!'), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB per file
  fileFilter
});

const profileUploadDir = path.join(__dirname, '../public/uploads/profiles');
if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}

const profileImageUpload = multer({
  storage: multer.diskStorage({
    destination: profileUploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

const bannerUploadDir = path.join(__dirname, '../public/uploads/banners');
if (!fs.existsSync(bannerUploadDir)) {
  fs.mkdirSync(bannerUploadDir, { recursive: true });
}

const bannerImageUpload = multer({
  storage: multer.diskStorage({
    destination: bannerUploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

module.exports = upload;
module.exports.profileImageUpload = profileImageUpload;
module.exports.bannerImageUpload = bannerImageUpload;