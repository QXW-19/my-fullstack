<template>
  <el-dialog
    v-model="visible"
    width="360px"
    :show-close="false"
    :close-on-click-modal="true"
    class="event-dialog"
  >
    <div class="event-content">
      <div class="event-icon">{{ event.icon }}</div>
      <div class="event-text">小橘{{ event.text }}</div>
      <div class="event-effects">
        <span v-if="event.effects?.mood" class="effect" :class="{ negative: event.effects.mood < 0 }">
          😊 {{ event.effects.mood > 0 ? '+' : '' }}{{ event.effects.mood }}
        </span>
        <span v-if="event.effects?.hunger" class="effect">
          🍖 {{ event.effects.hunger > 0 ? '+' : '' }}{{ event.effects.hunger }}
        </span>
        <span v-if="event.effects?.energy" class="effect">
          ⚡ {{ event.effects.energy > 0 ? '+' : '' }}{{ event.effects.energy }}
        </span>
        <span v-if="event.effects?.coins" class="effect">
          💰 +{{ event.effects.coins }}
        </span>
      </div>
      <el-button type="primary" size="large" style="width: 100%; margin-top: 20px" @click="visible = false">
        知道啦～
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  event: { type: Object, default: null }
});

const visible = ref(false);

watch(() => props.event, (e) => {
  if (e) visible.value = true;
});
</script>

<style>
.event-dialog .el-dialog__header { display: none; }
.event-dialog .el-dialog__body { padding: 30px 24px 24px; }
</style>

<style scoped>
.event-content { text-align: center; }
.event-icon { font-size: 72px; margin-bottom: 16px; animation: eventBounce 1s ease-in-out infinite; }
@keyframes eventBounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.1); }
}
.event-text { font-size: 16px; font-weight: 600; color: #1d1d1f; margin-bottom: 16px; line-height: 1.5; }
.event-effects { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
.effect {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(52, 199, 89, 0.12);
  color: #34c759;
}
.effect.negative { background: rgba(255, 59, 48, 0.12); color: #ff3b30; }
</style>
