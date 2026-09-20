import request from '@/utils/request';

export const getNotifications = (params) => request.get('/notification', { params });
export const getUnreadCount = () => request.get('/notification/unread-count');
export const markRead = (id) => request.put(`/notification/${id}/read`);
export const markAllRead = () => request.put('/notification/read-all');
export const deleteNotification = (id) => request.delete(`/notification/${id}`);
