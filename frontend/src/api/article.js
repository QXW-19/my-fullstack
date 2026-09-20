import request from '@/utils/request';

export const getArticles = (params) => request.get('/article', { params });
export const getArticle = (id) => request.get(`/article/${id}`);
export const createArticle = (data) => request.post('/article', data);
export const updateArticle = (id, data) => request.put(`/article/${id}`, data);
export const deleteArticle = (id) => request.delete(`/article/${id}`);
export const getTags = () => request.get('/article/meta/tags');
