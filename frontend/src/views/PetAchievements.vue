<template>
  <div class="ach-page">
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <button class="nav-back" @click="$router.push('/pet')">←</button>
          <span class="brand-icon">🏆</span>
          <span class="brand-text">成就墙</span>
        </div>
        <div class="nav-actions">
          <NotificationBell />
        </div>
      </div>
    </nav>

    <main class="main">
      <div class="hero">
        <h1 class="hero-title">
          我的<span class="gradient-text">成就</span>
        </h1>
        <p class="hero-subtitle">
          已解锁 <span class="highlight">{{ unlockedCount }}</span> / {{ list.length }}
        </p>
      </div>

      <div class="progress-overview">
        <div class="progress-circle">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e5ea" stroke-width="8" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke="url(#gradient)" stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="circumference - (percent / 100) * circumference"
              transform="rotate(-90 60 60)"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#667eea" />
                <stop offset="100%" stop-color="#764ba2" />
              </linearGradient>
            </defs>
          </svg>
          <div class="circle-text">
            <div class="circle-num">{{ percent }}%</div>
            <div class="circle-label">完成度</div>
          </div>
        </div>
      </div>

      <div class="achievements-grid" v-loading="loading">
        <div
          v-for="a in list"
          :key="a.id"
          class="ach-card"
          :class="{ unlocked: a.unlocked }"
        >
          <div class="ach-icon-wrap">
            <span class="ach-icon">{{ a.icon }}</span>
            <div v-if="a.unlocked" class="unlock-badge">✓</div>
          </div>

          <div class="ach-body">
            <div class="ach-name">{{ a.name }}</div>
            <div class="ach-desc">{{ a.description }}</div>

            <div class="ach-progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: (a.progress / a.target * 100) + '%' }"
                ></div>
              </div>
              <div class="progress-text">
                <span>{{ Math.min(a.progress, a.target) }} / {{ a.target }}</span>
                <span class="reward">+{{ a.reward_coins }}💰</span>
              </div>
            </div>
          </div>

          <div v-if="a.unlocked" class="unlock-time">
            {{ formatTime(a.unlocked_at) }}
          </div>
        </div>

        <div v-if="!loading && !list.length" class="empty">
          <div class="empty-icon">🏆</div>
          <div class="empty-title">还没有成就</div>
          <div class="empty-desc">去陪宠物玩一玩吧</div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAchievements } from '@/api/pet';
import NotificationBell from '@/components/NotificationBell.vue';

const router = useRouter();
const list = ref([]);
const loading = ref(false);

const circumference = 2 * Math.PI * 52;

const unlockedCount = computed(() => list.value.filter(a => a.unlocked).length);
const percent = computed(() => {
  if (!list.value.length) return 0;
  return Math.round(unlockedCount.value / list.value.length * 100);
});

function formatTime(t) {
  if (!t) return '';
  const d = new Date(t);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

onMounted(async () => {
  loading.value = true;
  try {
    list.value = await getAchievements();
  } catch (e) {}
  loading.value = false;
});
</script>

<style scoped>
.ach-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #e0f2ff 0%, #f5f0ff 40%, #fff5f0 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', sans-serif;
  color: #1d1d1f;
}
.nav {
  position: sticky; top: 0; z-index: 100;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.nav-inner {
  max-width: 900px; margin: 0 auto; padding: 14px 24px;
  display: flex; justify-content: space-between; align-items: center;
}
.nav-brand { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 600; }
.nav-back { background: transparent; border: none; font-size: 20px; cursor: pointer; color: #1d1d1f; padding: 4px 8px; border-radius: 8px; }
.nav-back:hover { background: rgba(0, 0, 0, 0.05); }
.brand-icon { font-size: 20px; }

.main { max-width: 900px; margin: 0 auto; padding: 40px 24px 100px; }

.hero { text-align: center; margin-bottom: 32px; }
.hero-title { font-size: clamp(32px, 5vw, 48px); font-weight: 800; letter-spacing: -0.03em; margin: 0 0 12px; }
.gradient-text {
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.hero-subtitle { font-size: 16px; color: #86868b; margin: 0; }
.highlight { color: #0071e3; font-weight: 700; }

.progress-overview { display: flex; justify-content: center; margin-bottom: 40px; }
.progress-circle { position: relative; width: 140px; height: 140px; }
.progress-circle svg { width: 100%; height: 100%; }
.circle-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.circle-num { font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.circle-label { font-size: 12px; color: #86868b; }

.achievements-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
}
.ach-card {
  position: relative;
  display: flex; gap: 14px; padding: 20px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.06);
  transition: all 0.3s;
}
.ach-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(102, 126, 234, 0.12); }
.ach-card.unlocked { border-color: rgba(255, 204, 0, 0.4); background: linear-gradient(135deg, rgba(255, 250, 220, 0.9), rgba(255, 245, 220, 0.7)); }

.ach-icon-wrap { position: relative; flex-shrink: 0; }
.ach-icon {
  display: flex; align-items: center; justify-content: center;
  width: 52px; height: 52px; border-radius: 14px;
  background: rgba(0, 0, 0, 0.05); font-size: 28px;
}
.ach-card.unlocked .ach-icon { background: linear-gradient(135deg, #ffcc00, #ff9500); }
.unlock-badge {
  position: absolute; top: -4px; right: -4px;
  width: 20px; height: 20px; border-radius: 50%;
  background: #34c759; color: #fff;
  font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #fff;
}

.ach-body { flex: 1; min-width: 0; }
.ach-name { font-size: 15px; font-weight: 700; color: #1d1d1f; margin-bottom: 4px; }
.ach-desc { font-size: 13px; color: #86868b; margin-bottom: 10px; }

.ach-progress { display: flex; flex-direction: column; gap: 4px; }
.progress-bar { height: 6px; background: rgba(0, 0, 0, 0.06); border-radius: 999px; overflow: hidden; }
.progress-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.ach-card.unlocked .progress-fill { background: linear-gradient(90deg, #ffcc00, #ff9500); }
.progress-text {
  display: flex; justify-content: space-between;
  font-size: 11px; color: #86868b;
}
.reward { color: #ff9500; font-weight: 600; }

.unlock-time {
  position: absolute; bottom: 8px; right: 12px;
  font-size: 11px; color: #c7c7cc;
}

.empty { text-align: center; padding: 80px 20px; grid-column: 1 / -1; }
.empty-icon { font-size: 56px; margin-bottom: 16px; }
.empty-title { font-size: 18px; font-weight: 600; margin-bottom: 6px; }
.empty-desc { font-size: 14px; color: #86868b; }

@media (max-width: 640px) {
  .nav-inner { padding: 12px 16px; }
  .main { padding: 32px 16px 80px; }
  .achievements-grid { grid-template-columns: 1fr; }
  .hero-title { font-size: 28px; }
}
</style>
