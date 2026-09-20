<template>
  <div class="pet-park" :class="{ expanded }">
    <canvas ref="canvasEl" class="pet-canvas"></canvas>

    <!-- 底部信息条 -->
    <div class="park-info">
      <span class="info-emoji">{{ pet?.speciesInfo?.emoji || '🐱' }}</span>
      <span class="info-name">{{ pet?.name || '我的宠物' }}</span>
      <div class="info-bars">
        <div class="mini-bar"><span>🍖</span><div class="bar-bg"><div class="bar-fill" :style="{ width: (pet?.hunger || 0) + '%' }"></div></div></div>
        <div class="mini-bar"><span>😊</span><div class="bar-bg"><div class="bar-fill mood" :style="{ width: (pet?.mood || 0) + '%' }"></div></div></div>
      </div>
      <button class="expand-btn" @click="expanded = !expanded">
        {{ expanded ? '▾' : '▴' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import Matter from 'matter-js';
import { getPet } from '@/api/pet';

const canvasEl = ref(null);
const pet = ref(null);
const expanded = ref(false);

let engine = null;
let render = null;
let runner = null;
let petBody = null;
let walls = [];
let mouseConstraint = null;
let audioCtx = null;
let lastBounceTime = 0;
let autoJumpTimer = null;

// ============ 音效 ============
function playBounceSound() {
  const now = Date.now();
  if (now - lastBounceTime < 150) return;  // 限流
  lastBounceTime = now;

  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(600 + Math.random() * 400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.1);
  } catch (e) {}
}

// ============ emoji 转图片 ============
function emojiToImage(emoji) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = '100px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 64, 68);
  return canvas.toDataURL();
}

// ============ 初始化 ============
function initPhysics() {
  const canvas = canvasEl.value;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  // 引擎（重力小一点，宠物慢慢飘）
  engine = Matter.Engine.create({
    gravity: { x: 0, y: 1, scale: 0.0008 }
  });

  // 渲染
  render = Matter.Render.create({
    canvas,
    engine,
    options: {
      width,
      height,
      wireframes: false,
      background: 'transparent',
      pixelRatio: window.devicePixelRatio || 1
    }
  });

  // 墙壁（底部 + 左右，顶部不封，宠物从天而降）
  const t = 60;
  const wallOpts = { isStatic: true, render: { visible: false }, friction: 0.05 };

  const ground = Matter.Bodies.rectangle(width / 2, height + t / 2, width, t, wallOpts);
  const leftWall = Matter.Bodies.rectangle(-t / 2, height / 2, t, height * 2, wallOpts);
  const rightWall = Matter.Bodies.rectangle(width + t / 2, height / 2, t, height * 2, wallOpts);

  walls = [ground, leftWall, rightWall];

  // 宠物 body
  const emoji = pet.value?.speciesInfo?.emoji || '🐱';
  const radius = 38;

  petBody = Matter.Bodies.circle(width / 2, 50, radius, {
    restitution: 0.85,      // 很弹
    friction: 0.001,
    frictionAir: 0.008,     // 空气阻力小（飘得远）
    density: 0.0008,
    render: {
      sprite: {
        texture: emojiToImage(emoji),
        xScale: 1,
        yScale: 1
      }
    }
  });

  Matter.Composite.add(engine.world, [petBody, ...walls]);

  // 鼠标拖拽
  const mouse = Matter.Mouse.create(canvas);
  mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: 0.15, render: { visible: false } }
  });
  Matter.Composite.add(engine.world, mouseConstraint);

  // 碰撞音效
  Matter.Events.on(engine, 'collisionStart', (event) => {
    const isPetHit = event.pairs.some(p =>
      p.bodyA === petBody || p.bodyB === petBody
    );
    if (isPetHit) playBounceSound();
  });

  // 启动
  Matter.Render.run(render);
  runner = Matter.Runner.create();
  Matter.Runner.run(runner, engine);

  // ⭐ 自动跳动：每 3-5 秒宠物自己跳一下
  autoJumpTimer = setInterval(() => {
    if (!petBody) return;
    const randomX = (Math.random() - 0.5) * 0.02;
    Matter.Body.setVelocity(petBody, { x: randomX, y: -0.5 - Math.random() * 0.3 });
  }, 3500 + Math.random() * 2000);
}

// ============ 大小变化 ============
function onResize() {
  if (!render || !engine) return;
  const canvas = canvasEl.value;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  render.canvas.width = w * (window.devicePixelRatio || 1);
  render.canvas.height = h * (window.devicePixelRatio || 1);
  render.canvas.style.width = w + 'px';
  render.canvas.style.height = h + 'px';
  render.options.width = w;
  render.options.height = h;

  // 重建墙
  Matter.Composite.remove(engine.world, walls);
  const t = 60;
  const wallOpts = { isStatic: true, render: { visible: false }, friction: 0.05 };
  walls = [
    Matter.Bodies.rectangle(w / 2, h + t / 2, w, t, wallOpts),
    Matter.Bodies.rectangle(-t / 2, h / 2, t, h * 2, wallOpts),
    Matter.Bodies.rectangle(w + t / 2, h / 2, t, h * 2, wallOpts)
  ];
  Matter.Composite.add(engine.world, walls);
}

// ============ 生命周期 ============
onMounted(async () => {
  try { pet.value = await getPet(); } catch (e) {}
  await new Promise(r => setTimeout(r, 100));
  initPhysics();
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  if (engine) {
    Matter.Render.stop(render);
    Matter.Runner.stop(runner);
    Matter.Engine.clear(engine);
  }
  if (autoJumpTimer) clearInterval(autoJumpTimer);
  window.removeEventListener('resize', onResize);
});

// 监听 expanded 变化 → 舞台高度变化
watch(expanded, () => {
  setTimeout(onResize, 350);
});
</script>

<style scoped>
.pet-park {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 180px;
  z-index: 9998;
  pointer-events: none;             /* 默认穿透（不挡下面内容点击） */
  transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(180deg, transparent 0%, rgba(224, 242, 255, 0.15) 100%);
}
.pet-park.expanded { height: 320px; }

.pet-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;             /* canvas 上可以抓宠物 */
  cursor: grab;
}
.pet-canvas:active { cursor: grabbing; }

/* 底部信息条 */
.park-info {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 14px 6px 6px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  border-radius: 999px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  pointer-events: auto;
  font-size: 13px;
}
.info-emoji { font-size: 20px; }
.info-name { font-weight: 600; color: #1d1d1f; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.info-bars { display: flex; gap: 10px; }
.mini-bar { display: flex; align-items: center; gap: 4px; font-size: 11px; }
.bar-bg {
  width: 40px;
  height: 4px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 999px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff9500, #ffcc00);
  border-radius: 999px;
  transition: width 0.6s;
}
.bar-fill.mood { background: linear-gradient(90deg, #34c759, #5ac8fa); }

.expand-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: #1d1d1f;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.expand-btn:hover { background: rgba(0, 113, 227, 0.1); color: #0071e3; }

@media (max-width: 640px) {
  .pet-park { height: 140px; }
  .pet-park.expanded { height: 260px; }
  .park-info { font-size: 11px; padding: 4px 10px 4px 4px; }
  .info-emoji { font-size: 16px; }
  .info-name { max-width: 60px; }
  .info-bars { display: none; }       /* 手机屏幕小，隐藏数值条 */
}
</style>
