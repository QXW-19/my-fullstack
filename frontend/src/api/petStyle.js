import request from '@/utils/request';

export const getTones = () => request.get('/pet-style/tones');
export const getSkins = () => request.get('/pet-style/skins');
export const updateTone = (tone) => request.put('/pet-style/tone', { tone });
export const updateSkin = (skin) => request.put('/pet-style/skin', { skin });
