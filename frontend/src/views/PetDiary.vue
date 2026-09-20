<template>
  <div class="diary-page">
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <button class="nav-back" @click="$router.push('/pet')">←</button>
          <span class="brand-icon">📔</span>
          <span class="brand-text">我的日记</span>
        </div>
        <div class="nav-actions">
          <el-button size="small" @click="onGenerate" :loading="generating">生成本周</el-button>
          <NotificationBell />
        </div>
      </div>
    </nav>

    <main class="main" v-loading="loading">
      <div class="hero">
        <h1 class="hero-title">
          和 <span class="gradient-text">{{ petName }}</span> 的回忆
        </h1>
        <p class="hero-subtitle">每一周，都值得被记录</p>
      </div>

      <div v-if="diaries.length" class="diaries-list">
        <div v-for="d in diaries" :key="d.id" class="diary-card">
          <div class="diary-header">
            <div class="diary-week">
              <span class="week-icon">📅</span>
              <span>{{ formatWeek(d.week_start) }}</span>
            </div>
            <div class="diary-stats">
              <span>🍖 {{ d.feed_count }}</span>
              <span>🎮 {{ d.play_count }}</span>
              <span>🛁 {{ d.clean_count }}</span>
              <span>😴 {{ d.sleep_count }}</span>
            </div>
          </div>
          <div class="diary-content">{{ d.content }}</div>
          <div class="diary-footer">
            <span class="diary-date">{{ new Date(d.created_at).toLocaleDateString('zh-CN') }}</span>
            <el-button link type="primary" size="small" @click="onShare(d)">分享</el-button>
          </div>
        </div>
      </div>

      <el-empty v-else-if="!loading" description="还没有日记，点击右上角生成吧">
        <el-button type="primary" @click="onGenerate">生成第一周日记</el-button>
      </el-empty>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getPet } from '@/api/pet';
import { getDiaries, generateDiary } from '@/api/petDiary';
import NotificationBell from '@/components/NotificationBell.vue';

const diaries = ref([]);
const loading = ref(false);
const generating = ref(false);
const petName = ref('宠物');

function formatWeek(dateStr) {
  const d = new Date(dateStr);
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  return `${d.getMonth() + 1}月${d.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;
}

async function loadDiaries() {
  loading.value = true;
  try {
    diaries.value = await getDiaries();
  } catch (e) {}
  loading.value = false;
}

async function onGenerate() {
  generating.value = true;
  try {
    await generateDiary();
    ElMessage.success('日记生成成功！');
    await loadDiaries();
  } catch (e) {
    ElMessage.error(e.message || '生成失败');
  }
  generating.value = false;
}

function onShare(d) {
  if (navigator.share) {
    navigator.share({
      title: `${petName.value}的日记`,
      text: d.content
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(d.content);
    ElMessage.success('日记已复制到剪贴板');
  }
}

onMounted(async () => {
  try {
    const pet = await getPet();
    if (pet) petName.value = pet.name;
  } catch (e) {}
  await loadDiaries();
});
</script>

<style scoped>
.diary-page { min-height: 100vh; background: linear-gradient(180deg, #e0f2ff 0%, #f5f0ff 40%, #fff5f0 100%); font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif; color: #1d1d1f; }
.nav { position: sticky; top: 0; z-index: 100; background: rgba(255, 255, 255, 0.72); backdrop-filter: saturate(180%) blur(20px); border-bottom: 1px solid rgba(0, 0, 0, 0.06); }
.nav-inner { max-width: 700px; margin: 0 auto; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; }
.nav-brand { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 600; }
.nav-back { background: transparent; border: none; font-size: 20px; cursor: pointer; padding: 4px 8px; border-radius: 8px; }
.brand-icon { font-size: 20px; }
.nav-actions { display: flex; align-items: center; gap: 10px; }
.main { max-width: 700px; margin: 0 auto; padding: 40px 24px 100px; }
.hero { text-align: center; margin-bottom: 32px; }
.hero-title { font-size: clamp(28px, 4.5vw, 42px); font-weight: 800; letter-spacing: -0.03em; margin: 0 0 10px; }
.gradient-text { background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.hero-subtitle { font-size: 15px; color: #86868b; margin: 0; }
.diaries-list { display: flex; flex-direction: column; gap: 20px; }
.diary-card { background: #fff; border-radius: 20px; padding: 24px; box-shadow: 0 8px 32px rgba(102, 126, 234, 0.08); border: 1px solid rgba(255, 255, 255, 0.8); }
.diary-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px dashed rgba(0, 0, 0, 0.08); margin-bottom: 16px; }
.diary-week { font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
.week-icon { font-size: 18px; }
.diary-stats { display: flex; gap: 10px; font-size: 12px; color: #86868b; }
.diary-content { font-size: 15px; line-height: 1.9; color: #1d1d1f; white-space: pre-wrap; font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; }
.diary-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 16px; border-top: 1px dashed rgba(0, 0, 0, 0.08); }
.diary-date { font-size: 12px; color: #c7c7cc; }
@media (max-width: 640px) {
  .nav-inner { padding: 12px 16px; }
  .main { padding: 24px 16px 80px; }
  .diary-card { padding: 18px; border-radius: 16px; }
  .diary-content { font-size: 14px; }
}
</style>
