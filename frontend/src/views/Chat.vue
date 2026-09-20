<template>
  <div class="chat-apple" :class="{ 'mobile-chatting': isMobile && currentUser }">
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <button v-if="isMobile && currentUser" class="nav-back" @click="currentUser = null">←</button>
          <span class="brand-icon">💭</span>
          <span class="brand-text">即时聊天</span>
          <span v-if="socketConnected" class="status-dot online"></span>
          <span v-else class="status-dot offline"></span>
        </div>
        <div class="nav-actions">
          <NotificationBell />
          <el-dropdown @command="onCommand">
            <div class="user-chip">
              <img v-if="userStore.userInfo?.avatar" :src="userStore.userInfo.avatar" class="user-avatar-img" alt="" />
              <div v-else class="user-avatar">{{ userStore.userInfo?.username?.[0]?.toUpperCase() }}</div>
              <span class="user-name">{{ userStore.userInfo?.username }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="home">🏠 首页</el-dropdown-item>
                <el-dropdown-item command="board">💬 留言板</el-dropdown-item>
                <el-dropdown-item command="profile" divided>👤 个人资料</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </nav>

    <main class="chat-main-wrap">
      <div class="chat-body">
        <aside class="user-list">
          <div class="list-head">
            <span class="list-title">消息</span>
            <span class="list-count">{{ onlineCount }} 在线</span>
          </div>
          <div class="list-scroll">
            <div
              v-for="u in users"
              :key="u.id"
              class="user-item"
              :class="{ active: currentUser?.id === u.id }"
              @click="selectUser(u)"
            >
              <div class="avatar-wrap">
                <img v-if="u.avatar" :src="u.avatar" class="avatar-img" alt="" />
                <div v-else class="avatar-char">{{ u.username[0].toUpperCase() }}</div>
                <span class="dot" :class="{ online: u.online }"></span>
              </div>
              <div class="user-info">
                <div class="user-row">
                  <span class="user-n">{{ u.username }}</span>
                  <span class="user-time">{{ u.online ? '在线' : '离线' }}</span>
                </div>
                <div class="user-preview">
                  {{ u.unread > 0 ? u.unread + ' 条新消息' : '点击开始聊天' }}
                </div>
              </div>
              <div v-if="u.unread > 0" class="unread-badge">{{ u.unread > 99 ? '99+' : u.unread }}</div>
            </div>
            <div v-if="!users.length" class="empty-list">
              <div class="empty-icon">👥</div>
              <div>暂无其他用户</div>
            </div>
          </div>
        </aside>

        <section class="conversation">
          <template v-if="currentUser">
            <header class="conv-head">
              <div class="conv-info">
                <img v-if="currentUser.avatar" :src="currentUser.avatar" class="conv-avatar-img" alt="" />
                <div v-else class="conv-avatar">{{ currentUser.username[0].toUpperCase() }}</div>
                <div>
                  <div class="conv-name">{{ currentUser.username }}</div>
                  <div class="conv-status">
                    <span class="status-dot small" :class="{ online: currentUser.online }"></span>
                    <span v-if="typingUsers[currentUser.id]" class="typing-text">正在输入...</span>
                    <span v-else>{{ currentUser.online ? '在线' : '离线' }}</span>
                  </div>
                </div>
              </div>
              <button class="icon-btn" @click="currentUser = null">⋯</button>
            </header>

            <div class="messages" ref="messagesEl">
              <template v-for="(m, idx) in messages" :key="m.id">
                <div v-if="showTimeDivider(idx)" class="time-divider">
                  <span>{{ formatDivider(m.createdAt) }}</span>
                </div>

                <div class="msg-row" :class="{ mine: m.from_id === userStore.userInfo?.id }">
                  <div v-if="m.status === 1" class="bubble recalled">
                    ⛔ 消息已撤回
                  </div>
                  <template v-else>
                    <img
                      v-if="m.type === 1"
                      :src="m.content"
                      class="bubble image-bubble"
                      @click="previewImage(m.content)"
                    />
                    <div v-else class="bubble">{{ m.content }}</div>

                    <div class="msg-meta">
                      <span class="msg-time">{{ formatTime(m.createdAt) }}</span>
                      <button
                        v-if="m.from_id === userStore.userInfo?.id && canRecall(m)"
                        class="recall-btn"
                        @click="recallMessage(m)"
                      >
                        撤回
                      </button>
                    </div>
                  </template>
                </div>
              </template>

              <div v-if="!messages.length" class="empty-chat">
                <div class="empty-icon">💬</div>
                <div class="empty-tip">还没有消息，打个招呼吧 👋</div>
              </div>
            </div>

            <div class="input-area">
              <button class="icon-btn-plus" @click="selectImage" title="发送图片">📎</button>
              <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="onImageSelected" />
              <textarea
                v-model="inputText"
                placeholder="输入消息..."
                rows="1"
                @input="onTyping"
                @keydown.enter.exact.prevent="sendMessage"
              ></textarea>
              <button class="send-btn" :disabled="!inputText.trim()" @click="sendMessage">↑</button>
            </div>
          </template>

          <div v-else class="no-chat">
            <div class="no-chat-inner">
              <div class="no-chat-icon">💭</div>
              <div class="no-chat-title">选择一个用户</div>
              <div class="no-chat-desc">开始一段对话</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { getChatUsers, getMessages } from '@/api/chat';
import { connectSocket, disconnectSocket } from '@/utils/socket';
import { uploadFile } from '@/api/upload';
import NotificationBell from '@/components/NotificationBell.vue';

const router = useRouter();
const userStore = useUserStore();

const users = ref([]);
const currentUser = ref(null);
const messages = ref([]);
const inputText = ref('');
const messagesEl = ref(null);
const socketConnected = ref(false);
const isMobile = ref(window.innerWidth < 768);
const typingUsers = ref({});
const fileInput = ref(null);

let socket = null;
let typingTimer = null;
let isTyping = false;

const onlineCount = computed(() => users.value.filter(u => u.online).length);

function updateIsMobile() {
  isMobile.value = window.innerWidth < 768;
}

async function loadUsers() {
  try { users.value = await getChatUsers(); } catch (e) {}
}

async function selectUser(u) {
  currentUser.value = u;
  try {
    const data = await getMessages(u.id, { size: 50 });
    messages.value = data.list;
    u.unread = 0;
    socket?.emit('message:read', { from: u.id });
    await scrollToBottom();
  } catch (e) {}
}

function sendMessage() {
  if (!inputText.value.trim() || !currentUser.value) return;
  if (!socket?.connected) return ElMessage.error('连接已断开');

  socket.emit('message:send', {
    to: currentUser.value.id,
    content: inputText.value.trim(),
    type: 0
  }, (res) => {
    if (res?.ok) {
      messages.value.push(res.data);
      inputText.value = '';
      socket.emit('message:typing', { to: currentUser.value.id, typing: false });
      isTyping = false;
      scrollToBottom();
    } else {
      ElMessage.error(res?.msg || '发送失败');
    }
  });
}

function onTyping() {
  if (!currentUser.value || !socket?.connected) return;
  if (!isTyping) {
    isTyping = true;
    socket.emit('message:typing', { to: currentUser.value.id, typing: true });
  }
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    isTyping = false;
    socket.emit('message:typing', { to: currentUser.value.id, typing: false });
  }, 2000);
}

function selectImage() {
  fileInput.value?.click();
}

async function onImageSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 20 * 1024 * 1024) {
    ElMessage.error('图片太大，最大 20MB');
    e.target.value = '';
    return;
  }
  try {
    const { url } = await uploadFile('chat', file);
    socket.emit('message:send', {
      to: currentUser.value.id,
      content: url,
      type: 1
    }, (res) => {
      if (res?.ok) {
        messages.value.push(res.data);
        scrollToBottom();
      } else {
        ElMessage.error(res?.msg || '发送失败');
      }
    });
  } catch (err) {
    ElMessage.error(err.message || '上传失败');
  }
  e.target.value = '';
}

function canRecall(m) {
  if (m.status === 1) return false;
  const diff = (Date.now() - new Date(m.createdAt).getTime()) / 1000;
  return diff < 120;
}

function recallMessage(m) {
  if (!confirm('确定撤回这条消息？')) return;
  socket.emit('message:recall', { messageId: m.id }, (res) => {
    if (res?.ok) ElMessage.success('已撤回');
    else ElMessage.error(res?.msg || '撤回失败');
  });
}

function previewImage(url) {
  window.open(url, '_blank');
}

function showTimeDivider(idx) {
  if (idx === 0) return true;
  const prev = new Date(messages.value[idx - 1].createdAt).getTime();
  const curr = new Date(messages.value[idx].createdAt).getTime();
  return curr - prev > 5 * 60 * 1000;
}

function formatDivider(t) {
  const d = new Date(t);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return time;
  if (isYesterday) return '昨天 ' + time;
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) + ' ' + time;
}

async function scrollToBottom() {
  await nextTick();
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
}

function formatTime(t) {
  return new Date(t).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function onCommand(cmd) {
  const map = { home: '/home', board: '/board', profile: '/profile' };
  if (cmd === 'logout') {
    disconnectSocket();
    userStore.logout();
    router.push('/login');
  } else if (map[cmd]) {
    router.push(map[cmd]);
  }
}

onMounted(async () => {
  await loadUsers();
  window.addEventListener('resize', updateIsMobile);
  socket = connectSocket();
  if (socket) {
    socket.on('connect', () => { socketConnected.value = true; });
    socket.on('disconnect', () => { socketConnected.value = false; });
    socketConnected.value = socket.connected;
    socket.on('message:new', (msg) => {
      if (currentUser.value && msg.from_id === currentUser.value.id) {
        messages.value.push(msg);
        scrollToBottom();
        socket.emit('message:read', { from: msg.from_id });
      } else {
        const u = users.value.find(x => x.id === msg.from_id);
        if (u) u.unread = (u.unread || 0) + 1;
      }
    });
    socket.on('message:recalled', ({ messageId }) => {
      const m = messages.value.find(x => x.id === messageId);
      if (m) m.status = 1;
    });
    socket.on('message:typing', ({ from, typing }) => {
      typingUsers.value = { ...typingUsers.value, [from]: typing };
    });
    socket.on('user:online', ({ userId }) => {
      const u = users.value.find(x => x.id === userId);
      if (u) u.online = true;
    });
    socket.on('user:offline', ({ userId }) => {
      const u = users.value.find(x => x.id === userId);
      if (u) u.online = false;
    });
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile);
  disconnectSocket();
});
</script>

<style scoped>
.chat-apple { height: 100vh; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #1d1d1f; display: flex; flex-direction: column; overflow: hidden; }
.nav { flex-shrink: 0; background: rgba(255, 255, 255, 0.72); backdrop-filter: saturate(180%) blur(20px); border-bottom: 1px solid rgba(0, 0, 0, 0.06); z-index: 100; }
.nav-inner { max-width: 1200px; margin: 0 auto; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; }
.nav-brand { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 600; }
.nav-back { background: transparent; border: none; font-size: 20px; cursor: pointer; color: #1d1d1f; padding: 4px 8px; border-radius: 8px; font-family: inherit; }
.brand-icon { font-size: 20px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: #c7c7cc; margin-left: 4px; }
.status-dot.online { background: #34c759; }
.status-dot.small { width: 6px; height: 6px; display: inline-block; }
.nav-actions { display: flex; align-items: center; gap: 16px; }
.user-chip { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 12px 4px 4px; border-radius: 999px; }
.user-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; }
.user-avatar-img { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
.user-name { font-size: 14px; }
.chat-main-wrap { flex: 1; min-height: 0; max-width: 1200px; width: 100%; margin: 0 auto; padding: 24px 32px 32px; display: flex; flex-direction: column; }
.chat-body { flex: 1; min-height: 0; display: flex; background: #fff; border-radius: 20px; overflow: hidden; border: 1px solid rgba(0, 0, 0, 0.04); box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04); }
.user-list { width: 300px; display: flex; flex-direction: column; border-right: 1px solid rgba(0, 0, 0, 0.06); flex-shrink: 0; }
.list-head { padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0, 0, 0, 0.05); }
.list-title { font-size: 15px; font-weight: 700; }
.list-count { font-size: 12px; color: #34c759; font-weight: 500; background: rgba(52, 199, 89, 0.1); padding: 3px 10px; border-radius: 999px; }
.list-scroll { flex: 1; overflow-y: auto; padding: 8px; }
.user-item { display: flex; gap: 12px; padding: 12px; border-radius: 12px; cursor: pointer; transition: background 0.15s; align-items: center; }
.user-item:hover { background: rgba(0, 0, 0, 0.03); }
.user-item.active { background: rgba(0, 113, 227, 0.08); }
.avatar-wrap { position: relative; flex-shrink: 0; }
.avatar-img, .avatar-char { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.avatar-char { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; }
.avatar-wrap .dot { position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; border-radius: 50%; background: #c7c7cc; border: 2px solid #fff; }
.avatar-wrap .dot.online { background: #34c759; }
.user-info { flex: 1; min-width: 0; }
.user-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.user-n { font-size: 15px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-time { font-size: 11px; color: #86868b; }
.user-preview { font-size: 13px; color: #86868b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.unread-badge { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: #ff3b30; color: #fff; font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.empty-list { padding: 60px 20px; text-align: center; color: #86868b; font-size: 14px; }
.empty-list .empty-icon { font-size: 40px; margin-bottom: 12px; }
.conversation { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.conv-head { padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0, 0, 0, 0.05); flex-shrink: 0; }
.conv-info { display: flex; align-items: center; gap: 12px; }
.conv-avatar, .conv-avatar-img { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; }
.conv-avatar { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; }
.conv-name { font-size: 15px; font-weight: 600; }
.conv-status { font-size: 12px; color: #86868b; display: flex; align-items: center; gap: 4px; margin-top: 2px; }
.typing-text { color: #34c759; font-weight: 500; }
.icon-btn { width: 32px; height: 32px; border-radius: 50%; border: none; background: transparent; color: #86868b; cursor: pointer; font-size: 18px; }
.messages { flex: 1; overflow-y: auto; padding: 24px; background: #fafafa; min-height: 0; }
.time-divider { text-align: center; margin: 16px 0; }
.time-divider span { font-size: 11px; color: #86868b; background: rgba(0, 0, 0, 0.05); padding: 4px 12px; border-radius: 999px; }
.msg-row { display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 12px; }
.msg-row.mine { align-items: flex-end; }
.bubble { max-width: 60%; padding: 10px 16px; border-radius: 18px; background: #fff; color: #1d1d1f; font-size: 15px; line-height: 1.5; word-break: break-word; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04); }
.msg-row.mine .bubble { background: #0071e3; color: #fff; }
.bubble.recalled { background: rgba(0, 0, 0, 0.04); color: #86868b; font-style: italic; font-size: 13px; padding: 6px 14px; }
.bubble.image-bubble { max-width: 240px; padding: 4px; cursor: pointer; background: #fff; border-radius: 12px; }
.msg-row.mine .bubble.image-bubble { background: #0071e3; }
.msg-meta { display: flex; gap: 8px; align-items: center; margin-top: 4px; padding: 0 6px; }
.msg-time { font-size: 11px; color: #c7c7cc; }
.recall-btn { font-size: 11px; color: #0071e3; background: transparent; border: none; cursor: pointer; padding: 2px 6px; border-radius: 4px; opacity: 0; transition: opacity 0.2s; font-family: inherit; }
.msg-row:hover .recall-btn { opacity: 1; }
.empty-chat { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #86868b; gap: 12px; }
.empty-chat .empty-icon { font-size: 48px; }
.empty-tip { font-size: 14px; }
.input-area { padding: 16px 24px; border-top: 1px solid rgba(0, 0, 0, 0.05); display: flex; gap: 10px; align-items: flex-end; flex-shrink: 0; background: #fff; }
.icon-btn-plus { width: 40px; height: 40px; border-radius: 50%; border: none; background: rgba(0, 0, 0, 0.05); color: #1d1d1f; cursor: pointer; font-size: 18px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
textarea { flex: 1; padding: 10px 16px; border: 1px solid rgba(0, 0, 0, 0.08); border-radius: 20px; font-size: 15px; color: #1d1d1f; outline: none; resize: none; font-family: inherit; background: #fafafa; max-height: 120px; min-height: 40px; }
textarea:focus { border-color: #0071e3; background: #fff; box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.08); }
.send-btn { width: 40px; height: 40px; border-radius: 50%; border: none; background: #0071e3; color: #fff; cursor: pointer; font-size: 18px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.send-btn:disabled { background: #e5e5ea; color: #c7c7cc; cursor: not-allowed; }
.no-chat { flex: 1; display: flex; align-items: center; justify-content: center; background: #fafafa; }
.no-chat-inner { text-align: center; color: #86868b; }
.no-chat-icon { font-size: 64px; margin-bottom: 16px; }
.no-chat-title { font-size: 18px; font-weight: 600; color: #1d1d1f; margin-bottom: 6px; }
.no-chat-desc { font-size: 14px; }
@media (max-width: 768px) {
  .nav-inner { padding: 12px 16px; }
  .user-name { display: none; }
  .chat-main-wrap { padding: 0; }
  .chat-body { border-radius: 0; border: none; box-shadow: none; }
  .user-list { width: 100%; border-right: none; }
  .conversation { display: none; }
  .chat-apple.mobile-chatting .user-list { display: none; }
  .chat-apple.mobile-chatting .conversation { display: flex; }
  .bubble { max-width: 75%; }
}
</style>
