const multer = require('multer');
const path = require('path');
const fs = require('fs');

const baseDir = path.join(__dirname, '../../uploads');
['avatars', 'covers', 'chat'].forEach(d => {
  const dir = path.join(baseDir, d);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function makeFilename(prefix) {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, filename);
  };
}

const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('只支持 jpg/png/gif/webp'));
};

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: path.join(baseDir, 'avatars'),
    filename: makeFilename('avatar')
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: imageFilter
});

const coverUpload = multer({
  storage: multer.diskStorage({
    destination: path.join(baseDir, 'covers'),
    filename: makeFilename('cover')
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: imageFilter
});

const chatUpload = multer({
  storage: multer.diskStorage({
    destination: path.join(baseDir, 'chat'),
    filename: makeFilename('chat')
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: imageFilter
});

module.exports = { avatarUpload, coverUpload, chatUpload };
