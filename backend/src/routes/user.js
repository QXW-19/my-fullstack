const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sign } = require('../utils/jwt');
const { success, fail } = require('../utils/response');
const auth = require('../middlewares/auth');

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password) return fail(res, '用户名和密码不能为空');

    const exist = await User.findOne({ where: { username } });
    if (exist) return fail(res, '用户名已存在');

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash, email: email || null });

    const token = sign({ id: user.id, username: user.username });
    // ⭐ 发欢迎邮件（异步不阻塞）
    if (email) {
      const mailer = require('../services/mailer');
      mailer.sendWelcomeMail({ to: email, toName: user.username }).catch(() => {});
    }

    success(res, { token, user: { id: user.id, username: user.username } }, '注册成功');
  } catch (e) {
    fail(res, e.message);
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) return fail(res, '账号或密码错误');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return fail(res, '账号或密码错误');

    const token = sign({ id: user.id, username: user.username });
    success(res, { token, user: { id: user.id, username: user.username } }, '登录成功');
  } catch (e) {
    fail(res, e.message);
  }
});

// 获取当前用户信息
router.get('/info', auth, async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: ['id', 'username', 'avatar'] });
  success(res, user);
});

module.exports = router;

// ========== 获取当前邮箱 ==========
router.get('/email', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['email', 'email_notify']
    });
    success(res, {
      email: user.email || '',
      email_notify: user.email_notify === 1
    });
  } catch (e) { fail(res, e.message); }
});

// ========== 更新邮箱 ==========
router.put('/email', auth, async (req, res) => {
  try {
    const { email, email_notify } = req.body;

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(res, '邮箱格式不正确');
    }

    const updateData = {};
    if (email !== undefined) updateData.email = email || null;
    if (email_notify !== undefined) updateData.email_notify = email_notify ? 1 : 0;

    await User.update(updateData, { where: { id: req.user.id } });

    success(res, null, '保存成功');
  } catch (e) { fail(res, e.message); }
});

// ========== 发送测试邮件 ==========
router.post('/email/test', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['username', 'email']
    });

    if (!user.email) return fail(res, '请先保存邮箱');

    const mailer = require('../services/mailer');
    const result = await mailer.sendWelcomeMail({
      to: user.email,
      toName: user.username
    });

    if (result.ok) {
      success(res, null, '测试邮件已发送，请查收');
    } else {
      fail(res, '发送失败：' + result.reason);
    }
  } catch (e) { fail(res, e.message); }
});

module.exports = router;
