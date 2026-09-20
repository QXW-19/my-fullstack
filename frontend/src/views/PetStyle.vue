<template>
  <div class="style-page">
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <button class="nav-back" @click="$router.push('/pet')">←</button>
          <span class="brand-icon">🎨</span>
          <span class="brand-text">宠物风格</span>
        </div>
        <div class="nav-actions">
          <span class="coins-badge">💰 {{ coins }}</span>
          <NotificationBell />
        </div>
      </div>
    </nav>

    <main class="main">
      <div class="hero">
        <h1 class="hero-title">给宠物<span class="gradient-text">换个风格</span></h1>
        <p class="hero-subtitle">语气 + 皮肤，独一无二的它</p>
      </div>

      <!-- ⭐ 当前宠物预览 -->
      <div class="pet-preview">
        <div class="preview-emoji">{{ currentSkinEmoji }}</div>
        <div class="preview-name">{{ petName }}</div>
        <div class="preview-tone">
          {{ currentTone.emoji }} {{ currentTone.name }}
        </div>
      </div>

      <!-- ⭐ 语气切换 -->
      <section class="section">
        <div class="section-title">
          <span>🗣️ 语气</span>
          <span class="section-hint">影响宠物说话方式</span>
        </div>
        <div class="tone-grid">
          <div
            v-for="t in tones"
            :key="t.id"
            class="tone-card"
            :class="{ active: t.id === currentTone.id }"
            @click="onChangeTone(t.id)"
          >
            <div class="tone-emoji">{{ t.emoji }}</div>
            <div class="tone-name">{{ t.name }}</div>
            <div class="tone-desc">{{ t.desc }}</div>
            <div v-if="t.id === currentTone.id" class="tone-badge">✓</div>
          </div>
        </div>
      </section>

      <!-- ⭐ 皮肤切换 -->
      <section class="section">
        <div class="section-title">
          <span>🎨 皮肤</span>
          <span class="section-hint">用金币解锁新造型</span>
        </div>
        <div class="skin-grid">
          <div
            v-for="s in skins"
            :key="s.id"
            class="skin-card"
            :class="{ active: s.id === currentSkin }"
            @click="onChangeSkin(s)"
          >
            <div class="skin-emoji">{{ s.emoji }}</div>
            <div class="skin-name">{{ s.name }}</div>
            <div v-if="s.id === currentSkin" class="skin-badge">✓ 使用中</div>
            <div v-else-if="s.price === 0" class="skin-price free">免费</div>
            <div v-else class="skin-price">💰 {{ s.price }}</div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getPet } from '@/api/pet';
import { getTones, getSkins, updateTone, updateSkin } from '@/api/petStyle';
import NotificationBell from '@/components/NotificationBell.vue';

const tones = ref([]);
const skins = ref([]);
const petName = ref('宠物');
const currentTone = ref({ id: 'normal', name: '正常', emoji: '😊' });
const currentSkin = ref('default');
const currentSkinEmoji = ref('🐱');
const coins = ref(0);

async function loadData() {
  try {
    const [toneList, skinData, pet] = await Promise.all([
      getTones(),
      getSkins(),
      getPet()
    ]);
    tones.value = toneList;
    skins.value = skinData.list;
    currentSkin.value = skinData.current;

    if (pet) {
      petName.value = pet.name;
      currentTone.value = toneList.find(t => t.id === pet.tone) || toneList[0];
      currentSkinEmoji.value = skinData.list.find(s => s.id === pet.skin)?.emoji || '🐱';
      coins.value = pet.coins;
    }
  } catch (e) {}
}

async function onChangeTone(toneId) {
  if (toneId === currentTone.value.id) return;
  try {
    await updateTone(toneId);
    currentTone.value = tones.value.find(t => t.id === toneId);
    ElMessage.success(`语气切换为「${currentTone.value.name}」`);
  } catch (e) {
    ElMessage.error(e.message);
  }
}

async function onChangeSkin(skin) {
  if (skin.id === currentSkin.value) return;

  if (skin.price > 0) {
    try {
      await ElMessageBox.confirm(
        `花 ${skin.price} 金币换成「${skin.name}」？`,
        '换肤确认',
        { type: 'warning', confirmButtonText: '换', cancelButtonText: '再想想' }
      );
    } catch (e) { return; }
  }

  try {
    const res = await updateSkin(skin.id);
    currentSkin.value = skin.id;
    currentSkinEmoji.value = skin.emoji;
    coins.value = res.coins;
    ElMessage.success(`换肤成功！现在是小「${skin.name}」啦`);
  } catch (e) {
    ElMessage.error(e.message);
  }
}

onMounted(loadData);
</script>

<style scoped>
.style-page { min-height: 100vh; background: linear-gradient(180deg, #e0f2ff 0%, #f5f0ff 40%, #fff5f0 100%); font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif; color: #1d1d1f; }
.nav { position: sticky; top: 0; z-index: 100; background: rgba(255, 255, 255, 0.72); backdrop-filter: saturate(180%) blur(20px); border-bottom: 1px solid rgba(0, 0, 0, 0.06); }
.nav-inner { max-width: 900px; margin: 0 auto; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; }
.nav-brand { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 600; }
.nav-back { background: transparent; border: none; font-size: 20px; cursor: pointer; padding: 4px 8px; border-radius: 8px; }
.brand-icon { font-size: 20px; }
.nav-actions { display: flex; align-items: center; gap: 12px; }
.coins-badge { font-size: 14px; font-weight: 700; color: #ff9500; background: rgba(255, 204, 0, 0.15); padding: 6px 14px; border-radius: 999px; }

.main { max-width: 900px; margin: 0 auto; padding: 40px 24px 100px; }
.hero { text-align: center; margin-bottom: 24px; }
.hero-title { font-size: clamp(28px, 4.5vw, 42px); font-weight: 800; letter-spacing: -0.03em; margin: 0 0 10px; }
.gradient-text { background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.hero-subtitle { font-size: 15px; color: #86868b; margin: 0; }

.pet-preview { text-align: center; padding: 24px; margin-bottom: 32px; background: #fff; border-radius: 20px; box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1); }
.preview-emoji { font-size: 100px; line-height: 1; animation: breathe 3s ease-in-out infinite; }
@keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
.preview-name { font-size: 20px; font-weight: 700; margin: 8px 0; }
.preview-tone { font-size: 14px; color: #86868b; }

.section { margin-bottom: 32px; }
.section-title { display: flex; align-items: baseline; gap: 10px; margin-bottom: 16px; font-size: 17px; font-weight: 700; }
.section-hint { font-size: 12px; color: #86868b; font-weight: 400; }

.tone-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.tone-card { position: relative; padding: 20px 16px; background: #fff; border-radius: 16px; border: 2px solid rgba(0, 0, 0, 0.06); text-align: center; cursor: pointer; transition: all 0.3s; }
.tone-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(102, 126, 234, 0.15); }
.tone-card.active { border-color: #ff6b9d; background: linear-gradient(135deg, rgba(255, 107, 157, 0.08), rgba(255, 59, 107, 0.05)); }
.tone-emoji { font-size: 36px; margin-bottom: 8px; }
.tone-name { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
.tone-desc { font-size: 12px; color: #86868b; }
.tone-badge { position: absolute; top: 8px; right: 8px; width: 20px; height: 20px; border-radius: 50%; background: #ff3b6b; color: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; }

.skin-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.skin-card { padding: 16px 12px; background: #fff; border-radius: 16px; border: 2px solid rgba(0, 0, 0, 0.06); text-align: center; cursor: pointer; transition: all 0.3s; }
.skin-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(102, 126, 234, 0.15); }
.skin-card.active { border-color: #34c759; background: rgba(52, 199, 89, 0.05); }
.skin-emoji { font-size: 40px; margin-bottom: 6px; }
.skin-name { font-size: 14px; font-weight: 600; margin-bottom: 6px; }
.skin-badge { font-size: 11px; color: #34c759; font-weight: 700; }
.skin-price { font-size: 12px; color: #ff9500; font-weight: 700; }
.skin-price.free { color: #34c759; }

@media (max-width: 640px) {
  .nav-inner { padding: 12px 16px; }
  .main { padding: 24px 16px 80px; }
  .tone-grid { grid-template-columns: repeat(2, 1fr); }
  .skin-grid { grid-template-columns: repeat(3, 1fr); }
  .preview-emoji { font-size: 80px; }
}
</style>
