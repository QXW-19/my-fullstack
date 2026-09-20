<template>
  <div class="chat-page">
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <button class="nav-back" @click="$router.push('/pet')">←</button>
          <div class="pet-avatar-small">{{ petEmoji }}</div>
          <div class="brand-info">
            <div class="brand-name">{{ petName }}</div>
            <div class="brand-status">{{ petStatus }}</div>
          </div>
        </div>
        <div class="nav-actions">
          <button class="icon-btn" @click="onClear" title="清空对话">🗑</button>
          <NotificationBell />
        </div>
      </div>
    </nav>

    <main class="chat-main">
      <div class="messages" ref="messagesEl" v-loading="loading">
        <div v-if="!messages.length && !loading" class="empty-chat">
          <div class="empty-emoji">{{ petEmoji }}</div>
          <div class="empty-title">和 {{ petName }} 说说话吧</div>
          <div class="empty-desc">它已经等你好久啦～</div>
        </div>

        <div
          v-for="(m, i) in messages"
          :key="i"
          class="message-row"
          :class="{ mine: m.role === 'user' }"
        >
          <div class="avatar" :class="m.role === 'user' ? 'user-avatar' : 'pet-avatar'">
            <template v-if="m.role === 'user'">
              <img v-if="userStore.userInfo?.avatar" :src="userStore.userInfo.avatar" alt="" />
              <span v-else>{{ userStore.userInfo?.username?.[0]?.toUpperCase() }}</span>
            </template>
            <template v-else>
              {{ petEmoji }}
            </template>
          </div>
          <div class="bubble-wrap">
            <div class="bubble">{{ m.content }}</div>
            <div class="time">{{ formatTime(m.created_at) }}</div>
          </div>
        </div>

        <!-- 正在思考动画 -->
        <div v-if="thinking" class="message-row">
          <div class="avatar pet-avatar">{{ petEmoji }}</div>
          <div class="bubble-wrap">
            <div class="bubble thinking-bubble">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷回复 -->
      <div class="quick-replies" v-if="!messages.length && !loading">
        <button
          v-for="q in quickReplies"
          :key="q"
          class="quick-btn"
          @click="onQuickReply(q)"
        >
          {{ q }}
        </button>
      </div>

      <!-- 输入框 -->
      <div class="input-area">
        <textarea
          v-model="inputText"
          placeholder="说点什么..."
          rows="1"
          maxlength="200"
          @keydown.enter.exact.prevent="onSend"
          @input="autoResize"
          ref="textareaEl"
        ></textarea>
        <button
          class="send-btn"
          :disabled="!inputText.trim() || sending"
          @click="onSend"
        >
          <span v-if="sending">···</span>
          <span v-else>发送</span>
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { getPet } from '@/api/pet';
import { sendChat, getChatHistory, clearChatHistory } from '@/api/petChat';
import NotificationBell from '@/components/NotificationBell.vue';

const userStore = useUserStore();

const messages = ref([]);
const inputText = ref('');
const loading = ref(false);
const sending = ref(false);
const thinking = ref(false);
const messagesEl = ref(null);
const textareaEl = ref(null);

const pet = ref(null);

const petEmoji = computed(() => pet.value?.speciesInfo?.emoji || '🐱');
const petName = computed(() => pet.value?.name || '宠物');
const petStatus = computed(() => {
  if (!pet.value) return '';
  if (pet.value.stage === 'dead') return '💀 已离开';
  if (pet.value.stage === 'sick') return '🤒 生病中';
  const avg = (pet.value.hunger + pet.value.mood + pet.value.clean + pet.value.energy) / 4;
  if (avg < 30) return '😿 状态不好';
  if (avg > 80) return '😺 精神满满';
  return '🐾 在线';
});

const quickReplies = [
  '你好呀～',
  '想你了',
  '你今天开心吗？',
  '吃了吗？',
  '你好可爱呀'
];

function formatTime(t) {
  if (!t) return '';
  const d = new Date(t);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

async function scrollToBottom() {
  await nextTick();
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
  }
}

function autoResize(e) {
  const el = e.target;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

async function loadPet() {
  try {
    pet.value = await getPet();
  } catch (e) {}
}

async function loadHistory() {
  loading.value = true;
  try {
    const data = await getChatHistory();
    messages.value = data || [];
    await scrollToBottom();
  } catch (e) {}
  loading.value = false;
}

async function onSend() {
  const text = inputText.value.trim();
  if (!text || sending.value) return;

  // 1. 先显示用户消息（乐观更新）
  messages.value.push({
    role: 'user',
    content: text,
    created_at: new Date().toISOString()
  });
  inputText.value = '';
  if (textareaEl.value) textareaEl.value.style.height = 'auto';
  await scrollToBottom();

  // 2. 显示"思考中"
  sending.value = true;
  thinking.value = true;
  await scrollToBottom();

  try {
    const data = await sendChat(text);
    thinking.value = false;

    // 3. 追加宠物回复
    messages.value.push({
      role: 'assistant',
      content: data.reply,
      created_at: new Date().toISOString()
    });
    await scrollToBottom();
  } catch (e) {
    thinking.value = false;
    ElMessage.error(e.message || '发送失败，稍后再试');

    // 失败时也补一条兜底消息，让用户知道
    messages.value.push({
      role: 'assistant',
      content: '喵...我有点累了，等会再聊好不好～',
      created_at: new Date().toISOString()
    });
    await scrollToBottom();
  }
  sending.value = false;
}

async function onQuickReply(text) {
  inputText.value = text;
  await onSend();
}

async function onClear() {
  try {
    await ElMessageBox.confirm('清空所有聊天记录？', '提示', { type: 'warning' });
    await clearChatHistory();
    messages.value = [];
    ElMessage.success('已清空');
  } catch (e) {}
}

onMounted(async () => {
  await Promise.all([loadPet(), loadHistory()]);
  await scrollToBottom();
});
</script>

<style scoped>
.chat-page { height: 100vh; display: flex; flex-direction: column; background: linear-gradient(180deg, #e0f2ff 0%, #f5f0ff 40%, #fff5f0 100%); font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', sans-serif; color: #1d1d1f; overflow: hidden; }
.nav { flex-shrink: 0; background: rgba(255, 255, 255, 0.72); backdrop-filter: saturate(180%) blur(20px); border-bottom: 1px solid rgba(0, 0, 0, 0.06); z-index: 100; }
.nav-inner { max-width: 700px; margin: 0 auto; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; }
.nav-brand { display: flex; align-items: center; gap: 10px; }
.nav-back { background: transparent; border: none; font-size: 20px; cursor: pointer; padding: 4px 8px; border-radius: 8px; }
.nav-back:hover { background: rgba(0, 0, 0, 0.05); }
.pet-avatar-small { width: 36px; height: 36px; border-radius: 50%; background: rgba(102, 126, 234, 0.1); display: flex; align-items: center; justify-content: center; font-size: 22px; }
.brand-info { display: flex; flex-direction: column; }
.brand-name { font-size: 15px; font-weight: 700; }
.brand-status { font-size: 11px; color: #86868b; }
.nav-actions { display: flex; align-items: center; gap: 10px; }
.icon-btn { background: transparent; border: none; font-size: 18px; cursor: pointer; padding: 6px 10px; border-radius: 8px; transition: background 0.2s; }
.icon-btn:hover { background: rgba(0, 0, 0, 0.05); }

.chat-main { flex: 1; display: flex; flex-direction: column; min-height: 0; max-width: 700px; width: 100%; margin: 0 auto; }
.messages { flex: 1; overflow-y: auto; padding: 20px; min-height: 0; }
.messages::-webkit-scrollbar { width: 6px; }
.messages::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 3px; }

.empty-chat { text-align: center; padding: 80px 20px; color: #86868b; }
.empty-emoji { font-size: 64px; margin-bottom: 16px; animation: emptyBreathe 3s ease-in-out infinite; }
@keyframes emptyBreathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
.empty-title { font-size: 17px; font-weight: 600; color: #1d1d1f; margin-bottom: 6px; }
.empty-desc { font-size: 13px; }

.message-row { display: flex; gap: 10px; margin-bottom: 16px; align-items: flex-end; }
.message-row.mine { flex-direction: row-reverse; }

.avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 600; flex-shrink: 0; }
.pet-avatar { background: rgba(102, 126, 234, 0.1); font-size: 20px; }
.user-avatar { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; overflow: hidden; }
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }

.bubble-wrap { max-width: 70%; display: flex; flex-direction: column; }
.message-row.mine .bubble-wrap { align-items: flex-end; }
.bubble { padding: 10px 14px; border-radius: 16px; font-size: 15px; line-height: 1.5; word-break: break-word; background: #fff; color: #1d1d1f; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
.message-row.mine .bubble { background: #0071e3; color: #fff; }
.time { font-size: 10px; color: #c7c7cc; margin-top: 4px; padding: 0 4px; }

/* 思考中动画 */
.thinking-bubble { display: flex; align-items: center; gap: 4px; padding: 14px 18px; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: #c7c7cc; animation: dotBounce 1.2s infinite; }
.dot:nth-child(2) { animation-delay: 0.15s; }
.dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes dotBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30% { transform: translateY(-5px); opacity: 1; }
}

.quick-replies { padding: 0 20px 12px; display: flex; gap: 8px; flex-wrap: wrap; }
.quick-btn { padding: 8px 16px; border: 1px solid rgba(0, 113, 227, 0.2); background: #fff; color: #0071e3; font-size: 13px; font-weight: 500; border-radius: 999px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.quick-btn:hover { background: rgba(0, 113, 227, 0.08); border-color: #0071e3; }

.input-area { flex-shrink: 0; display: flex; gap: 10px; padding: 12px 20px 20px; background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(20px); align-items: flex-end; }
.input-area textarea { flex: 1; padding: 12px 16px; border: 1px solid rgba(0, 0, 0, 0.08); border-radius: 20px; font-size: 15px; font-family: inherit; resize: none; outline: none; background: #fff; line-height: 1.4; max-height: 120px; min-height: 44px; transition: border-color 0.2s; }
.input-area textarea:focus { border-color: #0071e3; box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.08); }
.send-btn { padding: 12px 24px; border-radius: 999px; border: none; background: #0071e3; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; flex-shrink: 0; min-width: 72px; }
.send-btn:hover:not(:disabled) { background: #0077ed; transform: scale(1.02); }
.send-btn:disabled { background: #e5e5ea; color: #a1a1a6; cursor: not-allowed; }

@media (max-width: 640px) {
  .nav-inner { padding: 10px 16px; }
  .messages { padding: 16px; }
  .bubble { max-width: 78%; }
  .input-area { padding: 10px 16px 16px; }
  .quick-replies { padding: 0 16px 8px; }
}
</style>
