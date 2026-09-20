<template>
  <teleport to="body">
    <transition name="reaction-fly">
      <div
        v-if="visible"
        class="reaction-overlay"
        :style="positionStyle"
        @click="visible = false"
      >
        <div class="reaction-glow"></div>

        <div class="reaction-pet">
          <span class="reaction-pet-emoji">{{ petEmoji }}</span>
          <span
            v-for="fx in floatIcons"
            :key="fx.id"
            class="reaction-float-icon"
            :style="{ left: fx.x + '%', animationDelay: fx.delay + 's' }"
          >
            {{ fx.emoji }}
          </span>
        </div>

        <div class="reaction-bubble">{{ bubbleText }}</div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  trigger: { type: Object, default: null }
});

const visible = ref(false);
const petEmoji = ref('🐱');
const bubbleText = ref('');
const floatIcons = ref([]);
const positionStyle = ref({});

let floatId = 0;
let hideTimer = null;

const ACTION_CONFIG = {
  feed:  { icons: ['🍖', '😋', '✨'], text: '好好吃！' },
  play:  { icons: ['🎮', '⭐', '🎉'], text: '好开心！' },
  clean: { icons: ['🫧', '💧', '✨'], text: '好舒服~' },
  sleep: { icons: ['💤', '🌙', '⭐'], text: 'Zzz...' }
};

watch(() => props.trigger, (t) => {
  if (!t) return;

  const cfg = ACTION_CONFIG[t.action] || ACTION_CONFIG.feed;
  petEmoji.value = t.emoji || '🐱';
  bubbleText.value = cfg.text;

  // 定位：按钮位置上方
  positionStyle.value = {
    top: (t.y - 220) + 'px',
    left: (t.x - 90) + 'px'
  };

  // 浮动图标
  floatIcons.value = cfg.icons.map((emoji, i) => ({
    id: ++floatId,
    emoji,
    x: 15 + Math.random() * 70,
    delay: i * 0.15
  }));

  visible.value = true;

  // 2 秒后消失
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    visible.value = false;
    floatIcons.value = [];
  }, 2200);
});
</script>

<style scoped>
.reaction-overlay {
  position: fixed;
  z-index: 99999;
  width: 180px;
  height: 200px;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.reaction-glow {
  position: absolute;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 220, 150, 0.6), transparent 70%);
  animation: glowPulse 1.5s ease-in-out infinite;
  pointer-events: none;
}

@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.15); opacity: 1; }
}

.reaction-pet {
  position: relative;
  z-index: 2;
}

.reaction-pet-emoji {
  font-size: 100px;
  line-height: 1;
  display: block;
  animation: reactionBounce 0.6s ease-in-out infinite;
  filter: drop-shadow(0 8px 20px rgba(255, 180, 100, 0.4));
}

@keyframes reactionBounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.08); }
}

.reaction-float-icon {
  position: absolute;
  top: 20px;
  font-size: 30px;
  animation: floatUp 1.8s ease-out forwards;
  pointer-events: none;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

@keyframes floatUp {
  0% { opacity: 0; transform: translateY(0) scale(0.5); }
  20% { opacity: 1; transform: translateY(-20px) scale(1.2); }
  100% { opacity: 0; transform: translateY(-90px) scale(0.8); }
}

.reaction-bubble {
  position: relative;
  z-index: 2;
  margin-top: 8px;
  padding: 8px 18px;
  background: #fff;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
  border: 2px solid rgba(0, 0, 0, 0.05);
}

.reaction-fly-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.reaction-fly-leave-active {
  transition: all 0.3s ease;
}

.reaction-fly-enter-from {
  opacity: 0;
  transform: scale(0.3) translateY(30px);
}

.reaction-fly-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

@media (max-width: 640px) {
  .reaction-pet-emoji { font-size: 80px; }
  .reaction-bubble { font-size: 12px; padding: 6px 14px; }
  .reaction-float-icon { font-size: 24px; }
}
</style>
