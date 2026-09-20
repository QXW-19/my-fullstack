import request from '@/utils/request';

export const getTodos = (params) => request.get('/todo', { params });
export const createTodo = (data) => request.post('/todo', data);
export const updateTodo = (id, data) => request.put(`/todo/${id}`, data);
export const toggleStatus = (id, status) => request.patch(`/todo/${id}/status`, { status });
export const deleteTodo = (id) => request.delete(`/todo/${id}`);
export const sortTodos = (items) => request.put('/todo/sort/batch', { items });
