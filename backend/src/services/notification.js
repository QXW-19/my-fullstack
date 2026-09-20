const redis = require('../config/redis');
const { Notification } = require('../models');

let ioRef = null;
function setIo(io) { ioRef = io; }

async function createNotification(opts) {
  const { userId, fromUserId, type, title, content, link } = opts;

  if (userId === fromUserId) return null;

  const notification = await Notification.create({
    user_id: userId,
    from_user_id: fromUserId,
    type, title, content, link
  });

  await redis.incr(`unread:notify:${userId}`);

  if (ioRef) {
    const sockets = ioRef.sockets.sockets;
    for (const [sid, socket] of sockets) {
      if (socket.user?.id === userId) {
        socket.emit('notification:new', {
          id: notification.id,
          type, title, content, link,
          createdAt: notification.createdAt
        });
      }
    }
  }

  return notification;
}

module.exports = { createNotification, setIo };
