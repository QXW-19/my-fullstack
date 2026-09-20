const router = require('express').Router();
const { avatarUpload, coverUpload, chatUpload } = require('../middlewares/upload');
const { User } = require('../models');
const { success, fail } = require('../utils/response');
const auth = require('../middlewares/auth');

router.use(auth);

function publicUrl(type, filename) {
  return `/uploads/${type}/${filename}`;
}

router.post('/avatar', (req, res) => {
  avatarUpload.single('file')(req, res, async (err) => {
    if (err) return fail(res, err.message);
    if (!req.file) return fail(res, '请选择文件');
    try {
      const url = publicUrl('avatars', req.file.filename);
      await User.update({ avatar: url }, { where: { id: req.user.id } });
      success(res, { url }, '上传成功');
    } catch (e) {
      fail(res, e.message);
    }
  });
});

router.post('/cover', (req, res) => {
  coverUpload.single('file')(req, res, (err) => {
    if (err) return fail(res, err.message);
    if (!req.file) return fail(res, '请选择文件');
    success(res, { url: publicUrl('covers', req.file.filename) }, '上传成功');
  });
});

router.post('/chat', (req, res) => {
  chatUpload.single('file')(req, res, (err) => {
    if (err) return fail(res, err.message);
    if (!req.file) return fail(res, '请选择文件');
    success(res, { url: publicUrl('chat', req.file.filename) }, '上传成功');
  });
});

module.exports = router;
