<template>
  <div class="deco-page">
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <button class="nav-back" @click="$router.push('/pet')">←</button>
          <span class="brand-icon">🎩</span>
          <span class="brand-text">装扮商店</span>
        </div>
        <div class="nav-actions">
          <div class="coins-display">💰 {{ coins }}</div>
          <NotificationBell />
        </div>
      </div>
    </nav>

    <main class="main">
      <div class="hero">
        <h1 class="hero-title">给宠物<span class="gradient-text">打扮一下</span></h1>
        <p class="hero-subtitle">帽子 · 眼镜 · 背景</p>
      </div>

      <!-- 宠物预览 -->
      <div class="pet-preview" v-if="petEquipped">
        <div class="preview-stage" :style="bgStyle">
          <div class="preview-pet">
            <span class="pet-emoji">{{ petEmoji }}</span>
            <span v-if="equippedIcons.hat" class="deco-hat">{{ equippedIcons.hat }}</span>
            <span v-if="equippedIcons.glasses" class="deco-glasses">{{ equippedIcons.glasses }}</span>
          </div>
        </div>
        <div class="preview-label">当前装扮</div>
      </div>

      <!-- 分类 Tab -->
      <div class="tabs">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="tab"
          :class="{ active: activeTab === t.key }"
          @click="activeTab = t.key"
        >
          <span class="tab-icon">{{ t.icon }}</span>
          <span>{{ t.name }}</span>
        </button>
      </div>

      <!-- 装扮网格 -->
      <div class="deco-grid" v-loading="loading">
        <div
          v-for="d in filteredList"
          :key="d.id"
          class="deco-card"
          :class="[`rarity-${d.rarity}`, { owned: d.owned, equipped: d.equipped }]"
        >
          <div class="rarity-glow"></div>
          <div class="deco-icon">{{ d.icon }}</div>
          <div class="deco-name">{{ d.name }}</div>
          <div class="deco-rarity">{{ rarityLabels[d.rarity] }}</div>

          <button
            v-if="!d.owned"
            class="deco-btn buy"
            :disabled="coins < d.price"
            @click="onBuy(d)"
          >
            💰 {{ d.price }}
          </button>
          <button
            v-else
            class="deco-btn toggle"
            :class="{ 'is-equipped': d.equipped }"
            @click="onToggle(d)"
          >
            {{ d.equipped ? '卸下' : '装备' }}
          </button>
        </div>

        <div v-if="!loading && !filteredList.length" class="empty">
          <div class="empty-icon">🎩</div>
          <div class="empty-title">还没有装扮</div>
          <div class="empty-desc">赚金币来解锁吧</div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getDecorationList, buyDecoration, toggleDecoration } from '@/api/petDecoration';
import { getPet } from '@/api/pet';
import NotificationBell from '@/components/NotificationBell.vue';

const list = ref([]);
const coins = ref(0);
const loading = ref(false);
const activeTab = ref('all');
const petEquipped = ref({});
const petEmoji = ref('🐱');

const tabs = [
  { key: 'all',     name: '全部', icon: '✨' },
  { key: 'hat',     name: '帽子', icon: '👒' },
  { key: 'glasses', name: '眼镜', icon: '👓' },
  { key: 'bg',      name: '背景', icon: '🌈' }
];

const rarityLabels = {
  common: '普通',
  rare: '稀有',
  legendary: '传说'
};

const filteredList = computed(() => {
  if (activeTab.value === 'all') return list.value;
  return list.value.filter(d => d.type === activeTab.value);
});

// 已装备的图标（从 list 里找）
const equippedIcons = computed(() => {
  const eq = petEquipped.value || {};
  const find = (id) => list.value.find(d => d.id === id);
  return {
    hat: find(eq.hat)?.icon,
    glasses: find(eq.glasses)?.icon,
    bg: find(eq.bg)?.icon
  };
});

const bgStyle = computed(() => {
  const eq = petEquipped.value || {};
  const bg = list.value.find(d => d.id === eq.bg);
  return bg ? { background: 'linear-gradient(180deg, rgba(102,126,234,0.15), rgba(118,75,162,0.1))' } : {};
});

async function loadList() {
  loading.value = true;
  try {
    const data = await getDecorationList();
    list.value = data.list;
    coins.value = data.coins;
    petEquipped.value = data.equipped || {};
  } catch (e) {
    ElMessage.error(e.message);
  }
  loading.value = false;
}

async function loadPet() {
  try {
    const p = await getPet();
    if (p) {
      petEmoji.value = p.speciesInfo?.emoji || '🐱';
      petEquipped.value = p.equipped || petEquipped.value;
    }
  } catch (e) {}
}

async function onBuy(d) {
  try {
    const res = await buyDecoration(d.id);
    coins.value = res.coins;
    d.owned = true;
    d.ownedId = res.ownedId;
    ElMessage.success(`购买 ${d.name} 成功！`);
  } catch (e) {
    ElMessage.error(e.message);
  }
}

async function onToggle(d) {
  try {
    const res = await toggleDecoration(d.ownedId);
    d.equipped = res.action === 'equip';

    // 同类型的其他装扮取消装备
    if (res.action === 'equip') {
      list.value.forEach(x => {
        if (x.id !== d.id && x.type === d.type) x.equipped = false;
      });
    }

    petEquipped.value = res.equipped || {};
    ElMessage.success(res.action === 'equip' ? `已装备 ${d.name}` : '已卸下');
  } catch (e) {
    ElMessage.error(e.message);
  }
}

onMounted(async () => {
  await loadList();
  await loadPet();
});
</script>

<style scoped>
.deco-page { min-height: 100vh; background: linear-gradient(180deg, #e0f2ff 0%, #f5f0ff 40%, #fff5f0 100%); font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', sans-serif; color: #1d1d1f; }
.nav { position: sticky; top: 0; z-index: 100; background: rgba(255, 255, 255, 0.72); backdrop-filter: saturate(180%) blur(20px); border-bottom: 1px solid rgba(0, 0, 0, 0.06); }
.nav-inner { max-width: 900px; margin: 0 auto; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; }
.nav-brand { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 600; }
.nav-back { background: transparent; border: none; font-size: 20px; cursor: pointer; color: #1d1d1f; padding: 4px 8px; border-radius: 8px; }
.nav-back:hover { background: rgba(0, 0, 0, 0.05); }
.brand-icon { font-size: 20px; }
.nav-actions { display: flex; align-items: center; gap: 14px; }
.coins-display { font-size: 14px; font-weight: 700; color: #ff9500; background: rgba(255, 204, 0, 0.15); padding: 6px 14px; border-radius: 999px; }

.main { max-width: 900px; margin: 0 auto; padding: 40px 24px 100px; }
.hero { text-align: center; margin-bottom: 24px; }
.hero-title { font-size: clamp(28px, 4.5vw, 42px); font-weight: 800; letter-spacing: -0.03em; margin: 0 0 10px; }
.gradient-text { background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.hero-subtitle { font-size: 15px; color: #86868b; margin: 0; }

.pet-preview { display: flex; flex-direction: column; align-items: center; margin-bottom: 32px; }
.preview-stage { width: 200px; height: 200px; border-radius: 24px; background: rgba(255,255,255,0.6); display: flex; align-items: center; justify-content: center; position: relative; box-shadow: 0 12px 32px rgba(102,126,234,0.1); }
.preview-pet { position: relative; }
.pet-emoji { font-size: 120px; line-height: 1; display: block; animation: previewBreathe 3s ease-in-out infinite; }
@keyframes previewBreathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
.deco-hat { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 60px; }
.deco-glasses { position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); font-size: 50px; z-index: 2; }
.preview-label { font-size: 13px; color: #86868b; margin-top: 12px; }

.tabs { display: flex; gap: 8px; margin-bottom: 20px; justify-content: center; flex-wrap: wrap; }
.tab { display: flex; align-items: center; gap: 6px; padding: 8px 18px; border: none; border-radius: 999px; background: rgba(0, 0, 0, 0.04); color: #86868b; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.tab:hover { background: rgba(0, 0, 0, 0.06); }
.tab.active { background: #0071e3; color: #fff; }
.tab-icon { font-size: 15px; }

.deco-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.deco-card { position: relative; padding: 16px 12px; border-radius: 18px; background: #fff; border: 2px solid rgba(0,0,0,0.06); text-align: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; }
.deco-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1); }
.rarity-glow { position: absolute; inset: 0; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
.deco-card:hover .rarity-glow { opacity: 1; }
.rarity-common { border-color: rgba(142, 142, 147, 0.2); }
.rarity-rare { border-color: rgba(0, 113, 227, 0.3); }
.rarity-legendary { border-color: rgba(255, 204, 0, 0.5); box-shadow: 0 0 0 1px rgba(255, 204, 0, 0.2); }
.rarity-common .rarity-glow { background: radial-gradient(circle at top right, rgba(142,142,147,0.08), transparent 60%); }
.rarity-rare .rarity-glow { background: radial-gradient(circle at top right, rgba(0,113,227,0.15), transparent 60%); }
.rarity-legendary .rarity-glow { background: radial-gradient(circle at top right, rgba(255,204,0,0.2), transparent 60%); }

.deco-card.equipped { border-color: #34c759; background: rgba(52, 199, 89, 0.05); box-shadow: 0 0 0 2px rgba(52, 199, 89, 0.2); }

.deco-icon { font-size: 40px; line-height: 1; margin-bottom: 8px; }
.deco-name { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
.deco-rarity { font-size: 11px; color: #86868b; margin-bottom: 10px; }

.deco-btn { width: 100%; padding: 6px 12px; border-radius: 999px; border: none; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.deco-btn.buy { background: #0071e3; color: #fff; }
.deco-btn.buy:hover:not(:disabled) { background: #0077ed; transform: scale(1.03); }
.deco-btn.buy:disabled { background: #e5e5ea; color: #a1a1a6; cursor: not-allowed; }
.deco-btn.toggle { background: rgba(0, 0, 0, 0.06); color: #1d1d1f; }
.deco-btn.toggle:hover { background: rgba(0, 0, 0, 0.1); }
.deco-btn.toggle.is-equipped { background: #34c759; color: #fff; }

.empty { text-align: center; padding: 60px 20px; grid-column: 1 / -1; }
.empty-icon { font-size: 56px; margin-bottom: 16px; }
.empty-title { font-size: 18px; font-weight: 600; margin-bottom: 6px; }
.empty-desc { font-size: 14px; color: #86868b; }

@media (max-width: 640px) {
  .nav-inner { padding: 12px 16px; }
  .main { padding: 24px 16px 80px; }
  .hero-title { font-size: 26px; }
  .deco-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .deco-icon { font-size: 32px; }
  .preview-stage { width: 160px; height: 160px; }
  .pet-emoji { font-size: 96px; }
  .coins-display { font-size: 12px; padding: 4px 10px; }
}
</style>
