<template>
  <article class="article-card" @click="$router.push(`/article/${article.id}`)">
    <div class="card-cover" v-if="article.cover">
      <img :src="article.cover" alt="" />
    </div>

    <div class="card-body">
      <div class="card-meta-top">
        <span v-if="article.category" class="category-badge">{{ article.category }}</span>
      </div>

      <h3 class="card-title">{{ article.title }}</h3>
      <p class="card-summary">{{ article.summary || '暂无摘要' }}</p>

      <div class="card-tags" v-if="article.tags?.length">
        <span v-for="t in article.tags" :key="t.id" class="tag">#{{ t.name }}</span>
      </div>

      <div class="card-footer">
        <div class="author">
          <div class="author-avatar">
            <img v-if="article.user?.avatar" :src="article.user.avatar" alt="" />
            <span v-else>{{ article.user?.username?.[0]?.toUpperCase() }}</span>
          </div>
          <span class="author-name">{{ article.user?.username }}</span>
        </div>
        <div class="stats">
          <span class="stat-item">📅 {{ formatDate(article.createdAt) }}</span>
          <span class="stat-item">👁 {{ article.view_count || 0 }}</span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
defineProps({ article: { type: Object, required: true } });

function formatDate(t) {
  const d = new Date(t);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 86400) return '今天';
  if (diff < 172800) return '昨天';
  if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`;
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' });
}
</script>

<style scoped>
.article-card {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}
.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -16px rgba(0, 0, 0, 0.12);
  border-color: rgba(0, 0, 0, 0.08);
}

.card-cover {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #f5f5f7;
}
.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}
.article-card:hover .card-cover img {
  transform: scale(1.05);
}

.card-body {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-meta-top {
  margin-bottom: 12px;
  min-height: 22px;
}
.category-badge {
  display: inline-block;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(0, 113, 227, 0.1);
  color: #0071e3;
  font-weight: 600;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #1d1d1f;
  letter-spacing: -0.02em;
  line-height: 1.35;
  margin: 0 0 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-summary {
  font-size: 14px;
  color: #86868b;
  line-height: 1.55;
  margin: 0 0 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.tag {
  font-size: 12px;
  color: #0071e3;
  font-weight: 500;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.author {
  display: flex;
  align-items: center;
  gap: 8px;
}
.author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
}
.author-avatar img {
  width: 100%; height: 100%;
  object-fit: cover;
}
.author-name {
  font-size: 13px;
  color: #86868b;
  font-weight: 500;
}

.stats { display: flex; gap: 12px; }
.stat-item {
  font-size: 12px;
  color: #c7c7cc;
}
</style>
