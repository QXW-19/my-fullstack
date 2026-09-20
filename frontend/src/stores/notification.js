import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as notificationApi from '@/api/notification';

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0);

  async function refreshUnread() {
    try {
      const { count } = await notificationApi.getUnreadCount();
      unreadCount.value = count;
    } catch (e) {}
  }

  function increment() { unreadCount.value++; }
  function setCount(n) { unreadCount.value = Math.max(0, n); }

  return { unreadCount, refreshUnread, increment, setCount };
});
