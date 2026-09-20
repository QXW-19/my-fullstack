import request from '@/utils/request';

export const getShopItems = (type) => request.get('/pet-shop/items', { params: { type } });
export const buyItem = (itemId, count = 1) => request.post('/pet-shop/buy', { itemId, count });
export const getInventory = () => request.get('/pet-shop/inventory');
export const useItem = (inventoryId) => request.post('/pet-shop/use', { inventoryId });
export const signin = () => request.post('/pet-shop/signin');
export const getCoinLog = () => request.get('/pet-shop/coin-log');
