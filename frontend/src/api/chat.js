import request from '@/utils/request';

export const getChatUsers = () => request.get('/chat/users');
export const getMessages = (userId, params) => request.get(`/chat/messages/${userId}`, { params });
