<template>
  <div class="pet-apple">
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <span class="brand-icon">🐾</span>
          <span class="brand-text">我的宠物</span>
        </div>
        <div class="nav-actions">
          <NotificationBell />
          <el-dropdown @command="onCommand">
            <div class="user-chip">
              <img v-if="userStore.userInfo?.avatar" :src="userStore.userInfo.avatar" class="user-avatar-img" alt="" />
              <div v-else class="user-avatar">{{ userStore.userInfo?.username?.[0]?.toUpperCase() }}</div>
              <span class="user-name">{{ userStore.userInfo?.username }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="home">🏠 首页</el-dropdown-item>
                <el-dropdown-item command="board">💬 留言板</el-dropdown-item>
                <el-dropdown-item command="profile" divided>👤 个人资料</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
              <PetReactionOverlay :trigger="reactionTrigger" />
</template>
          </el-dropdown>
        </div>
      </div>
    </nav>

    <main class="main">
      <!-- ⭐ 死亡横幅 -->
      <transition name="banner">
        <div v-if="pet && pet.stage === 'dead'" class="death-banner">
          <div class="banner-icon">💀</div>
          <div class="banner-text">
            你的宠物已经离开 <b>{{ daysSinceDeath }}</b> 天了
            <div class="banner-cause">{{ pet.death_cause || '原因未知' }}</div>
          </div>
        </div>
      </transition>
      <div v-if="!pet && !loading" class="adopt-wrap">
        <div class="adopt-hero">
          <h1 class="hero-title">领养一只<span class="gradient-text">小伙伴</span></h1>
          <p class="hero-subtitle">它会陪你度过每一天</p>
        </div>
        <div class="adopt-card">
          <div class="form-group">
            <label>选择物种</label>
            <div class="species-grid">
              <button
                v-for="(s, key) in SPECIES"
                :key="key"
                class="species-btn"
                :class="{ active: adoptForm.species === key }"
                @click="adoptForm.species = key"
              >
                <span class="species-emoji">{{ s.emoji }}</span>
                <span class="species-name">{{ s.name }}</span>
                <span class="species-desc">{{ s.desc }}</span>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>给它起个名字</label>
            <input v-model="adoptForm.name" placeholder="例如：小橘、旺财..." maxlength="20" @keyup.enter="onAdopt" />
          </div>
          <button class="adopt-btn" :disabled="!canAdopt || adopting" @click="onAdopt">
            {{ adopting ? '领养中...' : '🐾 领养' }}
          </button>
        </div>
      </div>

      <div v-else-if="pet" class="pet-wrap">
        <div class="pet-stage">
          <div
            class="pet-display"
            :class="[pet.stage, reactionState]"
            @click="onPetClick"
          >
            <div class="pet-emoji">{{ pet.speciesInfo?.emoji || '🐱' }}</div>
            <div v-if="equippedHat" class="deco-overlay hat">{{ equippedHat }}</div>
            <div v-if="equippedGlasses" class="deco-overlay glasses">{{ equippedGlasses }}</div>
            <div class="pet-shadow"></div>

            <!-- 浮动特效层 -->
            <transition-group name="float-icon" tag="div" class="float-layer">
              <span
                v-for="fx in floatingIcons"
                :key="fx.id"
                class="float-icon"
                :style="{ left: fx.x + '%', animationDelay: fx.delay + 's' }"
              >
                {{ fx.emoji }}
              </span>
            </transition-group>

            <!-- 状态气泡 -->
            <transition name="bubble-pop">
              <div v-if="statusBubble" class="status-bubble">
                {{ statusBubble }}
              </div>
            </transition>

            <div v-if="pet.stage === 'egg'" class="egg-hint">孵化中...</div>
            <div v-else-if="pet.stage === 'sick'" class="sick-hint">🤒 生病了</div>
            <div v-else-if="pet.stage === 'dead'" class="dead-hint">😢 离开了</div>
          </div>
          <div class="pet-info">
            <div class="pet-name-row">
              <h2 class="pet-name">{{ pet.name }}</h2>
              <button class="rename-btn" @click="onRename">✏️</button>
            </div>
            <div class="pet-meta">
              <span class="stage-tag">{{ stageLabel }}</span>
              <span class="level-tag">Lv.{{ pet.level }}</span>
              <span class="coins-tag">💰 {{ pet.coins }}</span>
            </div>
            <div class="pet-buttons">
              <button class="mini-btn shop" @click="showShop = true">🛒 商店</button>
              <button class="mini-btn signin" @click="onSignin">🎁 签到</button>
              <button class="mini-btn ach" @click="$router.push('/pet/achievements')">🏆 成就</button>
              <button class="mini-btn friends" @click="$router.push('/pet/friends')">👥 好友</button>
              <button class="mini-btn deco" @click="$router.push('/pet/decorations')">🎩 装扮</button>
              <button class="mini-btn chat" @click="$router.push('/pet/chat')">💬 聊天</button>
              <button class="mini-btn diary" @click="$router.push('/pet/diary')">📔 日记</button>
              <button class="mini-btn style" @click="$router.push('/pet/style')">🎨 风格</button>
            </div>
          </div>
        </div>

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


        <!-- ================================================= -->
        <!-- V1：成长 / 性格 -->
        <!-- ================================================= -->

        <div class="pet-overview-grid">

          <!-- 成长 -->
          <section class="info-card growth-card">

            <div class="card-title-row">

              <div>

                <span class="card-kicker">
                  成长
                </span>

                <h3>
                  🌟 Lv.{{ pet.level }}
                </h3>

              </div>

              <span class="mood-badge">
                {{ pet.moodStatus?.icon }}
                {{ pet.moodStatus?.label }}
              </span>

            </div>


            <p class="health-copy">
              {{ healthText }}
            </p>


            <div class="exp-line">

              <span>
                当前经验 {{ pet.exp }}
              </span>

              <span
                v-if="!pet.levelProgress?.isMaxLevel"
              >
                距下一等级
                {{ pet.levelProgress?.next }}
              </span>

              <span v-else>
                已达到最高等级
              </span>

            </div>


            <div class="exp-bar">

              <div
                :style="{
                  width:
                    (pet.levelProgress?.percent || 0)
                    + '%'
                }"
              ></div>

            </div>

          </section>


          <!-- 性格 -->
          <section class="info-card personality-card">

            <div class="personality-icon">

              {{ pet.personality?.icon || '🐾' }}

            </div>


            <div>

              <span class="card-kicker">
                性格
              </span>

              <h3>
                {{ pet.personality?.name || '陪伴型' }}
              </h3>

              <p>
                {{ pet.personality?.desc }}
              </p>

              <small class="personality-bonus">
                ✨ {{ pet.personality?.bonus }}
              </small>

            </div>

          </section>

        </div>


        <!-- ================================================= -->
        <!-- V1：每日任务 -->
        <!-- ================================================= -->

        <section class="info-card tasks-card">

          <div class="section-heading">

            <div>

              <span class="card-kicker">
                每日陪伴
              </span>

              <h3>
                📋 今天照顾它了吗？
              </h3>

            </div>

            <span class="task-tip">
              完成任务可以领取金币
            </span>

          </div>


          <div class="task-list">

            <div
              v-for="task in (pet.dailyTasks || [])"
              :key="task.id"
              class="task-item"
              :class="{
                completed: task.completed,
                claimed: task.claimed
              }"
            >

              <span class="task-icon">
                {{ task.icon }}
              </span>


              <div class="task-main">

                <strong>
                  {{ task.name }}
                </strong>

                <div class="task-progress">

                  <span
                    :style="{
                      width:
                        Math.min(
                          100,
                          task.progress /
                          task.target *
                          100
                        ) + '%'
                    }"
                  ></span>

                </div>

              </div>


              <span class="task-count">
                {{ task.progress }}/{{ task.target }}
              </span>


              <button
                v-if="task.completed"
                class="claim-btn"
                :disabled="task.claimed"
                @click="onClaimTask(task)"
              >

                {{
                  task.claimed
                    ? '已领取'
                    : '+' + task.reward
                }}

              </button>

            </div>

          </div>

        </section>


        <!-- ================================================= -->
        <!-- V1：回忆 + 成就 -->
        <!-- ================================================= -->

        <div class="pet-overview-grid lower">


          <!-- 回忆 -->
          <section class="info-card memories-card">

            <div class="section-heading">

              <div>

                <span class="card-kicker">
                  陪伴记录
                </span>

                <h3>
                  📖 小小回忆
                </h3>

              </div>

            </div>


            <div
              v-if="!(pet.memories || []).length"
              class="muted-empty"
            >
              等你和它留下第一段故事。
            </div>


            <div
              v-for="memory in (pet.memories || [])"
              :key="
                memory.time +
                memory.title
              "
              class="memory-item"
            >

              <span class="memory-icon">
                {{ memory.icon }}
              </span>


              <div>

                <strong>
                  {{ memory.title }}
                </strong>

                <p>
                  {{ memory.text }}
                </p>

                <time>
                  {{ formatTime(memory.time) }}
                </time>

              </div>

            </div>

          </section>


          <!-- 成就 -->
          <section class="info-card achievements-card">

            <div class="section-heading">

              <div>

                <span class="card-kicker">
                  长期目标
                </span>

                <h3>
                  🏆 成就
                </h3>

              </div>


              <span class="achievement-count">

                {{ unlockedAchievements }}/{{ (pet.achievements || []).length }}

              </span>

            </div>


            <div class="achievement-list">

              <div
                v-for="achievement in (pet.achievements || [])"
                :key="achievement.id"
                class="achievement-item"
                :class="{
                  unlocked:
                    achievement.unlocked
                }"
              >

                <span>
                  {{ achievement.icon }}
                </span>


                <div>

                  <strong>
                    {{ achievement.name }}
                  </strong>

                  <small>
                    {{ achievement.desc }}
                  </small>

                </div>


                <b>

                  {{
                    achievement.unlocked
                      ? '✓'
                      : '🔒'
                  }}

                </b>

              </div>

            </div>

          </section>

        </div>

        <div class="death-actions" v-if="pet.stage === 'dead'">
              <div class="death-hint">宠物已经离开...</div>
              <button class="revive-big-btn" @click="onReviveConfirm">
                💫 花 500 金币复活
              </button>
            </div>

            <div class="actions-grid" v-else>
          <button class="action-btn feed" :disabled="!canAct" @click="onAction('feed', $event)">
            <span class="action-icon">🍖</span><span>喂食</span>
          </button>
          <button class="action-btn play" :disabled="!canAct" @click="onAction('play', $event)">
            <span class="action-icon">🎮</span><span>玩耍</span>
          </button>
          <button class="action-btn clean" :disabled="!canAct" @click="onAction('clean', $event)">
            <span class="action-icon">🛁</span><span>洗澡</span>
          </button>
          <button class="action-btn sleep" :disabled="!canAct" @click="onAction('sleep', $event)">
            <span class="action-icon">😴</span><span>睡觉</span>
          </button>
        </div>

        <button v-if="pet.stage === 'dead'" class="revive-btn" @click="onRevive">💫 花 500 金币复活</button>

        <PetShop v-model="showShop" @purchased="onPurchased" />

        <div class="history-card">
          <h3>📜 最近动态</h3>
          <div v-if="!actions.length" class="empty-history">还没有任何互动</div>
          <div v-for="a in actions" :key="a.id" class="history-item">
            <span class="history-icon">{{ actionIcons[a.action] }}</span>
            <span class="history-text">{{ actionNames[a.action] }}</span>
            <span class="history-time">{{ formatTime(a.created_at) }}</span>
          </div>
        </div>
      </div>

      <div v-else class="loading-wrap">
        <div class="loading-spinner">🐾</div>
      </div>
              <PetRandomEvent :event="randomEvent" />
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { adoptPet, getPet, doAction, getActions, renamePet, revivePet, claimDailyTask } from '@/api/pet';
import NotificationBell from '@/components/NotificationBell.vue';
import PetIntimacy from '@/components/PetIntimacy.vue';
import PetRandomEvent from '@/components/PetRandomEvent.vue';
import PetReactionOverlay from '@/components/PetReactionOverlay.vue';
import PetShop from '@/components/PetShop.vue';
import { signin } from '@/api/petShop';

const router = useRouter();
const userStore = useUserStore();
const loading = ref(true);
const pet = ref(null);
const actions = ref([]);
const adopting = ref(false);
const acting = ref(false);
const adoptForm = reactive({ species: 'cat', name: '' });
const showShop = ref(false);
const reactionTrigger = ref(null);
const randomEvent = ref(null);

// ⭐ 反应系统
const reactionState = ref('idle');       // idle/eating/playing/cleaning/sleeping/happy
const floatingIcons = ref([]);            // 浮动特效
const statusBubble = ref('');             // 状态气泡文字
let reactionTimer = null;
let bubbleTimer = null;
let floatId = 0;

// ⭐ 触发反应
function triggerReaction(state, icons = [], bubble = '', duration = 1500) {
  reactionState.value = state;

  // 冒浮图标
  icons.forEach((emoji, i) => {
    const fx = {
      id: ++floatId,
      emoji,
      x: 20 + Math.random() * 60,
      delay: i * 0.15
    };
    floatingIcons.value.push(fx);
    setTimeout(() => {
      floatingIcons.value = floatingIcons.value.filter(f => f.id !== fx.id);
    }, 2000);
  });

  // 状态气泡
  if (bubble) {
    statusBubble.value = bubble;
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => {
      statusBubble.value = '';
    }, duration);
  }

  // 恢复 idle
  clearTimeout(reactionTimer);
  reactionTimer = setTimeout(() => {
    reactionState.value = 'idle';
  }, duration);
}

// ⭐ 点击宠物
function onPetClick() {
  if (!pet.value || pet.value.stage === 'dead') return;
  if (pet.value.stage === 'sick') {
    triggerReaction('shake', ['💊'], '好难受...', 1200);
    return;
  }
  triggerReaction('happy', ['❤️', '💕', '✨'], '好开心！', 1200);
}

async function onSignin() {
  try {
    const res = await signin();
    ElMessage.success(res.reward ? `签到成功！+${res.reward} 金币` : res.msg || '签到成功');
    await loadPet();
  } catch (e) {
    ElMessage.warning(e.message || '今天已经签到过了');
  }
}

function onPurchased({ coins }) {
  if (pet.value) pet.value.coins = coins;
}

const SPECIES = {
  cat:    { name: '猫',   emoji: '🐱', desc: '高冷但爱你' },
  dog:    { name: '狗',   emoji: '🐶', desc: '忠诚活泼' },
  dragon: { name: '龙',   emoji: '🐉', desc: '难养但稀有' },
  rabbit: { name: '兔',   emoji: '🐰', desc: '温顺可爱' },
  panda:  { name: '熊猫', emoji: '🐼', desc: '国宝级待遇' }
};

const statList = [
  { key: 'hunger', icon: '🍖', label: '饱食' },
  { key: 'mood',   icon: '😊', label: '心情' },
  { key: 'clean',  icon: '✨', label: '清洁' },
  { key: 'energy', icon: '⚡', label: '精力' }
];

const actionIcons = { feed: '🍖', play: '🎮', clean: '🛁', sleep: '😴' };
const actionNames = { feed: '喂食', play: '玩耍', clean: '洗澡', sleep: '睡觉' };

const canAdopt = computed(() => adoptForm.name.trim() && adoptForm.species);
const canAct = computed(() => pet.value && !['dead', 'sick'].includes(pet.value.stage));

// ⭐ 经验值
const expMax = computed(() => {
  const stage = pet.value?.stage;
  if (stage === 'egg') return 100;
  if (stage === 'baby') return 500;
  return 1000;
});
const equippedHat = computed(() => {
  return pet.value?.equippedInfo?.hat?.icon || null;
});
const equippedGlasses = computed(() => {
  return pet.value?.equippedInfo?.glasses?.icon || null;
});

const expPercent = computed(() => {
  const exp = pet.value?.exp || 0;
  return Math.min(100, Math.round(exp / expMax.value * 100));
});
const stageLabel = computed(() => {
  const map = { egg: '🥚 蛋', baby: '🐣 幼年', adult: '🌟 成年', sick: '🤒 生病', dead: '💔 离开' };
  return map[pet.value?.stage] || '';
});

function barClass(v) {
  if (v < 15) return 'danger';
  if (v < 30) return 'warning';
  return 'normal';
}

function formatTime(t) {
  const d = new Date(t);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

async function loadPet() {
  loading.value = true;
  try {
    const data = await getPet();
    pet.value = data;
    if (data?.randomEvent) {
      randomEvent.value = data.randomEvent;
    }
    if (pet.value) await loadActions();
  } catch (e) {}
  loading.value = false;
}

async function loadActions() {
  try { actions.value = await getActions(); } catch (e) {}
}

async function onAdopt() {
  if (!canAdopt.value) return;
  adopting.value = true;
  try {
    await adoptPet(adoptForm);
    ElMessage.success('领养成功！🐾');
    await loadPet();
  } catch (e) { ElMessage.error(e.message); }
  adopting.value = false;
}

async function onAction(action, event) {
  if (acting.value) return;
  acting.value = true;

  // ⭐ 触发悬浮反应动画
  const btnEl = event?.currentTarget || event?.target;
  const rect = btnEl ? btnEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2 };
  reactionTrigger.value = {
    action,
    emoji: pet.value?.speciesInfo?.emoji || '🐱',
    x: rect.left + rect.width / 2,
    y: rect.top
  };

  // ⭐ 立刻触发反应（乐观）
  const REACTIONS = {
    feed:  { state: 'eating',    icons: ['🍖', '😋', '✨'], bubble: '好好吃！' },
    play:  { state: 'playing',   icons: ['🎮', '⭐', '🎉'], bubble: '好开心！' },
    clean: { state: 'cleaning',  icons: ['🫧', '💧', '✨'], bubble: '好舒服~' },
    sleep: { state: 'sleeping',  icons: ['💤', '🌙', '⭐'], bubble: 'Zzz...' }
  };
  const r = REACTIONS[action];
  if (r) triggerReaction(r.state, r.icons, r.bubble, 2000);

  try {
    const res = await doAction(action);
    pet.value = res.pet;
    await loadActions();
    ElMessage.success(res.action + '成功！+' + res.expGain + ' 经验');

    // ⭐ 成就解锁提示
    if (res.unlocked && res.unlocked.length) {
      res.unlocked.forEach((a, i) => {
        setTimeout(() => {
          ElMessage({
            message: '🏆 解锁成就：' + a.icon + ' ' + a.name + ' (+' + a.reward_coins + '💰)',
            type: 'success',
            duration: 4000
          });
        }, i * 600);
      });
      // 刷新宠物（奖励金币）
      pet.value = (await getPet()) || pet.value;
    }
  } catch (e) { ElMessage.error(e.message); }
  acting.value = false;
}

async function onRename() {
  try {
    const { value } = await ElMessageBox.prompt('输入新名字', '改名', {
      inputValue: pet.value.name,
      inputValidator: (v) => v.trim() ? true : '名字不能为空',
      inputPattern: /^.{1,20}$/,
      inputErrorMessage: '名字长度 1-20'
    });
    await renamePet(value);
    pet.value.name = value;
    ElMessage.success('改名成功');
  } catch (e) {}
}

async function onRevive() {
  try {
    await ElMessageBox.confirm('确定花 500 金币复活宠物？', '复活', { type: 'warning' });
    await revivePet();
    ElMessage.success('宠物复活了！🎉');
    await loadPet();
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '失败');
  }
}

function onCommand(cmd) {
  const map = { home: '/home', board: '/board', profile: '/profile' };
  if (cmd === 'logout') { userStore.logout(); router.push('/login'); }
  else if (map[cmd]) router.push(map[cmd]);
}

onMounted(loadPet);
</script>

<style scoped>
.pet-apple { min-height: 100vh; background: linear-gradient(180deg, #e0f2ff 0%, #f5f0ff 40%, #fff5f0 100%); font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif; color: #1d1d1f; }
.nav { position: sticky; top: 0; z-index: 100; background: rgba(255, 255, 255, 0.72); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(0, 0, 0, 0.06); }
.nav-inner { max-width: 1000px; margin: 0 auto; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; }
.nav-brand { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 600; }
.brand-icon { font-size: 20px; }
.nav-actions { display: flex; align-items: center; gap: 16px; }
.user-chip { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 12px 4px 4px; border-radius: 999px; }
.user-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; }
.user-avatar-img { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
.user-name { font-size: 14px; }
.main { max-width: 1000px; margin: 0 auto; padding: 40px 24px 100px; }

.adopt-wrap { max-width: 700px; margin: 0 auto; }
.adopt-hero { text-align: center; margin-bottom: 40px; }
.hero-title { font-size: clamp(32px, 5vw, 52px); font-weight: 800; letter-spacing: -0.03em; margin: 0 0 12px; }
.gradient-text { background: linear-gradient(135deg, #667eea, #764ba2, #f093fb); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.hero-subtitle { font-size: 17px; color: #86868b; margin: 0; }
.adopt-card { background: #fff; border-radius: 24px; padding: 32px; box-shadow: 0 12px 40px rgba(102, 126, 234, 0.1); }
.form-group { margin-bottom: 28px; }
.form-group label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 12px; }
.species-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
.species-btn { padding: 16px 8px; border: 2px solid rgba(0, 0, 0, 0.06); border-radius: 18px; background: #fff; cursor: pointer; transition: all 0.3s; display: flex; flex-direction: column; align-items: center; gap: 6px; font-family: inherit; }
.species-btn:hover { border-color: #0071e3; transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0, 113, 227, 0.15); }
.species-btn.active { border-color: #0071e3; background: rgba(0, 113, 227, 0.05); transform: translateY(-4px); }
.species-emoji { font-size: 36px; }
.species-name { font-size: 14px; font-weight: 600; }
.species-desc { font-size: 11px; color: #86868b; }
.form-group input { width: 100%; padding: 14px 18px; border: 1px solid rgba(0, 0, 0, 0.08); border-radius: 12px; font-size: 15px; outline: none; font-family: inherit; }
.form-group input:focus { border-color: #0071e3; box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1); }
.adopt-btn { width: 100%; padding: 16px; border-radius: 999px; border: none; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; font-size: 17px; font-weight: 600; cursor: pointer; box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3); font-family: inherit; }
.adopt-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4); }
.adopt-btn:disabled { background: #e5e5ea; color: #a1a1a6; cursor: not-allowed; box-shadow: none; }

.pet-wrap { max-width: 600px; margin: 0 auto; }
.pet-stage { text-align: center; margin-bottom: 28px; position: relative; padding: 40px 20px 20px; }
.pet-stage::before { content: ''; position: absolute; top: 40px; left: 50%; transform: translateX(-50%); width: 280px; height: 280px; border-radius: 50%; background: radial-gradient(circle, rgba(255, 220, 150, 0.4), transparent 70%); animation: auraPulse 4s ease-in-out infinite; z-index: 0; }
@keyframes auraPulse { 0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.7; } 50% { transform: translateX(-50%) scale(1.1); opacity: 1; } }
.pet-display { position: relative; height: 260px; display: flex; align-items: center; justify-content: center; z-index: 1; }
.pet-emoji { font-size: 200px; line-height: 1; animation: breathe 3s ease-in-out infinite, float 4s ease-in-out infinite; filter: drop-shadow(0 12px 24px rgba(255, 180, 100, 0.3)); }
.pet-display.egg .pet-emoji { animation: wiggle 1.5s ease-in-out infinite; }
.pet-display.sick .pet-emoji { animation: shake 0.5s ease-in-out infinite; filter: grayscale(0.6); }
.pet-display.dead .pet-emoji { filter: grayscale(1); opacity: 0.5; animation: none; }
@keyframes breathe { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.05) translateY(-4px); } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes wiggle { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
.pet-shadow { position: absolute; bottom: 30px; width: 140px; height: 14px; border-radius: 50%; background: radial-gradient(ellipse, rgba(0, 0, 0, 0.15), transparent 70%); filter: blur(6px); animation: shadowPulse 3s ease-in-out infinite; }
@keyframes shadowPulse { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 0.5; } }
.egg-hint, .sick-hint, .dead-hint { position: absolute; top: 20px; right: 20px; font-size: 13px; color: #fff; background: linear-gradient(135deg, #667eea, #764ba2); padding: 6px 16px; border-radius: 999px; animation: hintBounce 2s ease-in-out infinite; }
.sick-hint { background: linear-gradient(135deg, #ff9500, #ff3b30); }
.dead-hint { background: linear-gradient(135deg, #8e8e93, #48484a); }
@keyframes hintBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
.pet-info { text-align: center; position: relative; z-index: 2; }
.pet-name-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 14px; }
.pet-name { font-size: 34px; font-weight: 800; letter-spacing: -0.03em; margin: 0; }
.rename-btn { background: rgba(255, 255, 255, 0.6); border: none; font-size: 15px; cursor: pointer; padding: 6px 10px; border-radius: 10px; }
.pet-meta { display: flex; justify-content: center; gap: 10px; font-size: 13px; }
.stage-tag, .level-tag, .coins-tag { padding: 5px 14px; border-radius: 999px; font-weight: 600; }
.stage-tag { background: rgba(255, 255, 255, 0.7); }
.level-tag { background: linear-gradient(135deg, #af52de, #7c4dff); color: #fff; }
.coins-tag { background: linear-gradient(135deg, #ffcc00, #ff9500); color: #fff; }

.stats-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.8); border-radius: 24px; padding: 28px; margin-bottom: 24px; box-shadow: 0 12px 32px rgba(102, 126, 234, 0.08); }
.stat-row { display: flex; align-items: center; gap: 14px; padding: 12px 0; }
.stat-icon { font-size: 24px; width: 32px; text-align: center; }
.stat-label { font-size: 14px; font-weight: 600; width: 50px; }
.stat-bar { flex: 1; height: 16px; background: rgba(0, 0, 0, 0.06); border-radius: 999px; overflow: hidden; }
.stat-fill { height: 100%; border-radius: 999px; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
.stat-fill.normal { background: linear-gradient(90deg, #34c759, #5ac8fa); }
.stat-fill.warning { background: linear-gradient(90deg, #ff9500, #ffcc00); }
.stat-fill.danger { background: linear-gradient(90deg, #ff3b30, #ff6b5b); animation: pulseDanger 1.2s infinite; }
@keyframes pulseDanger { 0%, 100% { opacity: 1; } 50% { opacity: 0.65; } }
.stat-value { font-size: 18px; font-weight: 800; width: 50px; text-align: right; font-variant-numeric: tabular-nums; }

.actions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.action-btn { padding: 20px 12px; border: none; border-radius: 20px; cursor: pointer; transition: all 0.3s; display: flex; flex-direction: column; align-items: center; gap: 8px; font-family: inherit; font-size: 13px; font-weight: 700; color: #fff; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15); }
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.action-btn:not(:disabled):hover { transform: translateY(-4px) scale(1.03); box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2); }
.action-btn.feed { background: linear-gradient(135deg, #ff9500, #ff6b00); }
.action-btn.play { background: linear-gradient(135deg, #af52de, #7c4dff); }
.action-btn.clean { background: linear-gradient(135deg, #5ac8fa, #0071e3); }
.action-btn.sleep { background: linear-gradient(135deg, #34c759, #30b350); }
.action-icon { font-size: 28px; }

.revive-btn { width: 100%; padding: 20px; border-radius: 20px; border: none; background: linear-gradient(135deg, #ffcc00, #ff9500); color: #fff; font-size: 17px; font-weight: 700; cursor: pointer; margin-bottom: 24px; font-family: inherit; box-shadow: 0 12px 32px rgba(255, 149, 0, 0.3); animation: glowPulse 2s ease-in-out infinite; }
@keyframes glowPulse { 0%, 100% { box-shadow: 0 12px 32px rgba(255, 149, 0, 0.3); } 50% { box-shadow: 0 12px 40px rgba(255, 204, 0, 0.5); } }

.history-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border-radius: 24px; padding: 28px; box-shadow: 0 12px 32px rgba(102, 126, 234, 0.08); }
.history-card h3 { margin: 0 0 18px; font-size: 16px; font-weight: 700; }
.empty-history { color: #c7c7cc; font-size: 14px; text-align: center; padding: 24px; }
.history-item { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-bottom: 1px solid rgba(0, 0, 0, 0.04); }
.history-item:last-child { border-bottom: none; }
.history-icon { font-size: 22px; }
.history-text { flex: 1; font-size: 14px; font-weight: 500; }
.history-time { font-size: 12px; color: #86868b; }

.loading-wrap { display: flex; justify-content: center; padding: 120px 0; }
.loading-spinner { font-size: 72px; animation: breathe 1.5s ease-in-out infinite; }

.pet-buttons { display: flex; justify-content: center; gap: 10px; margin-top: 14px; }
.mini-btn { padding: 8px 20px; border-radius: 999px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.mini-btn.shop { background: linear-gradient(135deg, #0071e3, #5ac8fa); color: #fff; box-shadow: 0 4px 12px rgba(0, 113, 227, 0.3); }
.mini-btn.signin { background: linear-gradient(135deg, #ffcc00, #ff9500); color: #fff; box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3); }
.mini-btn.physics { background: linear-gradient(135deg, #af52de, #7c4dff); color: #fff; box-shadow: 0 4px 12px rgba(175, 82, 222, 0.3); }
.mini-btn:hover { transform: translateY(-2px) scale(1.05); }


/* ============ ⭐ 反应动画 ============ */
.pet-display { cursor: pointer; }

/* 吃东西 */
.pet-display.eating .pet-emoji {
  animation: chew 0.5s ease-in-out infinite !important;
}
@keyframes chew {
  0%, 100% { transform: scale(1) translateY(0); }
  25% { transform: scale(1.08, 0.92) translateY(-6px); }
  50% { transform: scale(0.95, 1.05) translateY(0); }
  75% { transform: scale(1.08, 0.92) translateY(-6px); }
}

/* 玩耍 - 摇摆 */
.pet-display.playing .pet-emoji {
  animation: swing 0.6s ease-in-out infinite !important;
}
@keyframes swing {
  0%, 100% { transform: rotate(-8deg) translateY(0); }
  25% { transform: rotate(0) translateY(-10px); }
  50% { transform: rotate(8deg) translateY(0); }
  75% { transform: rotate(0) translateY(-10px); }
}

/* 洗澡 - 抖动 */
.pet-display.cleaning .pet-emoji {
  animation: shiver 0.3s ease-in-out infinite !important;
}
@keyframes shiver {
  0%, 100% { transform: translateX(0) rotate(0); }
  25% { transform: translateX(-4px) rotate(-3deg); }
  75% { transform: translateX(4px) rotate(3deg); }
}

/* 睡觉 - 慢呼吸倾斜 */
.pet-display.sleeping .pet-emoji {
  animation: sleep 3s ease-in-out infinite !important;
}
@keyframes sleep {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(0.95) rotate(-5deg); }
}

/* 开心 - 跳跃 */
.pet-display.happy .pet-emoji {
  animation: jump 0.6s ease-in-out infinite !important;
}
@keyframes jump {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-25px) scale(1.05); }
}

/* 抖动 - 生病 */
.pet-display.shake .pet-emoji {
  animation: shakeHard 0.4s ease-in-out infinite !important;
}
@keyframes shakeHard {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

/* ============ ⭐ 浮动图标层 ============ */
.float-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
}
.float-icon {
  position: absolute;
  bottom: 40%;
  font-size: 28px;
  animation: floatUp 1.8s ease-out forwards;
  pointer-events: none;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
}
@keyframes floatUp {
  0% {
    opacity: 0;
    transform: translateY(0) scale(0.5);
  }
  20% {
    opacity: 1;
    transform: translateY(-20px) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translateY(-100px) scale(0.8);
  }
}

/* ============ ⭐ 状态气泡 ============ */
.status-bubble {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 18px;
  background: #fff;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  white-space: nowrap;
  z-index: 4;
  border: 2px solid rgba(0, 0, 0, 0.05);
}
.status-bubble::before {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #fff;
}

.bubble-pop-enter-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.bubble-pop-leave-active { transition: all 0.2s; }
.bubble-pop-enter-from { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.8); }
.bubble-pop-leave-to { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.9); }

/* 浮动图标列表进出 */
.float-icon-enter-active, .float-icon-leave-active {
  transition: all 0.3s;
}

.exp-bar-wrap { margin-top: 14px; max-width: 300px; margin-left: auto; margin-right: auto; }
.exp-bar { height: 8px; background: rgba(0, 0, 0, 0.06); border-radius: 999px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05); }
.exp-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.exp-fill::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 2s infinite;
}
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.exp-text { font-size: 11px; color: #86868b; text-align: right; margin-top: 4px; font-weight: 500; }
.mini-btn.ach { background: linear-gradient(135deg, #ffcc00, #ff9500); color: #fff; box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3); }
.mini-btn.friends { background: linear-gradient(135deg, #34c759, #5ac8fa); color: #fff; box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3); }
.mini-btn.deco { background: linear-gradient(135deg, #ff6b9d, #ff3b6b); color: #fff; box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3); }
.mini-btn.chat { background: linear-gradient(135deg, #5ac8fa, #0071e3); color: #fff; box-shadow: 0 4px 12px rgba(90, 200, 250, 0.3); }

.deco-overlay { position: absolute; pointer-events: none; }
.deco-overlay.hat { top: -10%; left: 50%; transform: translateX(-50%); font-size: 70px; z-index: 3; }
.deco-overlay.glasses { top: 30%; left: 50%; transform: translateX(-50%); font-size: 50px; z-index: 3; }

/* ============ ⭐ 死亡横幅 ============ */
.death-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(80, 80, 90, 0.95), rgba(50, 50, 60, 0.95));
  color: #fff;
  border-radius: 16px;
  margin-bottom: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
.banner-icon { font-size: 32px; }
.banner-text { flex: 1; font-size: 14px; line-height: 1.5; }
.banner-text b { color: #ffcc00; font-size: 16px; }
.banner-cause { font-size: 12px; color: rgba(255, 255, 255, 0.7); margin-top: 2px; }
.banner-enter-active { transition: all 0.4s; }
.banner-enter-from { opacity: 0; transform: translateY(-20px); }

/* ============ ⭐ 墓碑视觉 ============ */
.tombstone-visual {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  pointer-events: none;
}
.tombstone {
  font-size: 90px;
  line-height: 1;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
  animation: tombstoneShake 3s ease-in-out infinite;
}
@keyframes tombstoneShake {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-3px) rotate(-1deg); }
}

.death-particles {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
}
.death-particles span {
  font-size: 20px;
  opacity: 0;
  animation: smokeFloat 3s ease-in-out infinite;
}
.death-particles span:nth-child(2) { animation-delay: 0.5s; }
.death-particles span:nth-child(3) { animation-delay: 1s; }
@keyframes smokeFloat {
  0% { opacity: 0; transform: translateY(0) scale(0.5); }
  50% { opacity: 0.6; transform: translateY(-30px) scale(1); }
  100% { opacity: 0; transform: translateY(-50px) scale(0.8); }
}

/* 死亡时宠物变灰 */
.pet-display.dead .pet-emoji {
  filter: grayscale(1) brightness(0.6) !important;
  animation: none !important;
  opacity: 0.4;
}

/* ============ ⭐ 死亡状态操作区 ============ */
.death-actions {
  background: rgba(80, 80, 90, 0.08);
  border: 2px dashed rgba(80, 80, 90, 0.2);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  text-align: center;
}
.death-hint {
  color: #86868b;
  font-size: 15px;
  margin-bottom: 16px;
  font-weight: 500;
}
.revive-big-btn {
  padding: 16px 40px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #ffcc00, #ff9500);
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 12px 32px rgba(255, 149, 0, 0.3);
  transition: all 0.3s;
  animation: reviveGlow 2s ease-in-out infinite;
}
.revive-big-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 40px rgba(255, 149, 0, 0.4);
}
@keyframes reviveGlow {
  0%, 100% { box-shadow: 0 12px 32px rgba(255, 149, 0, 0.3); }
  50% { box-shadow: 0 12px 40px rgba(255, 204, 0, 0.6); }
}

.mini-btn.diary { background: linear-gradient(135deg, #ff6b9d, #ff3b6b); color: #fff; box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3); }

.mini-btn.style { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); }

@media (max-width: 640px) {
  .float-icon { font-size: 22px; }
  .status-bubble { font-size: 12px; padding: 6px 14px; }
}

@media (max-width: 640px) {
  .nav-inner { padding: 12px 16px; }
  .user-name { display: none; }
  .main { padding: 24px 16px 80px; }
  .species-grid { grid-template-columns: repeat(3, 1fr); }
  .pet-emoji { font-size: 150px; }
  .pet-display { height: 200px; }
  .pet-name { font-size: 26px; }
  .actions-grid { grid-template-columns: repeat(2, 1fr); }
}


/* ============================================================
   猫狗回忆录 V1 - 成长系统
   ============================================================ */

.pet-overview-grid {

  display:
    grid;

  grid-template-columns:
    1.25fr 1fr;

  gap:
    16px;

  margin-bottom:
    16px;

}


.info-card {

  background:
    rgba(255,255,255,.76);

  backdrop-filter:
    blur(20px);

  border:
    1px solid rgba(255,255,255,.85);

  border-radius:
    22px;

  padding:
    22px;

  box-shadow:
    0 10px 28px rgba(102,126,234,.07);

}


.card-title-row,
.section-heading {

  display:
    flex;

  align-items:
    center;

  justify-content:
    space-between;

  gap:
    12px;

}


.card-kicker {

  display:
    block;

  font-size:
    11px;

  color:
    #86868b;

  font-weight:
    700;

  letter-spacing:
    .08em;

  margin-bottom:
    3px;

}


.info-card h3 {

  margin:
    0;

  font-size:
    18px;

}


.health-copy {

  margin:
    10px 0 16px;

  color:
    #6e6e73;

  font-size:
    13px;

}


.mood-badge {

  padding:
    6px 10px;

  border-radius:
    999px;

  background:
    rgba(52,199,89,.1);

  color:
    #248a3d;

  font-size:
    12px;

  font-weight:
    700;

  white-space:
    nowrap;

}


.exp-line {

  display:
    flex;

  justify-content:
    space-between;

  color:
    #86868b;

  font-size:
    11px;

  margin-bottom:
    7px;

}


.exp-bar {

  height:
    10px;

  border-radius:
    999px;

  background:
    rgba(0,0,0,.06);

  overflow:
    hidden;

}


.exp-bar > div {

  height:
    100%;

  border-radius:
    999px;

  background:
    linear-gradient(
      90deg,
      #667eea,
      #af52de,
      #f093fb
    );

  transition:
    width .7s ease;

}


.personality-card {

  display:
    flex;

  align-items:
    center;

  gap:
    16px;

}


.personality-icon {

  width:
    58px;

  height:
    58px;

  border-radius:
    18px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  font-size:
    34px;

  background:
    linear-gradient(
      135deg,
      #fff2cf,
      #fce8ff
    );

  flex:
    none;

}


.personality-card p {

  margin:
    7px 0 4px;

  color:
    #86868b;

  font-size:
    12px;

  line-height:
    1.6;

}


.personality-bonus {

  color:
    #af52de;

  font-size:
    11px;

  font-weight:
    600;

}


.tasks-card {

  margin-bottom:
    16px;

}


.task-tip {

  font-size:
    11px;

  color:
    #86868b;

}


.task-list {

  margin-top:
    14px;

}


.task-item {

  display:
    flex;

  align-items:
    center;

  gap:
    10px;

  padding:
    11px 0;

  border-top:
    1px solid rgba(0,0,0,.05);

}


.task-item:first-child {

  border-top:
    none;

}


.task-icon {

  font-size:
    22px;

  width:
    30px;

  text-align:
    center;

}


.task-main {

  flex:
    1;

  min-width:
    0;

}


.task-main strong {

  display:
    block;

  font-size:
    13px;

  margin-bottom:
    6px;

}


.task-progress {

  height:
    6px;

  border-radius:
    999px;

  background:
    rgba(0,0,0,.06);

  overflow:
    hidden;

}


.task-progress span {

  display:
    block;

  height:
    100%;

  border-radius:
    999px;

  background:
    linear-gradient(
      90deg,
      #5ac8fa,
      #34c759
    );

  transition:
    width .4s ease;

}


.task-count {

  font-size:
    11px;

  color:
    #86868b;

  width:
    32px;

  text-align:
    right;

}


.claim-btn {

  border:
    0;

  border-radius:
    999px;

  padding:
    5px 10px;

  background:
    #ff9500;

  color:
    #fff;

  font-size:
    11px;

  font-weight:
    700;

  cursor:
    pointer;

}


.claim-btn:disabled {

  background:
    #d1d1d6;

  cursor:
    not-allowed;

}


.task-item.claimed {

  opacity:
    .65;

}


.achievement-count {

  font-size:
    12px;

  font-weight:
    800;

  color:
    #af52de;

}


.memory-item {

  display:
    flex;

  gap:
    10px;

  padding:
    11px 0;

  border-top:
    1px solid rgba(0,0,0,.05);

}


.memory-item:first-of-type {

  margin-top:
    8px;

}


.memory-icon {

  font-size:
    20px;

  width:
    28px;

  text-align:
    center;

}


.memory-item strong {

  font-size:
    12px;

}


.memory-item p {

  margin:
    3px 0;

  font-size:
    11px;

  color:
    #6e6e73;

}


.memory-item time {

  font-size:
    10px;

  color:
    #a1a1a6;

}


.muted-empty {

  color:
    #a1a1a6;

  font-size:
    12px;

  text-align:
    center;

  padding:
    22px 0;

}


.achievement-list {

  margin-top:
    10px;

  max-height:
    280px;

  overflow:
    auto;

}


.achievement-item {

  display:
    flex;

  align-items:
    center;

  gap:
    9px;

  padding:
    9px 0;

  opacity:
    .48;

  border-top:
    1px solid rgba(0,0,0,.05);

}


.achievement-item:first-child {

  border-top:
    none;

}


.achievement-item > span {

  font-size:
    20px;

  width:
    27px;

  text-align:
    center;

}


.achievement-item div {

  flex:
    1;

  min-width:
    0;

}


.achievement-item strong {

  display:
    block;

  font-size:
    12px;

}


.achievement-item small {

  display:
    block;

  margin-top:
    2px;

  color:
    #86868b;

  font-size:
    10px;

}


.achievement-item b {

  font-size:
    12px;

  color:
    #a1a1a6;

}


.achievement-item.unlocked {

  opacity:
    1;

}


.achievement-item.unlocked b {

  color:
    #34c759;

}


@media (max-width:700px) {

  .pet-overview-grid {

    grid-template-columns:
      1fr;

  }

  .task-tip {

    display:
      none;

  }

}


@media (max-width:640px) {

  .task-item {

    gap:
      7px;

  }

  .task-count {

    width:
      28px;

  }

  .claim-btn {

    padding:
      5px 8px;

  }

}


@import '@/styles/pet-mobile.css';
</style>
