<template>
  <div class="friends-page">
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <button class="nav-back" @click="$router.push('/pet')">←</button>
          <span class="brand-icon">👥</span>
          <span class="brand-text">好友</span>
        </div>
        <div class="nav-actions">
          <NotificationBell />
        </div>
      </div>
    </nav>

    <main class="main">
      <div class="hero">
        <h1 class="hero-title">去看看<span class="gradient-text">小伙伴</span></h1>
        <p class="hero-subtitle">帮朋友的宠物喂食、玩耍，留下足迹</p>
      </div>

      <div class="rank-section" v-if="rank.length">
        <div class="rank-header">
          <span class="rank-icon">🏆</span>
          <span class="rank-title">互访达人榜</span>
        </div>
        <div class="rank-list">
          <div v-for="(r, i) in rank" :key="r.id" class="rank-item">
            <div class="rank-num">{{ i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i+1 }}</div>
            <div class="rank-avatar">
              <img v-if="r.avatar" :src="r.avatar" alt="" />
              <span v-else>{{ r.username?.[0]?.toUpperCase() }}</span>
            </div>
            <div class="rank-name">{{ r.username }}</div>
            <div class="rank-count">{{ r.helpCount }} 次</div>
          </div>
        </div>
      </div>

      <div class="friends-section">
        <div class="section-title">
          <span>好友列表</span>
          <span class="count-badge">{{ list.length }}</span>
        </div>

        <div class="friends-grid" v-loading="loading">
          <div
            v-for="u in list"
            :key="u.id"
            class="friend-card"
            :class="{ 'no-pet': !u.hasPet }"
            @click="u.hasPet && goToPet(u)"
          >
            <div class="friend-avatar">
              <img v-if="u.avatar" :src="u.avatar" alt="" />
              <span v-else>{{ u.username?.[0]?.toUpperCase() }}</span>
            </div>
            <div class="friend-name">{{ u.username }}</div>

            <div v-if="u.hasPet" class="friend-pet">
              <div class="pet-emoji">{{ u.pet.emoji }}</div>
              <div class="pet-info">
                <div class="pet-name">{{ u.pet.name }}</div>
                <div class="pet-meta">Lv.{{ u.pet.level }}</div>
              </div>
              <div class="pet-health" :class="healthClass(u.pet.health)">
                {{ u.pet.health }}
              </div>
            </div>
            <div v-else class="no-pet-tip">还没有宠物</div>
          </div>

          <div v-if="!loading && !list.length" class="empty">
            <div class="empty-icon">👥</div>
            <div class="empty-title">还没有其他用户</div>
            <div class="empty-desc">邀请朋友来玩吧</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getFriendList, getHelperRank } from '@/api/petFriend';
import NotificationBell from '@/components/NotificationBell.vue';

const router = useRouter();
const list = ref([]);
const rank = ref([]);
const loading = ref(false);

function healthClass(v) {
  if (v < 30) return 'danger';
  if (v < 60) return 'warning';
  return 'good';
}

function goToPet(u) {
  router.push(`/pet/friend/${u.pet.id}`);
}

onMounted(async () => {
  loading.value = true;
  try {
    const [listData, rankData] = await Promise.all([
      getFriendList(),
      getHelperRank().catch(() => [])
    ]);
    list.value = listData;
    rank.value = rankData;
  } catch (e) {}
  loading.value = false;
});
</script>

<style scoped>
.friends-page { min-height: 100vh; background: linear-gradient(180deg, #e0f2ff 0%, #f5f0ff 40%, #fff5f0 100%); font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', sans-serif; color: #1d1d1f; }
.nav { position: sticky; top: 0; z-index: 100; background: rgba(255, 255, 255, 0.72); backdrop-filter: saturate(180%) blur(20px); border-bottom: 1px solid rgba(0, 0, 0, 0.06); }
.nav-inner { max-width: 900px; margin: 0 auto; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; }
.nav-brand { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 600; }
.nav-back { background: transparent; border: none; font-size: 20px; cursor: pointer; color: #1d1d1f; padding: 4px 8px; border-radius: 8px; }
.brand-icon { font-size: 20px; }
.main { max-width: 900px; margin: 0 auto; padding: 40px 24px 100px; }
.hero { text-align: center; margin-bottom: 32px; }
.hero-title { font-size: clamp(32px, 5vw, 48px); font-weight: 800; letter-spacing: -0.03em; margin: 0 0 12px; }
.gradient-text { background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.hero-subtitle { font-size: 16px; color: #86868b; margin: 0; }
.rank-section { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border-radius: 20px; padding: 20px; margin-bottom: 24px; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.06); }
.rank-header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; font-weight: 700; }
.rank-icon { font-size: 20px; }
.rank-list { display: flex; flex-direction: column; gap: 6px; }
.rank-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 12px; }
.rank-num { width: 28px; font-size: 16px; text-align: center; font-weight: 700; }
.rank-avatar { width: 32px; height: 32px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; font-size: 13px; font-weight: 600; }
.rank-avatar img { width: 100%; height: 100%; object-fit: cover; }
.rank-name { flex: 1; font-size: 14px; font-weight: 500; }
.rank-count { font-size: 13px; color: #ff9500; font-weight: 700; }
.section-title { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; font-size: 15px; font-weight: 600; }
.count-badge { background: rgba(0, 113, 227, 0.1); color: #0071e3; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.friends-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.friend-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border-radius: 20px; padding: 18px; border: 1px solid rgba(255, 255, 255, 0.8); cursor: pointer; transition: all 0.3s; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.friend-card:hover:not(.no-pet) { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(102, 126, 234, 0.15); border-color: rgba(102, 126, 234, 0.3); }
.friend-card.no-pet { cursor: not-allowed; opacity: 0.55; }
.friend-avatar { width: 56px; height: 56px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; font-size: 22px; font-weight: 700; }
.friend-avatar img { width: 100%; height: 100%; object-fit: cover; }
.friend-name { font-size: 14px; font-weight: 600; }
.friend-pet { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(102, 126, 234, 0.08); border-radius: 12px; width: 100%; }
.pet-emoji { font-size: 26px; }
.pet-info { flex: 1; }
.pet-name { font-size: 13px; font-weight: 600; }
.pet-meta { font-size: 11px; color: #86868b; }
.pet-health { font-size: 13px; font-weight: 700; width: 30px; text-align: right; }
.pet-health.good { color: #34c759; }
.pet-health.warning { color: #ff9500; }
.pet-health.danger { color: #ff3b30; }
.no-pet-tip { font-size: 12px; color: #c7c7cc; padding: 12px 0; }
.empty { text-align: center; padding: 60px 20px; grid-column: 1 / -1; }
.empty-icon { font-size: 56px; margin-bottom: 16px; }
.empty-title { font-size: 18px; font-weight: 600; margin-bottom: 6px; }
.empty-desc { font-size: 14px; color: #86868b; }
@media (max-width: 640px) {
  .nav-inner { padding: 12px 16px; }
  .main { padding: 32px 16px 80px; }
  .friends-grid { grid-template-columns: 1fr; }
  .hero-title { font-size: 28px; }
}
</style>
