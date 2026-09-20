import request from '@/utils/request';

export const getDecorationList = () => request.get('/pet-decoration/list');
export const buyDecoration = (decorationId) => request.post('/pet-decoration/buy', { decorationId });
export const toggleDecoration = (ownedId) => request.post('/pet-decoration/toggle', { ownedId });
export const getMyDecorations = () => request.get('/pet-decoration/my');
