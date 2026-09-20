<template>
  <div class="apple-home">
    <!-- 顶部导航 -->
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <span class="brand-icon">🐾</span>
          <span class="brand-text">猫狗回忆录</span>
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
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </nav>

    <!-- Hero 全屏 -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-eyebrow fade-in">🐾 欢迎回来</div>
        <h1 class="hero-title fade-in" style="animation-delay: 0.1s">
          <span class="gradient-text">{{ userStore.userInfo?.username }}</span>
        </h1>
        <p class="hero-subtitle fade-in" style="animation-delay: 0.2s">
          这是小猫小狗的专属回忆
        </p>
        <p class="hero-desc fade-in" style="animation-delay: 0.3s">
          Vue3 · Node.js · MySQL 全栈作品集
        </p>

        <div class="hero-cta fade-in" style="animation-delay: 0.4s">
          <button class="cta-btn primary" @click="scrollToProjects">
            探索项目 <span class="arrow">→</span>
          </button>
        </div>
      </div>

      <div class="scroll-hint fade-in" style="animation-delay: 0.8s">
        <div class="scroll-line"></div>
        <div class="scroll-text">向下滚动</div>
      </div>
    </section>

    <!-- 统计条 -->
    <section class="stats-section">
      <div class="stats-grid">
        <div class="stat-item" v-for="(s, i) in stats" :key="i">
          <div class="stat-num">{{ s.num }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </section>

    <!-- 项目区 -->
    <section class="projects-section" ref="projectsRef">
      <div class="section-head">
        <div class="section-eyebrow">PROJECTS</div>
        <h2 class="section-title">我的项目</h2>
        <p class="section-desc">从零构建的 6 个全栈应用，涵盖 CRUD、鉴权、可视化、实时通信</p>
      </div>

      <div class="projects-grid">
        <div
          v-for="(p, i) in projects"
          :key="p.path"
          class="product-card"
          :class="{ disabled: p.disabled }"
          :style="{ '--c': p.color, animationDelay: `${i * 0.06}s` }"
          @click="!p.disabled && $router.push(p.path)"
        >
          <div class="card-bg"></div>

          <div class="card-top">
            <div class="card-icon-wrap">
              <span class="card-icon">{{ p.icon }}</span>
            </div>
            <div class="card-status">
              <span v-if="p.disabled" class="badge-soon">即将上线</span>
              <span v-else class="badge-ready">可用</span>
            </div>
          </div>

          <div class="card-body">
            <h3 class="card-name">{{ p.name }}</h3>
            <p class="card-text">{{ p.desc }}</p>

            <div class="card-tags">
              <span v-for="t in p.tags" :key="t" class="tag">{{ t }}</span>
            </div>
          </div>

          <div class="card-action" v-if="!p.disabled">
            打开 <span class="arrow">→</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-brand">🐾 猫狗回忆录</div>
        <div class="footer-text">Built with Vue3 · Express · MySQL · Socket.io · ECharts</div>
        <div class="footer-meta">阿里云 · 宝塔 · PM2 · Nginx · Redis</div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import NotificationBell from '@/components/NotificationBell.vue';

const router = useRouter();
const userStore = useUserStore();
const projectsRef = ref(null);

const projects = [
  { name: '留言板',   icon: '💬', path: '/board',      desc: '发帖、嵌套回复、点赞、树形结构渲染',      color: '#0071e3', tags: ['JWT', '递归组件', '点赞防重'] },
  { name: '待办清单', icon: '📝', path: '/todo',       desc: '任务管理、状态切换、拖拽排序、动态筛选',  color: '#34c759', tags: ['乐观更新', '拖拽排序', '动态筛选'] },
  { name: '个人博客', icon: '📚', path: '/blog',       desc: 'Markdown 写作、标签分类、代码高亮、XSS 防护', color: '#ff9500', tags: ['Markdown', '多对多', 'DOMPurify'] },
  { name: '记账本',   icon: '💰', path: '/accounting', desc: '收支记录、分类统计、图表可视化、月度分析', color: '#ff3b30', tags: ['SQL 聚合', 'ECharts', '精度处理'] },
  { name: '电子宠物', icon: '🐾', path: '/pet',        desc: '养宠物、时间衰减、成长系统、装扮互动',    color: '#ff9500', tags: ['时间模拟', '状态机', 'WebSocket'] },
  { name: '图书管理', icon: '📖', path: '/library',    desc: '借阅归还、库存管理、并发控制、事务处理',  color: '#8e8e93', tags: ['事务', '行锁', '状态机'], disabled: true },
  { name: '即时聊天', icon: '💭', path: '/chat',       desc: '实时通信、在线状态、消息可靠性、离线推送', color: '#af52de', tags: ['WebSocket', 'Redis', '消息 ACK'] }
];

const stats = computed(() => [
  { num: projects.filter(p => !p.disabled).length, label: '项目' },
  { num: projects.reduce((s, p) => s + p.tags.length, 0), label: '技能点' },
  { num: '100%', label: '全栈' }
]);

function onCommand(cmd) {
  if (cmd === 'logout') {
    userStore.logout();
    router.push('/login');
  } else if (cmd === 'profile') {
    router.push('/profile');
  }
}

function scrollToProjects() {
  projectsRef.value?.scrollIntoView({ behavior: 'smooth' });
}

onMounted(() => {
  // 滚动显现动画
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.product-card').forEach(el => observer.observe(el));
});
</script>

<style scoped>
/* ============ 全局 ============ */
.apple-home {
  min-height: 100vh;
  background: #ffffff;
  color: #1d1d1f;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  overflow-x: hidden;
}

/* ============ 顶部导航 ============ */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
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
.brand-text { color: #1d1d1f; }

.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
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
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}
.user-avatar-img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}
.user-name {
  font-size: 14px;
  color: #1d1d1f;
  font-weight: 400;
}

/* ============ Hero ============ */
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 24px;
  position: relative;
  text-align: center;
}

.hero-content {
  max-width: 900px;
}

.hero-eyebrow {
  font-size: 17px;
  color: #86868b;
  font-weight: 500;
  margin-bottom: 20px;
  letter-spacing: -0.2px;
}

.hero-title {
  font-size: clamp(48px, 8vw, 96px);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.05;
  margin: 0 0 24px;
  color: #1d1d1f;
}

.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: clamp(22px, 3vw, 32px);
  font-weight: 600;
  color: #1d1d1f;
  letter-spacing: -0.02em;
  margin: 0 0 12px;
}

.hero-desc {
  font-size: 17px;
  color: #86868b;
  margin: 0 0 48px;
  letter-spacing: -0.01em;
}

.hero-cta {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.cta-btn {
  font-size: 17px;
  font-weight: 500;
  padding: 12px 28px;
  border-radius: 980px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.cta-btn.primary {
  background: #0071e3;
  color: #fff;
}
.cta-btn.primary:hover {
  background: #0077ed;
  transform: scale(1.02);
}
.cta-btn .arrow {
  display: inline-block;
  transition: transform 0.2s;
}
.cta-btn:hover .arrow { transform: translateX(4px); }

.scroll-hint {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #86868b;
  font-size: 12px;
}
.scroll-line {
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, transparent, #86868b);
  animation: scrollAnim 1.8s ease-in-out infinite;
}
@keyframes scrollAnim {
  0%, 100% { opacity: 0.3; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(6px); }
}

/* ============ 淡入动画 ============ */
.fade-in {
  opacity: 0;
  animation: fadeUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ============ 统计条 ============ */
.stats-section {
  padding: 80px 24px;
  background: #fbfbfd;
}
.stats-grid {
  max-width: 800px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  text-align: center;
}
.stat-item { padding: 20px 0; }
.stat-num {
  font-size: clamp(40px, 5vw, 64px);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.stat-label {
  font-size: 15px;
  color: #86868b;
  font-weight: 500;
}

/* ============ 项目区 ============ */
.projects-section {
  padding: 120px 24px 80px;
  max-width: 1160px;
  margin: 0 auto;
}

.section-head {
  text-align: center;
  margin-bottom: 80px;
}
.section-eyebrow {
  font-size: 13px;
  font-weight: 600;
  color: #0071e3;
  letter-spacing: 0.1em;
  margin-bottom: 16px;
}
.section-title {
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 700;
  letter-spacing: -0.03em;
  margin: 0 0 16px;
  color: #1d1d1f;
  line-height: 1.1;
}
.section-desc {
  font-size: 18px;
  color: #86868b;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.5;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

/* ============ 项目卡片 ============ */
.product-card {
  position: relative;
  background: #fbfbfd;
  border-radius: 24px;
  padding: 32px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  opacity: 0;
  transform: translateY(30px);
  min-height: 280px;
  display: flex;
  flex-direction: column;
}
.product-card.in-view {
  opacity: 1;
  transform: translateY(0);
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 30px 60px -20px color-mix(in srgb, var(--c) 30%, transparent);
  background: #fff;
}

.card-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--c) 8%, transparent), transparent 50%);
  opacity: 0;
  transition: opacity 0.4s;
  pointer-events: none;
}
.product-card:hover .card-bg { opacity: 1; }

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.card-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--c) 12%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;
}
.product-card:hover .card-icon-wrap {
  transform: scale(1.05) rotate(-3deg);
}
.card-icon { font-size: 28px; }

.badge-ready {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #e8f5e9;
  color: #34c759;
  font-weight: 600;
}
.badge-soon {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #f5f5f7;
  color: #86868b;
  font-weight: 600;
}

.card-body {
  flex: 1;
  position: relative;
  z-index: 1;
}
.card-name {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1d1d1f;
  margin: 0 0 12px;
}
.card-text {
  font-size: 15px;
  color: #86868b;
  line-height: 1.5;
  margin: 0 0 20px;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.tag {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--c) 8%, transparent);
  color: var(--c);
  font-weight: 500;
}

.card-action {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  font-size: 14px;
  font-weight: 600;
  color: #0071e3;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: gap 0.2s;
}
.product-card:hover .card-action { gap: 10px; }

.product-card.disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.product-card.disabled:hover {
  transform: none;
  box-shadow: none;
  background: #fbfbfd;
}
.product-card.disabled:hover .card-bg { opacity: 0; }
.product-card.disabled:hover .card-icon-wrap { transform: none; }

/* ============ 页脚 ============ */
.footer {
  padding: 80px 24px 60px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #fbfbfd;
  text-align: center;
}
.footer-content {
  max-width: 600px;
  margin: 0 auto;
}
.footer-brand {
  font-size: 20px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}
.footer-text {
  font-size: 14px;
  color: #86868b;
  margin-bottom: 8px;
}
.footer-meta {
  font-size: 13px;
  color: #c7c7cc;
}

/* ============ 响应式 ============ */
@media (max-width: 980px) {
  .projects-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .nav-inner { padding: 12px 16px; }
  .user-name { display: none; }
  .stats-section { padding: 60px 24px; }
  .stats-grid { gap: 20px; }
  .projects-section { padding: 80px 16px 40px; }
  .section-head { margin-bottom: 48px; }
  .projects-grid { grid-template-columns: 1fr; gap: 16px; }
  .product-card { padding: 24px; min-height: auto; }
  .hero-cta { flex-direction: column; align-items: center; }
  .footer { padding: 60px 16px 40px; }
}
</style>
