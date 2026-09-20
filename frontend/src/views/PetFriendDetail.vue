<template>
  <div class="friend-detail-page">
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <button class="nav-back" @click="$router.back()">←</button>
          <span class="brand-icon">🐾</span>
          <span class="brand-text">{{ owner?.username }} 的宠物</span>
        </div>
        <div class="nav-actions">
          <NotificationBell />
        </div>
      </div>
    </nav>

    <main class="main" v-loading="loading">
      <template v-if="pet">
        <!-- 宠物展示 -->
        <div class="pet-stage">
          <div class="pet-display" :class="pet.stage">
            <div class="pet-emoji">{{ pet.emoji }}</div>
            <div class="pet-shadow"></div>
          </div>
          <div class="pet-info">
            <h2 class="pet-name">{{ pet.name }}</h2>
            <div class="pet-meta">
              <span class="stage-tag">{{ stageLabel }}</span>
              <span class="level-tag">Lv.{{ pet.level }}</span>
              <span class="health-tag" :class="healthClass(pet.health)">健康 {{ pet.health }}</span>
            </div>
          </div>
        </div>

        <!-- 属性条 -->
        <div class="stats-card">
          <div class="stat-row" v-for="s in statList" :key="s.key">
            <span class="stat-icon">{{ s.icon }}</span>
            <span class="stat-label">{{ s.label }}</span>
            <div class="stat-bar">
              <div class="stat-fill" :class="barClass(pet[s.key])" :style="{ width: pet[s.key] + '%' }"></div>
            </div>
            <span class="stat-value">{{ Math.round(pet[s.key]) }}</span>
          </div>
        </div>

        <!-- 帮助操作 -->
        <div class="help-section">
          <h3 class="help-title">帮 TA 照顾一下</h3>
          <div class="help-grid">
            <button class="help-btn feed" @click="onHelp('feed')" :disabled="helping">
              <span class="help-icon">🍖</span>
              <span>喂食</span>
              <span class="help-effect">+15饱食</span>
            </button>
            <button class="help-btn play" @click="onHelp('play')" :disabled="helping">
              <span class="help-icon">🎮</span>
              <span>陪玩</span>
              <span class="help-effect">+15心情</span>
            </button>
            <button class="help-btn clean" @click="onHelp('clean')" :disabled="helping">
              <span class="help-icon">🛁</span>
              <span>洗澡</span>
              <span class="help-effect">+15清洁</span>
            </button>
          </div>
        </div>

        <!-- 留言 -->
        <div class="message-section">
          <h3 class="message-title">💬 留个言</h3>
          <div class="message-input-wrap">
            <textarea
              v-model="newMessage"
              placeholder="说点什么..."
              maxlength="200"
              rows="2"
            ></textarea>
            <button class="send-btn" :disabled="!newMessage.trim()" @click="onSendMessage">
              发送
            </button>
          </div>
        </div>

        <!-- 最近访客 -->
        <div class="visitors-section">
          <h3 class="visitors-title">👣 最近访客</h3>
          <div v-if="!recentVisits.length" class="no-visitors">还没有人访问过</div>
          <div v-else class="visitors-list">
            <div v-for="v in recentVisits" :key="v.id" class="visitor-item">
              <div class="visitor-avatar">
                <img v-if="v.visitor?.avatar" :src="v.visitor.avatar" alt="" />
                <span v-else>{{ v.visitor?.username?.[0]?.toUpperCase() }}</span>
              </div>
              <div class="visitor-info">
                <div class="visitor-name">{{ v.visitor?.username }}</div>
                <div class="visitor-action">
                  {{ actionLabels[v.action] || '访问了' }}
                  <span v-if="v.message" class="visitor-msg">「{{ v.message }}」</span>
                </div>
              </div>
              <div class="visitor-time">{{ formatTime(v.created_at) }}</div>
            </div>
          </div>
        </div>
      </template>

      <div v-else-if="!loading" class="empty">
        <div class="empty-icon">😿</div>
        <div class="empty-title">宠物不存在</div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getFriendPet, helpFriendPet, messageFriendPet } from '@/api/petFriend';
import NotificationBell from '@/components/NotificationBell.vue';

const route = useRoute();
const pet = ref(null);
const owner = ref(null);
const recentVisits = ref([]);
const loading = ref(false);
const helping = ref(false);
const newMessage = ref('');

const actionLabels = {
  visit: '来看了看',
  feed: '喂了食 🍖',
  play: '陪玩 🎮',
  clean: '洗了澡 🛁',
  message: '留言了'
};

const statList = [
  { key: 'hunger', icon: '🍖', label: '饱食' },
  { key: 'mood',   icon: '😊', label: '心情' },
  { key: 'clean',  icon: '✨', label: '清洁' },
  { key: 'energy', icon: '⚡', label: '精力' }
];

const stageLabel = computed(() => {
  const map = { egg: '🥚 蛋', baby: '🐣 幼年', adult: '🌟 成年', sick: '🤒 生病', dead: '💔 离开' };
  return map[pet.value?.stage] || '';
});

function barClass(v) {
  if (v < 15) return 'danger';
  if (v < 30) return 'warning';
  return 'normal';
}

function healthClass(v) {
  if (v < 30) return 'danger';
  if (v < 60) return 'warning';
  return 'good';
}

function formatTime(t) {
  const d = new Date(t);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

async function loadData() {
  loading.value = true;
  try {
    const data = await getFriendPet(route.params.petId);
    pet.value = data.pet;
    owner.value = data.owner;
    recentVisits.value = data.recentVisits || [];
  } catch (e) {
    ElMessage.error(e.message);
  }
  loading.value = false;
}

async function onHelp(action) {
  if (helping.value) return;
  helping.value = true;
  try {
    await helpFriendPet(pet.value.id, action);
    ElMessage.success('帮助成功！❤️');
    // 刷新详情
    await loadData();
  } catch (e) {
    ElMessage.error(e.message);
  }
  helping.value = false;
}

async function onSendMessage() {
  if (!newMessage.value.trim()) return;
  try {
    await messageFriendPet(pet.value.id, newMessage.value.trim());
    ElMessage.success('留言成功');
    newMessage.value = '';
    await loadData();
  } catch (e) {
    ElMessage.error(e.message);
  }
}

onMounted(loadData);
</script>

<style scoped>
.friend-detail-page { min-height: 100vh; background: linear-gradient(180deg, #e0f2ff 0%, #f5f0ff 40%, #fff5f0 100%); font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', sans-serif; color: #1d1d1f; }
.nav { position: sticky; top: 0; z-index: 100; background: rgba(255, 255, 255, 0.72); backdrop-filter: saturate(180%) blur(20px); border-bottom: 1px solid rgba(0, 0, 0, 0.06); }
.nav-inner { max-width: 700px; margin: 0 auto; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; }
.nav-brand { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600; }
.nav-back { background: transparent; border: none; font-size: 20px; cursor: pointer; color: #1d1d1f; padding: 4px 8px; border-radius: 8px; }
.brand-icon { font-size: 20px; }
.main { max-width: 700px; margin: 0 auto; padding: 40px 24px 100px; }

.pet-stage { text-align: center; margin-bottom: 28px; position: relative; padding: 40px 20px 20px; }
.pet-stage::before { content: ''; position: absolute; top: 40px; left: 50%; transform: translateX(-50%); width: 260px; height: 260px; border-radius: 50%; background: radial-gradient(circle, rgba(255, 220, 150, 0.35), transparent 70%); animation: auraPulse 4s ease-in-out infinite; z-index: 0; }
@keyframes auraPulse { 0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.7; } 50% { transform: translateX(-50%) scale(1.1); opacity: 1; } }
.pet-display { position: relative; height: 220px; display: flex; align-items: center; justify-content: center; z-index: 1; }
.pet-emoji { font-size: 160px; line-height: 1; animation: breathe 3s ease-in-out infinite; filter: drop-shadow(0 12px 24px rgba(255, 180, 100, 0.3)); }
@keyframes breathe { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.05) translateY(-4px); } }
.pet-shadow { position: absolute; bottom: 30px; width: 120px; height: 12px; border-radius: 50%; background: radial-gradient(ellipse, rgba(0, 0, 0, 0.15), transparent 70%); filter: blur(6px); }
.pet-info { text-align: center; position: relative; z-index: 2; }
.pet-name { font-size: 30px; font-weight: 800; margin: 0 0 12px; letter-spacing: -0.03em; }
.pet-meta { display: flex; justify-content: center; gap: 10px; font-size: 13px; }
.stage-tag, .level-tag, .health-tag { padding: 5px 14px; border-radius: 999px; font-weight: 600; background: rgba(255, 255, 255, 0.7); }
.level-tag { background: linear-gradient(135deg, #af52de, #7c4dff); color: #fff; }
.health-tag.good { background: rgba(52, 199, 89, 0.15); color: #34c759; }
.health-tag.warning { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
.health-tag.danger { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }

.stats-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border-radius: 20px; padding: 22px; margin-bottom: 20px; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.06); }
.stat-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
.stat-icon { font-size: 20px; width: 26px; text-align: center; }
.stat-label { font-size: 13px; font-weight: 600; width: 44px; }
.stat-bar { flex: 1; height: 12px; background: rgba(0, 0, 0, 0.06); border-radius: 999px; overflow: hidden; }
.stat-fill { height: 100%; border-radius: 999px; transition: width 0.8s; }
.stat-fill.normal { background: linear-gradient(90deg, #34c759, #5ac8fa); }
.stat-fill.warning { background: linear-gradient(90deg, #ff9500, #ffcc00); }
.stat-fill.danger { background: linear-gradient(90deg, #ff3b30, #ff6b5b); }
.stat-value { font-size: 15px; font-weight: 700; width: 40px; text-align: right; }

.help-section, .message-section, .visitors-section { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border-radius: 20px; padding: 22px; margin-bottom: 20px; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.06); }
.help-title, .message-title, .visitors-title { font-size: 15px; font-weight: 700; margin: 0 0 14px; }

.help-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.help-btn { padding: 16px 8px; border: none; border-radius: 16px; cursor: pointer; transition: all 0.3s; display: flex; flex-direction: column; align-items: center; gap: 6px; font-family: inherit; font-size: 13px; font-weight: 700; color: #fff; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12); }
.help-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.help-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(0, 0, 0, 0.18); }
.help-btn.feed { background: linear-gradient(135deg, #ff9500, #ff6b00); }
.help-btn.play { background: linear-gradient(135deg, #af52de, #7c4dff); }
.help-btn.clean { background: linear-gradient(135deg, #5ac8fa, #0071e3); }
.help-icon { font-size: 24px; }
.help-effect { font-size: 10px; opacity: 0.85; }

.message-input-wrap { display: flex; gap: 10px; align-items: flex-end; }
.message-input-wrap textarea { flex: 1; padding: 10px 14px; border: 1px solid rgba(0, 0, 0, 0.08); border-radius: 12px; font-size: 14px; font-family: inherit; outline: none; resize: none; background: #fff; transition: all 0.2s; }
.message-input-wrap textarea:focus { border-color: #0071e3; box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1); }
.send-btn { padding: 10px 20px; border-radius: 999px; border: none; background: #0071e3; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
.send-btn:hover:not(:disabled) { background: #0077ed; }
.send-btn:disabled { background: #e5e5ea; color: #a1a1a6; cursor: not-allowed; }

.visitors-list { display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; }
.no-visitors { color: #c7c7cc; font-size: 13px; text-align: center; padding: 20px; }
.visitor-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(0, 0, 0, 0.04); }
.visitor-item:last-child { border-bottom: none; }
.visitor-avatar { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; font-size: 14px; font-weight: 600; flex-shrink: 0; }
.visitor-avatar img { width: 100%; height: 100%; object-fit: cover; }
.visitor-info { flex: 1; min-width: 0; }
.visitor-name { font-size: 13px; font-weight: 600; }
.visitor-action { font-size: 12px; color: #86868b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.visitor-msg { color: #0071e3; font-style: italic; }
.visitor-time { font-size: 11px; color: #c7c7cc; flex-shrink: 0; }

.empty { text-align: center; padding: 80px 20px; }
.empty-icon { font-size: 56px; margin-bottom: 16px; }
.empty-title { font-size: 18px; font-weight: 600; }

@media (max-width: 640px) {
  .nav-inner { padding: 12px 16px; }
  .main { padding: 32px 16px 80px; }
  .pet-emoji { font-size: 120px; }
  .pet-name { font-size: 24px; }
  .help-grid { grid-template-columns: 1fr; }
}
</style>
