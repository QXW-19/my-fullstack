import request from '@/utils/request';

export const getBills = (params) => request.get('/bill', { params });
export const createBill = (data) => request.post('/bill', data);
export const updateBill = (id, data) => request.put(`/bill/${id}`, data);
export const deleteBill = (id) => request.delete(`/bill/${id}`);

export const getOverview = (month) => request.get('/bill/stats/overview', { params: { month } });
export const getCategoryStats = (month, type) => request.get('/bill/stats/category', { params: { month, type } });
export const getTrend = (months) => request.get('/bill/stats/trend', { params: { months } });

export const getCategories = () => request.get('/bill-category');
export const createCategory = (data) => request.post('/bill-category', data);
export const deleteCategory = (id) => request.delete(`/bill-category/${id}`);
