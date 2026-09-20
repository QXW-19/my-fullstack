<template>
  <div class="board-apple">
    <!-- 导航 -->
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <span class="brand-icon">💬</span>
          <span class="brand-text">留言板</span>
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
                <el-dropdown-item command="todo">📝 待办</el-dropdown-item>
                <el-dropdown-item command="blog">📚 博客</el-dropdown-item>
                <el-dropdown-item command="profile" divided>👤 个人资料</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </nav>

    <main class="main">
      <!-- Hero -->
      <section class="hero">
        <h1 class="hero-title">
          说点什么，<span class="gradient-text">都有人听</span>
        </h1>
        <p class="hero-subtitle">在这里，留下你的想法</p>
      </section>

      <!-- 发布框 -->
      <section class="publish-card">
        <div class="publish-head">
          <div class="publish-avatar">
            <img v-if="userStore.userInfo?.avatar" :src="userStore.userInfo.avatar" alt="" />
            <span v-else>{{ userStore.userInfo?.username?.[0]?.toUpperCase() }}</span>
          </div>
          <span class="publish-hint">分享你的想法...</span>
        </div>
        <textarea
          v-model="newContent"
          placeholder="写点什么吧..."
          maxlength="500"
          rows="3"
        ></textarea>
        <div class="publish-foot">
          <span class="char-count">{{ newContent.length }} / 500</span>
          <button class="publish-btn" :disabled="!newContent.trim()" @click="onPost">
            发布
          </button>
        </div>
      </section>

      <!-- 留言列表 -->
      <section class="list-section" v-loading="loading">
        <MessageItem
          v-for="item in list"
          :key="item.id"
          :message="item"
          @refresh="loadList"
        />

        <div v-if="!loading && !list.length" class="empty">
          <div class="empty-icon">💭</div>
          <div class="empty-title">还没有留言</div>
          <div class="empty-desc">来抢第一条沙发吧</div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { getMessages, postMessage } from '@/api/message';
import MessageItem from '@/components/MessageItem.vue';
import NotificationBell from '@/components/NotificationBell.vue';

const router = useRouter();
const userStore = useUserStore();

const list = ref([]);
const loading = ref(false);
const newContent = ref('');

async function loadList() {
  loading.value = true;
  try {
    const data = await getMessages({ page: 1, size: 50 });
    list.value = data.list;
  } catch (e) {}
  loading.value = false;
}

async function onPost() {
  if (!newContent.value.trim()) return;
  try {
    await postMessage({ content: newContent.value });
    ElMessage.success('发布成功');
    newContent.value = '';
    loadList();
  } catch (e) {}
}

function onCommand(cmd) {
  if (cmd === 'home') router.push('/home');
  else if (cmd === 'todo') router.push('/todo');
  else if (cmd === 'blog') router.push('/blog');
  else if (cmd === 'profile') router.push('/profile');
  else if (cmd === 'logout') {
    userStore.logout();
    router.push('/login');
  }
}

onMounted(loadList);
</script>

<style scoped>
.board-apple {
  min-height: 100vh;
  background: #fafafa;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #1d1d1f;
}

/* 导航 */
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.nav-inner {
  max-width: 768px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.3px;
}
.brand-icon { font-size: 20px; }
.nav-actions { display: flex; align-items: center; gap: 16px; }
.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 12px 4px 4px;
  border-radius: 999px;
  transition: background 0.2s;
}
.user-chip:hover { background: rgba(0, 0, 0, 0.05); }
.user-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 600;
}
.user-avatar-img {
  width: 28px; height: 28px;
  border-radius: 50%;
  object-fit: cover;
}
.user-name { font-size: 14px; }

/* 主体 */
.main {
  max-width: 768px;
  margin: 0 auto;
  padding: 60px 24px 80px;
}

/* Hero */
.hero {
  text-align: center;
  margin-bottom: 48px;
}
.hero-title {
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin: 0 0 12px;
  color: #1d1d1f;
}
.gradient-text {
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.hero-subtitle {
  font-size: 17px;
  color: #86868b;
  margin: 0;
}

/* 发布卡片 */
.publish-card {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.3s;
}
.publish-card:focus-within {
  box-shadow: 0 8px 32px rgba(0, 113, 227, 0.1);
  border-color: rgba(0, 113, 227, 0.12);
}

.publish-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.publish-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-weight: 600;
  flex-shrink: 0;
}
.publish-avatar img {
  width: 100%; height: 100%;
  object-fit: cover;
}
.publish-hint {
  font-size: 14px;
  color: #86868b;
}

textarea {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-size: 16px;
  color: #1d1d1f;
  background: transparent;
  font-family: inherit;
  line-height: 1.6;
  padding: 8px 0;
}
textarea::placeholder { color: #c7c7cc; }

.publish-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  margin-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}
.char-count {
  font-size: 13px;
  color: #c7c7cc;
}
.publish-btn {
  padding: 8px 24px;
  border-radius: 999px;
  border: none;
  background: #0071e3;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.publish-btn:hover:not(:disabled) {
  background: #0077ed;
  transform: scale(1.02);
}
.publish-btn:disabled {
  background: #e5e5ea;
  color: #a1a1a6;
  cursor: not-allowed;
}

/* 留言列表 */
.list-section {
  background: #fff;
  border-radius: 20px;
  padding: 8px 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.03);
  min-height: 200px;
}

/* 空状态 */
.empty {
  text-align: center;
  padding: 80px 20px;
}
.empty-icon { font-size: 56px; margin-bottom: 20px; }
.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 8px;
}
.empty-desc { font-size: 15px; color: #86868b; }

/* 响应式 */
@media (max-width: 640px) {
  .nav-inner { padding: 12px 16px; }
  .user-name { display: none; }
  .main { padding: 32px 16px 60px; }
  .hero-title { font-size: 28px; }
  .hero { margin-bottom: 32px; }
  .publish-card { padding: 20px; border-radius: 16px; }
  .list-section { padding: 4px 16px; border-radius: 16px; }
}
</style>
