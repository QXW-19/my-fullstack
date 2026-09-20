import request from '@/utils/request';

export const sendChat = (message) => request.post('/pet-chat/send', { message });
export const getChatHistory = () => request.get('/pet-chat/history');
export const clearChatHistory = () => request.delete('/pet-chat/history');
