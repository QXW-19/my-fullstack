const router = require('express').Router();
const { Op } = require('sequelize');
const { User, Conversation, ChatMessage } = require('../models');
const { success, fail } = require('../utils/response');
const auth = require('../middlewares/auth');
const redis = require('../config/redis');

router.use(auth);

router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      where: { id: { [Op.ne]: req.user.id } },
      attributes: ['id', 'username', 'avatar']
    });

    const pipe = redis.pipeline();
    users.forEach(u => pipe.exists(`online:${u.id}`));
    users.forEach(u => pipe.get(`unread:${req.user.id}:${u.id}`));
    const results = await pipe.exec();

    const n = users.length;
    const data = users.map((u, i) => ({
      ...u.toJSON(),
      online: results[i][1] === 1,
      unread: +(results[n + i][1] || 0)
    }));

    data.sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0));
    success(res, data);
  } catch (e) {
    fail(res, e.message);
  }
});

router.get('/messages/:userId', async (req, res) => {
  try {
    const myId = req.user.id;
    const otherId = +req.params.userId;
    const { before, size = 30 } = req.query;

    if (otherId === myId) return fail(res, '不能和自己聊天');
    if (!await User.findByPk(otherId)) return fail(res, '用户不存在');

    const [u1, u2] = [myId, otherId].sort((a, b) => a - b);
    const [conv] = await Conversation.findOrCreate({
      where: { user1_id: u1, user2_id: u2 }
    });

    const where = { conversation_id: conv.id };
    if (before) where.id = { [Op.lt]: before };

    const list = await ChatMessage.findAll({
      where,
      order: [['id', 'DESC']],
      limit: +size
    });

    await redis.del(`unread:${myId}:${otherId}`);
    await ChatMessage.update(
      { is_read: 1 },
      { where: { conversation_id: conv.id, to_id: myId, is_read: 0 } }
    );

    success(res, { conversationId: conv.id, list: list.reverse() });
  } catch (e) {
    fail(res, e.message);
  }
});

module.exports = router;
