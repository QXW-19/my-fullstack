const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const redis = require('./config/redis');
const { User, Conversation, ChatMessage } = require('./models');

const onlineUsers = new Map();

function addOnline(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
}
function removeOnline(userId, socketId) {
  const set = onlineUsers.get(userId);
  if (set) {
    set.delete(socketId);
    if (set.size === 0) onlineUsers.delete(userId);
  }
}

function initSocket(server) {
  const io = new Server(server, { cors: { origin: '*', credentials: true } });

  const { setIo } = require('./services/notification');
  setIo(io);

  // JWT 鉴权
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('未登录'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('token 失效'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`🟢 用户上线: ${userId} (${socket.id})`);

    addOnline(userId, socket.id);
    await redis.set(`online:${userId}`, '1', 'EX', 120);
    socket.broadcast.emit('user:online', { userId });

    // ========== 心跳 ==========
    socket.on('ping', async () => {
      await redis.set(`online:${userId}`, '1', 'EX', 120);
      socket.emit('pong');
    });

    // ========== 发消息（文本 / 图片）==========
    socket.on('message:send', async (data, callback) => {
      try {
        const { to, content, type = 0 } = data;
        if (!to || !content) return callback?.({ ok: false, msg: '参数错误' });

        const [u1, u2] = [userId, +to].sort((a, b) => a - b);
        const [conv] = await Conversation.findOrCreate({
          where: { user1_id: u1, user2_id: u2 }
        });

        const msg = await ChatMessage.create({
          conversation_id: conv.id,
          from_id: userId,
          to_id: +to,
          type,           // ⭐ 0文本 1图片
          content
        });

        await conv.update({
          last_message: type === 1 ? '[图片]' : content.slice(0, 100),
          last_time: new Date()
        });

        const payload = {
          id: msg.id,
          conversationId: conv.id,
          from_id: userId,
          to_id: +to,
          type,
          content,
          status: 0,
          is_read: 0,
          createdAt: msg.createdAt
        };

        // 推给接收者
        const receiverSockets = onlineUsers.get(+to);
        if (receiverSockets) {
          receiverSockets.forEach(sid => io.to(sid).emit('message:new', payload));
          // ⭐ 对方在线，标记为已送达
          await msg.update({ is_read: 0 }); // 已送达但未读
        } else {
          await redis.incr(`unread:${to}:${userId}`);
        }

        // 多端同步
        const selfSockets = onlineUsers.get(userId);
        if (selfSockets) {
          selfSockets.forEach(sid => {
            if (sid !== socket.id) io.to(sid).emit('message:new', payload);
          });
        }

        // 站内信通知
        const { createNotification } = require('./services/notification');
        const sender = await User.findByPk(userId, { attributes: ['username'] });
        createNotification({
          userId: +to,
          fromUserId: userId,
          type: 'chat_message',
          title: `${sender?.username || '有人'} 发来消息`,
          content: type === 1 ? '[图片]' : content.slice(0, 50),
          link: '/chat'
        }).catch(() => {});

        callback?.({ ok: true, data: payload });
      } catch (err) {
        console.error('发送消息错误:', err);
        callback?.({ ok: false, msg: err.message });
      }
    });

    // ========== ⭐ 撤回消息（2 分钟内）==========
    socket.on('message:recall', async ({ messageId }, callback) => {
      try {
        const msg = await ChatMessage.findByPk(messageId);
        if (!msg) return callback?.({ ok: false, msg: '消息不存在' });
        if (msg.from_id !== userId) return callback?.({ ok: false, msg: '无权撤回' });

        // 2 分钟限制
        const diff = (Date.now() - new Date(msg.createdAt).getTime()) / 1000;
        if (diff > 120) return callback?.({ ok: false, msg: '超过 2 分钟，无法撤回' });

        await msg.update({ status: 1, content: '' });

        // 通知双方撤回
        const payload = { messageId: msg.id, conversationId: msg.conversation_id };

        [msg.from_id, msg.to_id].forEach(uid => {
          const sockets = onlineUsers.get(uid);
          sockets?.forEach(sid => io.to(sid).emit('message:recalled', payload));
        });

        callback?.({ ok: true });
      } catch (err) {
        callback?.({ ok: false, msg: err.message });
      }
    });

    // ========== ⭐ 正在输入 ==========
    socket.on('message:typing', ({ to, typing }) => {
      const receiverSockets = onlineUsers.get(+to);
      receiverSockets?.forEach(sid => {
        io.to(sid).emit('message:typing', { from: userId, typing });
      });
    });

    // ========== 已读 ==========
    socket.on('message:read', async ({ from }) => {
      if (!from) return;
      await redis.del(`unread:${userId}:${from}`);
      await ChatMessage.update(
        { is_read: 1 },
        { where: { from_id: +from, to_id: userId, is_read: 0 } }
      );
    });

    socket.on('disconnect', async () => {
      console.log(`🔴 用户下线: ${userId} (${socket.id})`);
      removeOnline(userId, socket.id);
      if (!onlineUsers.has(userId)) {
        await redis.del(`online:${userId}`);
        io.emit('user:offline', { userId });
      }
    });
  });

  return io;
}

module.exports = { initSocket, onlineUsers };
