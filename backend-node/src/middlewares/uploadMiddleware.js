const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  },
});

const ALLOWED = /jpeg|jpg|png|webp|mp4|mov/;

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for short room videos
  fileFilter: (_req, file, cb) => {
    const ok = ALLOWED.test(path.extname(file.originalname).toLowerCase());
    if (!ok) return cb(new Error('Only images (jpg/png/webp) and videos (mp4/mov) are allowed'));
    cb(null, true);
  },
});

module.exports = { uploadMiddleware, uploadDir };
