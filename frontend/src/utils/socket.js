import { io } from 'socket.io-client';

let socket = null;

export function connectSocket() {
  if (socket?.connected) return socket;

  const token = localStorage.getItem('token');
  if (!token) return null;

  socket = io({
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => console.log('✅ Socket 已连接'));

  // ⭐ 全局监听通知
  socket.on('notification:new', (notif) => {
    console.log('📬 收到通知:', notif);
    import('@/stores/notification').then(({ useNotificationStore }) => {
      useNotificationStore().increment();
    });
  });
  socket.on('connect_error', (err) => console.error('❌ Socket 连接失败:', err.message));
  socket.on('disconnect', (reason) => console.log('🔴 Socket 断开:', reason));

  const heartbeat = setInterval(() => {
    if (socket?.connected) socket.emit('ping');
  }, 60000);

  socket.on('disconnect', () => clearInterval(heartbeat));

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
