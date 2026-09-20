import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
});

// 请求拦截：自动带 token
request.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// 响应拦截：统一处理 code
request.interceptors.response.use(
  res => {
    const { code, msg, data } = res.data;
    if (code === 0) return data;
    if (code === 401) {
      localStorage.removeItem('token');
      router.push('/login');
    }
    ElMessage.error(msg || '请求失败');
    return Promise.reject(new Error(msg));
  },
  err => {
    ElMessage.error(err.message || '网络错误');
    return Promise.reject(err);
  }
);

export default request;
