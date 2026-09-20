import request from '@/utils/request';

export const register = (data) => request.post('/user/register', data);
export const login = (data) => request.post('/user/login', data);
export const getUserInfo = () => request.get('/user/info');

// ⭐ 邮箱相关
export const getEmail = () => request.get('/user/email');
export const updateEmail = (data) => request.put('/user/email', data);
export const sendTestEmail = () => request.post('/user/email/test');
