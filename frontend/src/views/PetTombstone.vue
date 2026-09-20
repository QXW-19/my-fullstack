<template>
  <div class="tomb-page">
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <button class="nav-back" @click="$router.push('/pet')">←</button>
          <span class="brand-icon">🪦</span>
          <span class="brand-text">宠物墓地</span>
        </div>
        <div class="nav-actions">
          <NotificationBell />
        </div>
      </div>
    </nav>

    <main class="main" v-loading="loading">
      <template v-if="data">
        <div class="hero">
          <h1 class="hero-title">
            <span class="gradient-text">{{ data.pet_name }}</span> 的一生
          </h1>
          <p class="hero-subtitle">{{ data.is_dead ? '已经离开' : '还在你身边' }}</p>
        </div>

        <div class="status-card" :class="{ dead: data.is_dead }">
          <div class="status-icon">{{ data.is_dead ? '💀' : '💚' }}</div>
          <div class="status-main">
            <div class="status-title">
              {{ data.is_dead ? '已离开' : '活着' }}
            </div>
            <div class="status-detail" v-if="data.is_dead">
              {{ data.death_cause || '原因未知' }}
            </div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-label">死亡时间</div>
            <div class="stat-value">
              {{ data.died_at ? formatDate(data.died_at) : '—' }}
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">💀</div>
            <div class="stat-label">死亡原因</div>
            <div class="stat-value">{{ data.death_cause || '—' }}</div>
          </div>

          <div class="stat-card highlight">
            <div class="stat-icon">💫</div>
            <div class="stat-label">复活次数</div>
            <div class="stat-value">{{ data.revive_count || 0 }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🐾</div>
            <div class="stat-label">物种</div>
            <div class="stat-value">{{ speciesName }}</div>
          </div>
        </div>

        <div class="quote-card">
          <div class="quote-icon">🌸</div>
          <div class="quote-text">
            "每一次复活，都是一次重逢。"
          </div>
        </div>

        <button class="back-btn" @click="$router.push('/pet')">
          ← 回到宠物主页
        </button>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getTombstone } from '@/api/pet';
import NotificationBell from '@/components/NotificationBell.vue';

const data = ref(null);
const loading = ref(false);

const SPECIES_NAMES = {
  cat: '🐱 猫',
  dog: '🐶 狗',
  dragon: '🐉 龙',
  rabbit: '🐰 兔',
  panda: '🐼 熊猫'
};

const speciesName = computed(() => SPECIES_NAMES[data.value?.species] || '未知');

function formatDate(t) {
  if (!t) return '';
  return new Date(t).toLocaleString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

onMounted(async () => {
  loading.value = true;
  try {
    data.value = await getTombstone();
  } catch (e) {}
  loading.value = false;
});
</script>

<style scoped>
.tomb-page { min-height: 100vh; background: linear-gradient(180deg, #e0e0e8 0%, #d8d0e8 50%, #e8e0d8 100%); font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', sans-serif; color: #1d1d1f; }
.nav { position: sticky; top: 0; z-index: 100; background: rgba(255, 255, 255, 0.72); backdrop-filter: saturate(180%) blur(20px); border-bottom: 1px solid rgba(0, 0, 0, 0.06); }
.nav-inner { max-width: 700px; margin: 0 auto; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; }
.nav-brand { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 600; }
.nav-back { background: transparent; border: none; font-size: 20px; cursor: pointer; padding: 4px 8px; border-radius: 8px; }
.brand-icon { font-size: 20px; }
.main { max-width: 700px; margin: 0 auto; padding: 40px 24px 100px; }

.hero { text-align: center; margin-bottom: 32px; }
.hero-title { font-size: clamp(32px, 5vw, 48px); font-weight: 800; letter-spacing: -0.03em; margin: 0 0 12px; }
.gradient-text { background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.hero-subtitle { font-size: 16px; color: #86868b; margin: 0; }

.status-card { display: flex; align-items: center; gap: 16px; padding: 24px; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); border-radius: 20px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); margin-bottom: 24px; }
.status-card.dead { background: linear-gradient(135deg, rgba(80, 80, 90, 0.1), rgba(60, 60, 70, 0.05)); border: 1px solid rgba(80, 80, 90, 0.15); }
.status-icon { font-size: 56px; }
.status-main { flex: 1; }
.status-title { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
.status-detail { font-size: 14px; color: #86868b; margin-top: 4px; }

.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 24px; }
.stat-card { padding: 20px; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); border-radius: 18px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); text-align: center; }
.stat-card.highlight { background: linear-gradient(135deg, rgba(255, 204, 0, 0.15), rgba(255, 149, 0, 0.1)); border: 1px solid rgba(255, 204, 0, 0.3); }
.stat-icon { font-size: 28px; margin-bottom: 8px; }
.stat-label { font-size: 12px; color: #86868b; margin-bottom: 4px; }
.stat-value { font-size: 16px; font-weight: 700; }
.stat-card.highlight .stat-value { color: #ff9500; font-size: 20px; }

.quote-card { padding: 24px; background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(20px); border-radius: 20px; text-align: center; margin-bottom: 24px; border: 1px dashed rgba(0, 0, 0, 0.1); }
.quote-icon { font-size: 32px; margin-bottom: 8px; }
.quote-text { font-size: 15px; color: #6b6b7a; font-style: italic; font-weight: 500; }

.back-btn { width: 100%; padding: 16px; border-radius: 16px; border: none; background: #0071e3; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
.back-btn:hover { background: #0077ed; transform: translateY(-2px); }

@media (max-width: 640px) {
  .nav-inner { padding: 12px 16px; }
  .main { padding: 32px 16px 80px; }
  .hero-title { font-size: 28px; }
  .stats-grid { grid-template-columns: 1fr; }
  .status-card { padding: 20px; }
  .status-icon { font-size: 44px; }
}
</style>
