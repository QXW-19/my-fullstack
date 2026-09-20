import request from '@/utils/request';

export const getMessages = (params) => request.get('/message', { params });
export const postMessage = (data) => request.post('/message', data);
export const deleteMessage = (id) => request.delete(`/message/${id}`);
export const likeMessage = (id) => request.post(`/message/${id}/like`);
