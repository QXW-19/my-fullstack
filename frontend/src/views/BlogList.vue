<template>
  <div class="blog-apple">
    <!-- 导航 -->
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <span class="brand-icon">📚</span>
          <span class="brand-text">博客</span>
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
                <el-dropdown-item command="todo">📝 待办</el-dropdown-item>
                <el-dropdown-item command="write" divided>✏️ 写文章</el-dropdown-item>
                <el-dropdown-item command="profile">👤 个人资料</el-dropdown-item>
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
          记录思考，<span class="gradient-text">分享成长</span>
        </h1>
        <p class="hero-subtitle">
          <span v-if="total">{{ total }} 篇文章</span>
          <span v-else>开始写第一篇吧</span>
        </p>
        <button class="write-btn" @click="$router.push('/article/edit')">
          ✏️ 写文章
        </button>
      </section>

      <!-- 筛选栏 -->
      <section class="filter-bar">
        <div class="filter-tabs">
          <button
            v-for="f in statusFilters"
            :key="f.label"
            class="filter-tab"
            :class="{ active: filters.status === f.value }"
            @click="setStatus(f.value)"
          >
            {{ f.label }}
          </button>
        </div>

        <div class="filter-right">
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input
              v-model="filters.keyword"
              placeholder="搜索标题..."
              @input="onSearch"
            />
          </div>
          <el-select
            v-model="filters.tag"
            placeholder="标签"
            clearable
            size="small"
            style="width: 120px"
            @change="fetchList"
          >
            <el-option v-for="t in tags" :key="t.id" :label="t.name" :value="t.name" />
          </el-select>
        </div>
      </section>

      <!-- 文章网格 -->
      <section class="grid-section" v-loading="loading">
        <div class="articles-grid" v-if="list.length">
          <ArticleCard v-for="a in list" :key="a.id" :article="a" />
        </div>

        <div v-if="!loading && !list.length" class="empty">
          <div class="empty-icon">📝</div>
          <div class="empty-title">还没有文章</div>
          <div class="empty-desc">点击上方"写文章"开始创作</div>
        </div>
      </section>

      <!-- 分页 -->
      <div v-if="total > filters.size" class="pagination">
        <el-pagination
          layout="prev, pager, next"
          :total="total"
          :page-size="filters.size"
          :current-page="filters.page"
          @current-change="onPageChange"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { getArticles, getTags } from '@/api/article';
import ArticleCard from '@/components/ArticleCard.vue';
import NotificationBell from '@/components/NotificationBell.vue';

const router = useRouter();
const userStore = useUserStore();

const list = ref([]);
const tags = ref([]);
const total = ref(0);
const loading = ref(false);

const filters = reactive({
  keyword: '',
  tag: '',
  status: undefined,
  page: 1,
  size: 12
});

const statusFilters = [
  { label: '全部', value: undefined },
  { label: '已发布', value: 1 },
  { label: '草稿', value: 0 }
];

async function fetchList() {
  loading.value = true;
  try {
    const params = { page: filters.page, size: filters.size };
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.tag) params.tag = filters.tag;
    if (filters.status !== undefined) params.status = filters.status;
    const data = await getArticles(params);
    list.value = data.list;
    total.value = data.total;
  } catch (e) {}
  loading.value = false;
}

function setStatus(v) {
  filters.status = v;
  filters.page = 1;
  fetchList();
}

let searchTimer;
function onSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    filters.page = 1;
    fetchList();
  }, 300);
}

function onPageChange(p) {
  filters.page = p;
  fetchList();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onCommand(cmd) {
  if (cmd === 'home') router.push('/home');
  else if (cmd === 'board') router.push('/board');
  else if (cmd === 'todo') router.push('/todo');
  else if (cmd === 'write') router.push('/article/edit');
  else if (cmd === 'profile') router.push('/profile');
  else if (cmd === 'logout') {
    userStore.logout();
    router.push('/login');
  }
}

onMounted(async () => {
  fetchList();
  tags.value = await getTags();
});
</script>

<style scoped>
.blog-apple {
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
  max-width: 1200px;
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 32px 100px;
}

/* Hero */
.hero {
  text-align: center;
  margin-bottom: 56px;
}
.hero-title {
  font-size: clamp(36px, 5.5vw, 64px);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.12;
  margin: 0 0 16px;
  color: #1d1d1f;
}
.gradient-text {
  background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.hero-subtitle {
  font-size: 18px;
  color: #86868b;
  margin: 0 0 32px;
}

.write-btn {
  padding: 12px 32px;
  border-radius: 999px;
  border: none;
  background: #0071e3;
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.write-btn:hover {
  background: #0077ed;
  transform: scale(1.03);
  box-shadow: 0 8px 20px rgba(0, 113, 227, 0.25);
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 16px;
  flex-wrap: wrap;
}
.filter-tabs {
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.04);
  padding: 3px;
  border-radius: 10px;
}
.filter-tab {
  padding: 6px 16px;
  font-size: 13px;
  border: none;
  background: transparent;
  color: #86868b;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  font-family: inherit;
  font-weight: 500;
}
.filter-tab:hover { color: #1d1d1f; }
.filter-tab.active {
  background: #fff;
  color: #1d1d1f;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.filter-right { display: flex; gap: 8px; align-items: center; }
.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.search-wrap .search-icon {
  position: absolute;
  left: 12px;
  font-size: 12px;
  pointer-events: none;
  opacity: 0.5;
}
.search-wrap input {
  padding: 7px 14px 7px 32px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  font-size: 13px;
  background: #fff;
  color: #1d1d1f;
  width: 200px;
  outline: none;
  font-family: inherit;
  transition: all 0.2s;
}
.search-wrap input:focus {
  border-color: #0071e3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.08);
}

/* 文章网格 */
.grid-section { min-height: 300px; }
.articles-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

/* 空状态 */
.empty {
  text-align: center;
  padding: 100px 20px;
}
.empty-icon { font-size: 64px; margin-bottom: 20px; }
.empty-title {
  font-size: 22px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 8px;
}
.empty-desc { font-size: 15px; color: #86868b; }

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 48px;
}

/* 响应式 */
@media (max-width: 980px) {
  .articles-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .nav-inner { padding: 12px 16px; }
  .user-name { display: none; }
  .main { padding: 40px 16px 60px; }
  .hero { margin-bottom: 32px; }
  .hero-title { font-size: 32px; }
  .hero-subtitle { font-size: 15px; margin-bottom: 24px; }
  .articles-grid { grid-template-columns: 1fr; gap: 16px; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-right { justify-content: space-between; }
  .search-wrap input { width: 100%; }
}
</style>
