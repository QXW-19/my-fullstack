<template>
  <el-popover placement="bottom-end" :width="360" trigger="click" @show="onShow">
    <template #reference>
      <el-badge :value="store.unreadCount" :hidden="store.unreadCount === 0" :max="99">
        <el-button text style="font-size: 18px; padding: 6px">🔔</el-button>
      </el-badge>
    </template>

    <div class="notify-panel">
      <div class="panel-header">
        <span>通知</span>
        <el-button link size="small" @click="onMarkAll" :disabled="!list.length">全部已读</el-button>
      </div>

      <div class="notify-list" v-loading="loading">
        <div
          v-for="item in list"
          :key="item.id"
          class="notify-item"
          :class="{ unread: !item.is_read }"
          @click="onClick(item)"
        >
          <div class="notify-icon">{{ getIcon(item.type) }}</div>
          <div class="notify-content">
            <div class="notify-title">{{ item.title }}</div>
            <div class="notify-desc">{{ item.content }}</div>
            <div class="notify-time">{{ formatTime(item.createdAt) }}</div>
          </div>
        </div>
        <el-empty v-if="!loading && !list.length" description="暂无通知" :image-size="60" />
      </div>

      <div class="panel-footer" v-if="total > list.length">
        <el-link @click="$router.push('/notifications')">查看全部</el-link>
      </div>
    </div>
  </el-popover>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useNotificationStore } from '@/stores/notification';
import * as notificationApi from '@/api/notification';

const router = useRouter();
const store = useNotificationStore();

const list = ref([]);
const total = ref(0);
const loading = ref(false);

async function loadList() {
  loading.value = true;
  try {
    const data = await notificationApi.getNotifications({ page: 1, size: 10 });
    list.value = data.list;
    total.value = data.total;
  } catch (e) {}
  loading.value = false;
}

async function onShow() {
  await loadList();
  await store.refreshUnread();
}

async function onClick(item) {
  if (!item.is_read) {
    await notificationApi.markRead(item.id);
    item.is_read = 1;
    store.setCount(store.unreadCount - 1);
  }
  if (item.link) router.push(item.link);
}

async function onMarkAll() {
  await notificationApi.markAllRead();
  list.value.forEach(i => i.is_read = 1);
  store.setCount(0);
  ElMessage.success('已全部标记为已读');
}

function getIcon(type) {
  const icons = {
    message_reply: '💬',
    blog_comment: '📝',
    chat_message: '💭',
    system: '🔔'
  };
  return icons[type] || '🔔';
}

function formatTime(t) {
  const d = new Date(t);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return d.toLocaleDateString('zh-CN');
}

onMounted(() => {
  store.refreshUnread();
});
</script>

<style scoped>
.notify-panel { margin: -12px; }
.panel-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: 600; }
.notify-list { max-height: 400px; overflow-y: auto; }
.notify-item { display: flex; gap: 12px; padding: 12px 16px; cursor: pointer; transition: background 0.2s; border-bottom: 1px solid #f5f5f5; }
.notify-item:hover { background: #f5f7fa; }
.notify-item.unread { background: #f0f9ff; }
.notify-icon { font-size: 24px; flex-shrink: 0; }
.notify-content { flex: 1; min-width: 0; }
.notify-title { font-size: 14px; color: #303133; margin-bottom: 4px; }
.notify-desc { font-size: 13px; color: #909399; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.notify-time { font-size: 12px; color: #c0c4cc; margin-top: 4px; }
.panel-footer { text-align: center; padding: 8px; border-top: 1px solid #eee; }
</style>
