<template>
  <el-dialog
    v-model="visible"
    title=""
    width="720px"
    top="8vh"
    :show-close="false"
    class="shop-dialog"
  >
    <!-- 顶部：金币 + 关闭 -->
    <div class="shop-header">
      <div class="header-left">
        <span class="shop-title">🛒 商店</span>
        <span class="coins-badge">💰 {{ coins }}</span>
      </div>
      <button class="close-btn" @click="visible = false">✕</button>
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

    <!-- 物品网格 -->
    <div class="items-scroll" v-loading="loading">
      <div class="items-grid">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="item-card"
          :class="`rarity-${item.rarity}`"
        >
          <div class="rarity-glow"></div>

          <div class="item-icon">{{ item.icon }}</div>
          <div class="item-name">{{ item.name }}</div>
          <div class="item-desc">{{ item.description }}</div>

          <div class="item-effects">
            <span v-for="(v, k) in item.effect" :key="k" class="effect-tag">
              {{ effectIcon(k) }}{{ v > 0 ? '+' : '' }}{{ v }}
            </span>
          </div>

          <div class="item-footer">
            <div class="price">
              💰 <span>{{ item.price }}</span>
            </div>
            <button
              class="buy-btn"
              :disabled="coins < item.price || buying"
              @click="onBuy(item)"
            >
              {{ item.owned > 0 ? `已拥有 ${item.owned}` : '购买' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getShopItems, buyItem } from '@/api/petShop';

const props = defineProps({
  modelValue: Boolean
});
const emit = defineEmits(['update:modelValue', 'purchased']);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
});

const loading = ref(false);
const buying = ref(false);
const items = ref([]);
const coins = ref(0);
const activeTab = ref('all');

const tabs = [
  { key: 'all',    name: '全部', icon: '✨' },
  { key: 'food',   name: '食物', icon: '🍖' },
  { key: 'toy',    name: '玩具', icon: '🎮' },
  { key: 'soap',   name: '洗护', icon: '🧼' }
];

const filteredItems = computed(() => {
  if (activeTab.value === 'all') return items.value;
  return items.value.filter(i => i.type === activeTab.value);
});

function effectIcon(key) {
  const map = { hunger: '🍖', mood: '😊', clean: '✨', energy: '⚡' };
  return map[key] || '';
}

async function loadItems() {
  loading.value = true;
  try {
    const data = await getShopItems();
    items.value = data.items;
    coins.value = data.coins;
  } catch (e) {
    ElMessage.error(e.message);
  }
  loading.value = false;
}

async function onBuy(item) {
  if (buying.value) return;
  buying.value = true;
  try {
    const res = await buyItem(item.id, 1);
    coins.value = res.coins;
    item.owned = res.owned;
    ElMessage.success(`购买 ${item.name} 成功！`);
    emit('purchased', { coins: res.coins });
  } catch (e) {
    ElMessage.error(e.message);
  }
  buying.value = false;
}

watch(visible, (v) => {
  if (v) loadItems();
});
</script>

<style>
.shop-dialog .el-dialog__header { display: none; }
.shop-dialog .el-dialog__body { padding: 0; }
.shop-dialog .el-dialog { border-radius: 24px; overflow: hidden; }
</style>

<style scoped>
.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.header-left { display: flex; align-items: center; gap: 16px; }
.shop-title { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
.coins-badge {
  font-size: 14px;
  font-weight: 700;
  color: #ff9500;
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.15), rgba(255, 149, 0, 0.15));
  padding: 6px 14px;
  border-radius: 999px;
}
.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: #86868b;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}
.close-btn:hover { background: rgba(0, 0, 0, 0.1); color: #1d1d1f; }

.tabs {
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.04);
  color: #86868b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.tab:hover { background: rgba(0, 0, 0, 0.06); }
.tab.active { background: #0071e3; color: #fff; }
.tab-icon { font-size: 15px; }

.items-scroll {
  max-height: 55vh;
  overflow-y: auto;
  padding: 20px 24px;
}
.items-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.item-card {
  position: relative;
  padding: 18px;
  border-radius: 18px;
  background: #fff;
  border: 2px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.item-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1); }

.rarity-glow {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}
.item-card:hover .rarity-glow { opacity: 1; }

.rarity-common .rarity-glow { background: radial-gradient(circle at top right, rgba(142, 142, 147, 0.08), transparent 60%); }
.rarity-rare .rarity-glow { background: radial-gradient(circle at top right, rgba(0, 113, 227, 0.12), transparent 60%); }
.rarity-legendary .rarity-glow { background: radial-gradient(circle at top right, rgba(255, 204, 0, 0.15), transparent 60%); }

.rarity-common { border-color: rgba(142, 142, 147, 0.2); }
.rarity-rare { border-color: rgba(0, 113, 227, 0.3); }
.rarity-legendary { border-color: rgba(255, 204, 0, 0.4); box-shadow: 0 0 0 1px rgba(255, 204, 0, 0.2); }

.item-icon { font-size: 40px; text-align: center; margin-bottom: 8px; line-height: 1; }
.item-name { font-size: 15px; font-weight: 700; text-align: center; margin-bottom: 4px; color: #1d1d1f; }
.item-desc { font-size: 11px; color: #86868b; text-align: center; margin-bottom: 10px; min-height: 30px; }

.item-effects {
  display: flex;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.effect-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.05);
  color: #1d1d1f;
  font-weight: 500;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}
.price {
  font-size: 14px;
  font-weight: 700;
  color: #ff9500;
}
.buy-btn {
  padding: 6px 14px;
  border-radius: 999px;
  border: none;
  background: #0071e3;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.buy-btn:hover:not(:disabled) { background: #0077ed; transform: scale(1.05); }
.buy-btn:disabled { background: #e5e5ea; color: #a1a1a6; cursor: not-allowed; }

@media (max-width: 640px) {
  .items-grid { grid-template-columns: repeat(2, 1fr); }
  .shop-header, .tabs, .items-scroll { padding-left: 16px; padding-right: 16px; }
  .shop-title { font-size: 17px; }
}
</style>
