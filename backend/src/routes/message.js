const router = require('express').Router();
const { Message, User, MessageLike } = require('../models');
const { success, fail } = require('../utils/response');
const auth = require('../middlewares/auth');
const sequelize = require('../config/db');

// 留言列表（分页 + 树形组装）
router.get('/', async (req, res) => {
  try {
    const page = +req.query.page || 1;
    const size = +req.query.size || 20;
    const { count, rows } = await Message.findAndCountAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }],
      order: [['created_at', 'DESC']],
      limit: size,
      offset: (page - 1) * size
    });

    // 组装树形结构（parent_id = 0 为顶层）
    const all = rows.map(r => r.toJSON());
    const map = {};
    const tree = [];
    all.forEach(m => { map[m.id] = { ...m, children: [] }; });
    all.forEach(m => {
      if (m.parent_id && map[m.parent_id]) {
        map[m.parent_id].children.push(map[m.id]);
      } else {
        tree.push(map[m.id]);
      }
    });

    success(res, { list: tree, total: count, page, size });
  } catch (e) {
    fail(res, e.message);
  }
});

// 发留言/回复
router.post('/', auth, async (req, res) => {
  try {
    const { content, parent_id = 0 } = req.body;
    if (!content?.trim()) return fail(res, '内容不能为空');
    if (content.length > 500) return fail(res, '内容太长');

    const msg = await Message.create({
      user_id: req.user.id,
      content: content.trim(),
      parent_id
    });

    // ⭐ 如果是回复，通知父留言作者
    if (parent_id) {
      const parent = await Message.findByPk(parent_id);
      if (parent && parent.user_id !== req.user.id) {
        const { createNotification } = require('../services/notification');
        await createNotification({
          userId: parent.user_id,
          fromUserId: req.user.id,
          type: 'message_reply',
          title: '有人回复了你的留言',
          content: content.trim().slice(0, 50),
          link: '/board'
        });

        // ⭐ 发邮件通知
        try {
          const { User } = require('../models');
          const mailer = require('../services/mailer');
          const [fromUser, toUser] = await Promise.all([
            User.findByPk(req.user.id, { attributes: ['username'] }),
            User.findByPk(parent.user_id, { attributes: ['username', 'email', 'email_notify'] })
          ]);
          if (toUser?.email && toUser.email_notify === 1) {
            mailer.sendReplyNotification({
              to: toUser.email,
              toName: toUser.username,
              fromName: fromUser?.username || '有人',
              content: content.trim().slice(0, 100),
              link: 'http://101.37.234.235:8080/board'
            }).catch(() => {});
          }
        } catch (e) {}
      }
    }

    success(res, msg, '发布成功');
  } catch (e) {
    fail(res, e.message);
  }
});

// 删除自己的留言
router.delete('/:id', auth, async (req, res) => {
  try {
    const msg = await Message.findByPk(req.params.id);
    if (!msg) return fail(res, '留言不存在');
    if (msg.user_id !== req.user.id) return fail(res, '无权删除');
    await msg.destroy();
    success(res, null, '删除成功');
  } catch (e) {
    fail(res, e.message);
  }
});

// 点赞 / 取消点赞
router.post('/:id/like', auth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const msgId = +req.params.id;
    const userId = req.user.id;

    const exist = await MessageLike.findOne({
      where: { message_id: msgId, user_id: userId },
      transaction: t
    });

    if (exist) {
      // 取消点赞
      await exist.destroy({ transaction: t });
      await Message.decrement('like_count', { where: { id: msgId }, transaction: t });
      await t.commit();
      return success(res, { liked: false }, '已取消');
    } else {
      // 点赞
      await MessageLike.create({ message_id: msgId, user_id: userId }, { transaction: t });
      await Message.increment('like_count', { where: { id: msgId }, transaction: t });
      await t.commit();
      return success(res, { liked: true }, '点赞成功');
    }
  } catch (e) {
    await t.rollback();
    fail(res, e.message);
  }
});

module.exports = router;
