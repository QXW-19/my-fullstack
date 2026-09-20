import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as userApi from '@/api/user';

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '');
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'));

  function save(tokenVal, user) {
    token.value = tokenVal;
    userInfo.value = user;
    localStorage.setItem('token', tokenVal);
    localStorage.setItem('userInfo', JSON.stringify(user));
  }

  async function login(form) {
    const { token: t, user } = await userApi.login(form);
    save(t, user);
  }

  async function register(form) {
    const { token: t, user } = await userApi.register(form);
    save(t, user);
  }

  function logout() {
    token.value = '';
    userInfo.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
  }

  function updateAvatar(url) {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, avatar: url };
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value));
    }
  }

  return { token, userInfo, login, register, logout, updateAvatar };
});
