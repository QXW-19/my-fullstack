import request from '@/utils/request';

export const getFriendList = () => request.get('/pet-friend/list');
export const getFriendPet = (petId) => request.get(`/pet-friend/${petId}`);
export const helpFriendPet = (petId, action, message) =>
  request.post(`/pet-friend/${petId}/help`, { action, message });
export const messageFriendPet = (petId, message) =>
  request.post(`/pet-friend/${petId}/message`, { message });
export const getMyVisitors = () => request.get('/pet-friend/my/visitors');
export const getHelperRank = () => request.get('/pet-friend/rank/helpers');
