<template>
  <div class="todo-apple">
    <!-- 顶部导航 -->
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <span class="brand-icon">📝</span>
          <span class="brand-text">待办清单</span>
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

    <!-- 主体内容 -->
    <main class="main">
      <!-- Hero -->
      <section class="hero">
        <h1 class="hero-title">
          今天，<span class="gradient-text">做点什么？</span>
        </h1>
        <p class="hero-subtitle">专注当下，一件一件来</p>
      </section>

      <!-- 快速添加 -->
      <section class="add-card">
        <div class="add-input">
          <input
            v-model="newTitle"
            placeholder="输入待办，回车添加..."
            @keyup.enter="onAdd"
          />
        </div>
        <div class="add-options">
          <div class="option-group">
            <span class="option-label">优先级</span>
            <div class="priority-picker">
              <button
                v-for="(p, i) in priorities"
                :key="i"
                class="priority-btn"
                :class="{ active: newPriority === p.value }"
                :style="{ '--c': p.color }"
                @click="newPriority = p.value"
              >
                {{ p.label }}
              </button>
            </div>
          </div>

          <div class="option-group">
            <span class="option-label">分类</span>
            <select v-model="newCategory" class="category-select">
              <option value="">未分类</option>
              <option value="工作">工作</option>
              <option value="学习">学习</option>
              <option value="生活">生活</option>
            </select>
          </div>

          <button class="add-btn" :disabled="!newTitle.trim()" @click="onAdd">
            添加任务
          </button>
        </div>
      </section>

      <!-- 筛选栏 -->
      <section class="filter-bar">
        <div class="filter-tabs">
          <button
            v-for="f in statusFilters"
            :key="f.value"
            class="filter-tab"
            :class="{ active: todoStore.filters.status === f.value }"
            @click="setStatus(f.value)"
          >
            {{ f.label }}
            <span v-if="f.count !== undefined" class="count">{{ f.count }}</span>
          </button>
        </div>

        <div class="filter-right">
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input
              v-model="todoStore.filters.keyword"
              placeholder="搜索..."
              @input="todoStore.fetchList"
            />
          </div>
          <el-select v-model="todoStore.filters.category" placeholder="分类" clearable size="small" style="width: 110px" @change="todoStore.fetchList">
            <el-option label="工作" value="工作" />
            <el-option label="学习" value="学习" />
            <el-option label="生活" value="生活" />
          </el-select>
        </div>
      </section>

      <!-- 待办列表 -->
      <section class="list-section" v-loading="todoStore.loading">
        <draggable v-model="todoStore.list" item-key="id" handle=".drag-area" @end="onDragEnd">
          <template #item="{ element }">
            <div class="todo-item" :class="{ done: element.status === 1 }">
              <div class="drag-area">⋮⋮</div>

              <div class="checkbox" :class="{ checked: element.status === 1 }" @click="todoStore.toggle(element)">
                <span v-if="element.status === 1">✓</span>
              </div>

              <div class="todo-content">
                <div class="todo-title">{{ element.title }}</div>
                <div class="todo-meta">
                  <span class="priority-tag" :style="{ '--c': priorities[element.priority]?.color }">
                    {{ priorities[element.priority]?.label }}
                  </span>
                  <span v-if="element.category" class="category-tag">{{ element.category }}</span>
                  <span v-if="element.due_date" class="date-tag">📅 {{ formatDate(element.due_date) }}</span>
                </div>
              </div>

              <button class="delete-btn" @click="onDelete(element)">×</button>
            </div>
          </template>
        </draggable>

        <div v-if="!todoStore.loading && !todoStore.list.length" class="empty">
          <div class="empty-icon">🌿</div>
          <div class="empty-title">今天还没有待办</div>
          <div class="empty-desc">在上面输入框添加一个吧</div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import draggable from 'vuedraggable';
import { useUserStore } from '@/stores/user';
import { useTodoStore } from '@/stores/todo';
import NotificationBell from '@/components/NotificationBell.vue';

const router = useRouter();
const userStore = useUserStore();
const todoStore = useTodoStore();

const newTitle = ref('');
const newPriority = ref(1);
const newCategory = ref('');

const priorities = [
  { label: '低', value: 0, color: '#34c759' },
  { label: '中', value: 1, color: '#ff9500' },
  { label: '高', value: 2, color: '#ff3b30' }
];

const statusFilters = computed(() => {
  const all = todoStore.list;
  return [
    { label: '全部', value: '' },
    { label: '未完成', value: 0 },
    { label: '已完成', value: 1 }
  ];
});

async function onAdd() {
  if (!newTitle.value.trim()) return;
  await todoStore.add({
    title: newTitle.value.trim(),
    priority: newPriority.value,
    category: newCategory.value
  });
  ElMessage.success('已添加');
  newTitle.value = '';
}

function setStatus(v) {
  todoStore.filters.status = v;
  todoStore.fetchList();
}

function onDragEnd() {
  todoStore.sort(todoStore.list);
  ElMessage.success('顺序已保存');
}

async function onDelete(todo) {
  try {
    await ElMessageBox.confirm('确定删除这个任务？', '提示', { type: 'warning' });
    await todoStore.remove(todo.id);
    ElMessage.success('已删除');
  } catch (e) {}
}

function formatDate(t) {
  return new Date(t).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

function onCommand(cmd) {
  if (cmd === 'home') router.push('/home');
  else if (cmd === 'board') router.push('/board');
  else if (cmd === 'profile') router.push('/profile');
  else if (cmd === 'logout') {
    userStore.logout();
    router.push('/login');
  }
}

onMounted(() => todoStore.fetchList());
</script>

<style scoped>
/* ========== 基础 ========== */
.todo-apple {
  min-height: 100vh;
  background: #fafafa;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #1d1d1f;
}

/* ========== 导航 ========== */
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
  max-width: 1024px;
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

/* ========== 主体 ========== */
.main {
  max-width: 1024px;
  margin: 0 auto;
  padding: 80px 32px 100px;
}

/* ========== Hero ========== */
.hero {
  text-align: center;
  margin-bottom: 64px;
  padding-top: 20px;
}
.hero-title {
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.15;
  margin: 0 0 16px;
  color: #1d1d1f;
}
.gradient-text {
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.hero-subtitle {
  font-size: 18px;
  color: #86868b;
  margin: 0;
  letter-spacing: -0.01em;
}

/* ========== 添加卡片 ========== */
.add-card {
  background: #fff;
  border-radius: 24px;
  padding: 32px 32px 24px;
  margin-bottom: 40px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.3s;
}
.add-card:focus-within {
  box-shadow: 0 8px 32px rgba(0, 113, 227, 0.12);
  border-color: rgba(0, 113, 227, 0.15);
}

.add-input input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 20px;
  padding: 8px 4px;
  background: transparent;
  color: #1d1d1f;
  font-family: inherit;
  font-weight: 400;
  letter-spacing: -0.01em;
}
.add-input input::placeholder { color: #c7c7cc; }

.add-options {
  display: flex;
  gap: 24px;
  align-items: center;
  padding-top: 20px;
  margin-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
}

.option-group { display: flex; align-items: center; gap: 10px; }
.option-label {
  font-size: 13px;
  color: #86868b;
  font-weight: 500;
}

.priority-picker { display: flex; gap: 4px; }
.priority-btn {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: rgba(0, 0, 0, 0.04);
  color: #86868b;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  font-weight: 500;
}
.priority-btn:hover { background: rgba(0, 0, 0, 0.06); }
.priority-btn.active {
  background: color-mix(in srgb, var(--c) 12%, transparent);
  color: var(--c);
  border-color: color-mix(in srgb, var(--c) 30%, transparent);
}

.category-select {
  font-size: 13px;
  padding: 5px 24px 5px 10px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  color: #1d1d1f;
  cursor: pointer;
  font-family: inherit;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2386868b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

.add-btn {
  margin-left: auto;
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
.add-btn:hover:not(:disabled) { background: #0077ed; transform: scale(1.02); }
.add-btn:disabled { background: #e5e5ea; cursor: not-allowed; color: #86868b; }

/* ========== 筛选栏 ========== */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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
  left: 10px;
  font-size: 12px;
  pointer-events: none;
  opacity: 0.5;
}
.search-wrap input {
  padding: 6px 12px 6px 30px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
  color: #1d1d1f;
  width: 160px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}
.search-wrap input:focus {
  border-color: #0071e3;
}

/* ========== 待办列表 ========== */
.list-section {
  min-height: 200px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  padding: 16px 20px;
  border-radius: 14px;
  margin-bottom: 10px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}
.todo-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px -8px rgba(0, 0, 0, 0.12);
  border-color: rgba(0, 0, 0, 0.08);
}
.todo-item.done { opacity: 0.55; }
.todo-item.done .todo-title {
  text-decoration: line-through;
  color: #86868b;
}

.drag-area {
  cursor: grab;
  color: #d1d1d6;
  font-size: 14px;
  line-height: 1;
  user-select: none;
  letter-spacing: -2px;
}
.drag-area:active { cursor: grabbing; }

.checkbox {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #d1d1d6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  font-size: 12px;
  color: #fff;
  font-weight: 700;
}
.checkbox:hover { border-color: #0071e3; }
.checkbox.checked {
  background: #0071e3;
  border-color: #0071e3;
}

.todo-content { flex: 1; min-width: 0; }
.todo-title {
  font-size: 15px;
  color: #1d1d1f;
  font-weight: 500;
  margin-bottom: 6px;
  word-break: break-word;
}

.todo-meta { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.priority-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--c) 12%, transparent);
  color: var(--c);
  font-weight: 600;
}
.category-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(0, 113, 227, 0.1);
  color: #0071e3;
  font-weight: 500;
}
.date-tag {
  font-size: 11px;
  color: #86868b;
}

.delete-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #c7c7cc;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.delete-btn:hover {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

/* ========== 空状态 ========== */
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

/* ========== 响应式 ========== */
@media (max-width: 640px) {
  .nav-inner { padding: 12px 16px; }
  .user-name { display: none; }
  .main { padding: 32px 16px 60px; }
  .hero-title { font-size: 28px; }
  .add-card { padding: 20px; border-radius: 16px; }
  .add-options { gap: 12px; }
  .add-btn { margin-left: 0; width: 100%; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-right { justify-content: space-between; }
  .search-wrap input { width: 100%; }
  .todo-item { padding: 14px 16px; gap: 10px; }
  .drag-area { display: none; }
}
</style>
