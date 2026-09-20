const router = require('express').Router();
const { Notification, User } = require('../models');
const { success, fail } = require('../utils/response');
const auth = require('../middlewares/auth');
const redis = require('../config/redis');

router.use(auth);

// 未读数（从 Redis 拿，O(1)）
router.get('/unread-count', async (req, res) => {
  try {
    const count = await redis.get(`unread:notify:${req.user.id}`);
    success(res, { count: +(count || 0) });
  } catch (e) {
    fail(res, e.message);
  }
});

// 通知列表（分页 + 筛选）
router.get('/', async (req, res) => {
  try {
    const { page = 1, size = 20, onlyUnread } = req.query;

    const where = { user_id: req.user.id };
    if (onlyUnread === '1') where.is_read = 0;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      include: [{ model: User, as: 'fromUser', attributes: ['id', 'username', 'avatar'] }],
      order: [['created_at', 'DESC']],
      limit: +size,
      offset: (+page - 1) * +size
    });

    success(res, { list: rows, total: count, page: +page, size: +size });
  } catch (e) {
    fail(res, e.message);
  }
});

// 标记单条已读
router.put('/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!notif) return fail(res, '通知不存在');
    if (notif.is_read === 1) return success(res, null, '已读');

    await notif.update({ is_read: 1 });
    await redis.decr(`unread:notify:${req.user.id}`);
    success(res, null, '已读');
  } catch (e) {
    fail(res, e.message);
  }
});

// 全部已读
router.put('/read-all', async (req, res) => {
  try {
    await Notification.update(
      { is_read: 1 },
      { where: { user_id: req.user.id, is_read: 0 } }
    );
    await redis.set(`unread:notify:${req.user.id}`, 0);
    success(res, null, '全部已读');
  } catch (e) {
    fail(res, e.message);
  }
});

// 删除通知
router.delete('/:id', async (req, res) => {
  try {
    const notif = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!notif) return fail(res, '通知不存在');

    if (notif.is_read === 0) {
      await redis.decr(`unread:notify:${req.user.id}`);
    }
    await notif.destroy();
    success(res, null, '删除成功');
  } catch (e) {
    fail(res, e.message);
  }
});

module.exports = router;
