const { Pet } = require('../models');

// 随机事件池
const RANDOM_EVENTS = [
  { icon: '😴', text: '打了个哈欠', mood: 0 },
  { icon: '🐾', text: '舔了舔爪子', mood: 1 },
  { icon: '🌀', text: '追着自己的尾巴转圈', mood: 3 },
  { icon: '😺', text: '睡梦中说了梦话："小鱼干..."', mood: 2 },
  { icon: '🐭', text: '抓住了一只老鼠！', mood: 5, coins: 10 },
  { icon: '💨', text: '突然跑出去了（10 分钟）', mood: -2 },
  { icon: '🌞', text: '找到了一块阳光好的地方晒太阳', mood: 3 },
  { icon: '🐟', text: '偷偷吃了主人的鱼', mood: 5, hunger: 10 },
  { icon: '🏺', text: '不小心打翻了花瓶...', mood: -5 },
  { icon: '🐱', text: '对着镜子发呆', mood: 1 },
  { icon: '💤', text: '睡了一整天', mood: 0, energy: 20 },
  { icon: '🎾', text: '发现了新的玩具球', mood: 8 }
];

/**
 * 检查并触发随机事件
 */
async function checkRandomEvent(pet) {
  const now = Date.now();
  const lastRandom = pet.last_random_at || 0;
  const elapsedMin = (now - lastRandom) / 1000 / 60;

  // 每 30 分钟可能触发一次
  if (elapsedMin < 30) return null;

  // 30% 概率触发
  if (Math.random() > 0.3) {
    await Pet.update({ last_random_at: now }, { where: { id: pet.id } });
    return null;
  }

  // 随机选一个事件
  const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];

  // 应用效果
  const updates = { last_random_at: now };
  if (event.mood) {
    updates.mood = Math.max(0, Math.min(100, +pet.mood + event.mood));
  }
  if (event.hunger) {
    updates.hunger = Math.max(0, Math.min(100, +pet.hunger + event.hunger));
  }
  if (event.energy) {
    updates.energy = Math.max(0, Math.min(100, +pet.energy + event.energy));
  }
  if (event.coins) {
    updates.coins = (pet.coins || 0) + event.coins;
  }

  await Pet.update(updates, { where: { id: pet.id } });

  return {
    icon: event.icon,
    text: event.text,
    effects: {
      mood: event.mood || 0,
      hunger: event.hunger || 0,
      energy: event.energy || 0,
      coins: event.coins || 0
    }
  };
}

module.exports = { checkRandomEvent, RANDOM_EVENTS };
