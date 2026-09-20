<template>
  <div class="intimacy-wrap">
    <div class="intimacy-icon">❤️</div>
    <div class="intimacy-content">
      <div class="intimacy-header">
        <span>好感度</span>
        <span class="intimacy-level">{{ levelText }}</span>
      </div>
      <div class="intimacy-bar">
        <div class="intimacy-fill" :style="{ width: value + '%' }"></div>
      </div>
      <div class="intimacy-num">{{ value }} / 100</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  value: { type: Number, default: 0 }
});

const levelText = computed(() => {
  const v = props.value;
  if (v <= 30) return '陌生';
  if (v <= 60) return '熟悉';
  if (v <= 85) return '亲密';
  return '形影不离 ❤️';
});
</script>

<style scoped>
.intimacy-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(255, 200, 200, 0.2), rgba(255, 150, 150, 0.1));
  border-radius: 14px;
  margin: 12px auto;
  max-width: 360px;
  border: 1px solid rgba(255, 107, 157, 0.2);
}
.intimacy-icon { font-size: 24px; animation: heartBeat 1.5s infinite; }
@keyframes heartBeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
.intimacy-content { flex: 1; min-width: 0; }
.intimacy-header { display: flex; justify-content: space-between; font-size: 12px; color: #86868b; margin-bottom: 4px; }
.intimacy-level { color: #ff3b6b; font-weight: 600; }
.intimacy-bar { height: 8px; background: rgba(0, 0, 0, 0.06); border-radius: 999px; overflow: hidden; }
.intimacy-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b9d, #ff3b6b);
  border-radius: 999px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}
.intimacy-fill::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 2s infinite;
}
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.intimacy-num { font-size: 11px; color: #86868b; text-align: right; margin-top: 2px; }
</style>
