import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as todoApi from '@/api/todo';

export const useTodoStore = defineStore('todo', () => {
  const list = ref([]);
  const loading = ref(false);

  // 筛选条件（集中管理）
  const filters = ref({
    status: '',      // '' 全部 | 0 未完成 | 1 已完成
    category: '',
    keyword: '',
    priority: ''
  });

  async function fetchList() {
    loading.value = true;
    try {
      // 过滤空值
      const params = {};
      Object.entries(filters.value).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) params[k] = v;
      });
      list.value = await todoApi.getTodos(params);
    } catch (e) {}
    loading.value = false;
  }

  async function add(data) {
    await todoApi.createTodo(data);
    await fetchList();
  }

  async function toggle(item) {
    // 乐观更新：先改 UI
    const old = item.status;
    item.status = old === 0 ? 1 : 0;
    try {
      await todoApi.toggleStatus(item.id, item.status);
    } catch {
      item.status = old; // 失败回滚
    }
  }

  async function remove(id) {
    await todoApi.deleteTodo(id);
    await fetchList();
  }

  async function sort(items) {
    // 乐观更新：先改本地顺序
    list.value = items;
    const payload = items.map((item, i) => ({ id: item.id, sort_order: items.length - i }));
    await todoApi.sortTodos(payload);
  }

  function resetFilters() {
    filters.value = { status: '', category: '', keyword: '', priority: '' };
    fetchList();
  }

  return { list, loading, filters, fetchList, add, toggle, remove, sort, resetFilters };
});
