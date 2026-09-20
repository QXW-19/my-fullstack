<template>
  <div class="detail-apple">
    <!-- 导航 -->
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-left">
          <button class="back-btn" @click="$router.back()">
            <span>←</span>
            <span>返回</span>
          </button>
        </div>
        <div class="nav-right">
          <button class="icon-btn" @click="onEdit" title="编辑">✏️</button>
          <NotificationBell />
        </div>
      </div>
    </nav>

    <main class="main" v-loading="loading">
      <article v-if="article.id" class="article">
        <!-- 文章头部 -->
        <header class="article-header">
          <span v-if="article.category" class="category">{{ article.category }}</span>

          <h1 class="title">{{ article.title }}</h1>

          <div class="meta">
            <div class="author">
              <div class="author-avatar">
                <img v-if="article.user?.avatar" :src="article.user.avatar" alt="" />
                <span v-else>{{ article.user?.username?.[0]?.toUpperCase() }}</span>
              </div>
              <span class="author-name">{{ article.user?.username }}</span>
            </div>
            <span class="divider">·</span>
            <span class="date">{{ formatFullDate(article.createdAt) }}</span>
            <span class="divider">·</span>
            <span class="views">👁 {{ article.view_count }}</span>
          </div>

          <div class="tags" v-if="article.tags?.length">
            <span v-for="t in article.tags" :key="t.id" class="tag">#{{ t.name }}</span>
          </div>
        </header>

        <div class="article-divider"></div>

        <!-- Markdown 内容 -->
        <div class="markdown-body" v-html="safeHtml"></div>

        <!-- 底部 -->
        <footer class="article-footer">
          <div class="thanks">感谢阅读 🐾</div>
        </footer>
      </article>

      <div v-else-if="!loading" class="empty">
        <div class="empty-icon">📄</div>
        <div class="empty-title">文章不存在</div>
        <div class="empty-desc">可能已被删除</div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DOMPurify from 'dompurify';
import { getArticle } from '@/api/article';
import NotificationBell from '@/components/NotificationBell.vue';
import 'highlight.js/styles/github.css';

const route = useRoute();
const router = useRouter();
const article = ref({});
const loading = ref(false);

const safeHtml = computed(() => DOMPurify.sanitize(article.value.html || ''));

function formatFullDate(t) {
  if (!t) return '';
  return new Date(t).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

function onEdit() {
  if (article.value.id) router.push(`/article/edit/${article.value.id}`);
}

onMounted(async () => {
  loading.value = true;
  try {
    article.value = await getArticle(route.params.id);
  } catch (e) {}
  loading.value = false;
});
</script>

<style scoped>
.detail-apple {
  min-height: 100vh;
  background: #fff;
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
.nav-left, .nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.back-btn, .icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #1d1d1f;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}
.back-btn:hover, .icon-btn:hover { background: rgba(0, 0, 0, 0.05); }

/* 主体 */
.main {
  max-width: 768px;
  margin: 0 auto;
  padding: 60px 24px 100px;
}

/* 文章头部 */
.article-header {
  text-align: center;
  margin-bottom: 48px;
}
.category {
  display: inline-block;
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(0, 113, 227, 0.1);
  color: #0071e3;
  font-weight: 600;
  margin-bottom: 20px;
}
.title {
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.15;
  color: #1d1d1f;
  margin: 0 0 24px;
}
.meta {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #86868b;
  flex-wrap: wrap;
}
.author { display: flex; align-items: center; gap: 8px; }
.author-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}
.author-avatar img { width: 100%; height: 100%; object-fit: cover; }
.author-name { font-weight: 500; color: #1d1d1f; }
.divider { color: #c7c7cc; }

.tags {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  flex-wrap: wrap;
}
.tag {
  font-size: 13px;
  color: #0071e3;
  font-weight: 500;
}

.article-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  margin-bottom: 48px;
}

/* Markdown 内容 */
.markdown-body {
  font-size: 17px;
  line-height: 1.75;
  color: #1d1d1f;
  letter-spacing: -0.003em;
}
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 1.6em 0 0.6em;
  line-height: 1.3;
  color: #1d1d1f;
}
.markdown-body :deep(h1) { font-size: 32px; }
.markdown-body :deep(h2) { font-size: 26px; padding-bottom: 8px; border-bottom: 1px solid rgba(0, 0, 0, 0.06); }
.markdown-body :deep(h3) { font-size: 21px; }
.markdown-body :deep(p) { margin: 0 0 1.2em; }
.markdown-body :deep(a) { color: #0071e3; text-decoration: none; }
.markdown-body :deep(a:hover) { text-decoration: underline; }
.markdown-body :deep(code) {
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'SF Mono', Monaco, Menlo, monospace;
}
.markdown-body :deep(pre) {
  background: #f5f5f7;
  padding: 20px 24px;
  border-radius: 12px;
  overflow-x: auto;
  margin: 1.5em 0;
  font-size: 14px;
  line-height: 1.6;
}
.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: 14px;
}
.markdown-body :deep(blockquote) {
  border-left: 3px solid #0071e3;
  padding: 4px 0 4px 20px;
  margin: 1.5em 0;
  color: #86868b;
  font-style: italic;
}
.markdown-body :deep(ul), .markdown-body :deep(ol) {
  padding-left: 1.5em;
  margin: 0 0 1.2em;
}
.markdown-body :deep(li) { margin-bottom: 0.4em; }
.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 12px;
  margin: 1.5em 0;
}
.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  font-size: 15px;
}
.markdown-body :deep(th), .markdown-body :deep(td) {
  padding: 10px 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  text-align: left;
}
.markdown-body :deep(th) {
  background: #f5f5f7;
  font-weight: 600;
}
.markdown-body :deep(hr) {
  border: none;
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  margin: 2em 0;
}

/* 底部 */
.article-footer {
  margin-top: 80px;
  padding-top: 40px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  text-align: center;
}
.thanks {
  font-size: 15px;
  color: #86868b;
}

/* 空状态 */
.empty { text-align: center; padding: 120px 20px; }
.empty-icon { font-size: 64px; margin-bottom: 20px; }
.empty-title {
  font-size: 22px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 8px;
}
.empty-desc { font-size: 15px; color: #86868b; }

/* 响应式 */
@media (max-width: 640px) {
  .nav-inner { padding: 12px 16px; }
  .main { padding: 32px 20px 60px; }
  .article-header { margin-bottom: 32px; }
  .title { font-size: 26px; }
  .markdown-body { font-size: 16px; }
  .article-divider { margin-bottom: 32px; }
}
</style>
