<template>
  <div class="msg-item" :class="{ reply: isReply }">
    <div class="msg-avatar">
      <img v-if="message.user?.avatar" :src="message.user.avatar" alt="" />
      <span v-else>{{ message.user?.username?.[0]?.toUpperCase() || '?' }}</span>
    </div>

    <div class="msg-body">
      <div class="msg-head">
        <span class="msg-name">{{ message.user?.username || '匿名' }}</span>
        <span class="msg-time">{{ formatTime(message.createdAt) }}</span>
      </div>

      <div class="msg-content">{{ message.content }}</div>

      <div class="msg-actions">
        <button class="action-btn" :class="{ liked: message.liked }" @click="onLike">
          <span>👍</span>
          <span v-if="message.like_count > 0">{{ message.like_count }}</span>
        </button>
        <button class="action-btn" @click="showReply = !showReply">
          💬 回复
        </button>
        <button
          v-if="message.user_id === userStore.userInfo?.id"
          class="action-btn danger"
          @click="onDelete"
        >
          删除
        </button>
      </div>

      <transition name="slide">
        <div v-if="showReply" class="reply-box">
          <input
            v-model="replyContent"
            placeholder="回复..."
            maxlength="500"
            @keyup.enter="onReply"
          />
          <button class="reply-send" :disabled="!replyContent.trim()" @click="onReply">发送</button>
        </div>
      </transition>

      <div v-if="message.children?.length" class="children">
        <MessageItem
          v-for="child in message.children"
          :key="child.id"
          :message="child"
          :is-reply="true"
          @refresh="$emit('refresh')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { likeMessage, postMessage, deleteMessage } from '@/api/message';

const props = defineProps({
  message: { type: Object, required: true },
  isReply: { type: Boolean, default: false }
});
const emit = defineEmits(['refresh']);

const userStore = useUserStore();
const showReply = ref(false);
const replyContent = ref('');

function formatTime(t) {
  if (!t) return '';
  const d = new Date(t);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return d.toLocaleDateString('zh-CN');
}

async function onLike() {
  try {
    const data = await likeMessage(props.message.id);
    props.message.like_count += data.liked ? 1 : -1;
    props.message.liked = data.liked;
  } catch (e) {}
}

async function onReply() {
  if (!replyContent.value.trim()) return;
  try {
    await postMessage({ content: replyContent.value, parent_id: props.message.id });
    ElMessage.success('回复成功');
    replyContent.value = '';
    showReply.value = false;
    emit('refresh');
  } catch (e) {}
}

async function onDelete() {
  try {
    await ElMessageBox.confirm('确定删除这条留言？', '提示', { type: 'warning' });
    await deleteMessage(props.message.id);
    ElMessage.success('删除成功');
    emit('refresh');
  } catch (e) {}
}
</script>

<style scoped>
.msg-item {
  display: flex;
  gap: 14px;
  padding: 20px 0;
}
.msg-item.reply {
  padding: 12px 0;
}

.msg-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-weight: 600;
  font-size: 15px;
}
.msg-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.reply .msg-avatar {
  width: 32px;
  height: 32px;
  font-size: 13px;
}

.msg-body { flex: 1; min-width: 0; }

.msg-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.msg-name {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
}
.reply .msg-name { font-size: 13px; }

.msg-time {
  font-size: 12px;
  color: #86868b;
}

.msg-content {
  font-size: 15px;
  color: #1d1d1f;
  line-height: 1.6;
  word-break: break-word;
  margin-bottom: 10px;
}
.reply .msg-content { font-size: 14px; }

.msg-actions {
  display: flex;
  gap: 8px;
}
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #86868b;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.action-btn:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #1d1d1f;
}
.action-btn.liked {
  color: #ff3b30;
  background: rgba(255, 59, 48, 0.08);
}
.action-btn.danger:hover {
  background: rgba(255, 59, 48, 0.08);
  color: #ff3b30;
}

.reply-box {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.reply-box input {
  flex: 1;
  padding: 8px 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  font-size: 14px;
  outline: none;
  background: #fff;
  font-family: inherit;
  transition: all 0.2s;
}
.reply-box input:focus {
  border-color: #0071e3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.08);
}
.reply-send {
  padding: 8px 20px;
  border-radius: 999px;
  border: none;
  background: #0071e3;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  font-weight: 500;
}
.reply-send:hover:not(:disabled) { background: #0077ed; }
.reply-send:disabled {
  background: #e5e5ea;
  color: #a1a1a6;
  cursor: not-allowed;
}

.children {
  margin-top: 12px;
  padding-left: 16px;
  border-left: 2px solid rgba(0, 0, 0, 0.06);
}

.slide-enter-active, .slide-leave-active {
  transition: all 0.25s;
}
.slide-enter-from, .slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
