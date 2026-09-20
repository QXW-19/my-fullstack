const router = require('express').Router();

router.get('/hello', (req, res) => {
  res.json({ code: 0, msg: 'ok', data: 'Hello from Node!' });
});

router.use('/user', require('./user'));
router.use('/message', require('./message'));
router.use('/todo', require('./todo'));
router.use('/article', require('./article'));
router.use('/bill', require('./bill'));
router.use('/bill-category', require('./billCategory'));
router.use('/chat', require('./chat'));
router.use('/notification', require('./notification'));
router.use('/pet', require('./pet'));
router.use('/pet-shop', require('./petShop'));
router.use('/pet-friend', require('./petFriend'));
router.use('/pet-decoration', require('./petDecoration'));
router.use('/pet-chat', require('./petChat'));
router.use('/pet-style', require('./petStyle'));
router.use('/upload', require('./upload'));

module.exports = router;
