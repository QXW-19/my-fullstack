import request from '@/utils/request';

export const getDiaries = () => request.get('/pet/diaries');
export const generateDiary = () => request.post('/pet/diaries/generate');
