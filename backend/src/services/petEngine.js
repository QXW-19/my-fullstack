const Pet = require('../models/pet');

// 属性衰减速率（每分钟）
const DECAY_RATES = {
  hunger: 0.8,
  mood: 0.6,
  clean: 0.5,
  energy: 0.4
};

const THRESHOLDS = {
  LOW: 30,
  DANGER: 15,
  RECOVER: 40
};

const LEVEL_EXP = {
  egg: 100,
  baby: 500
};

// ⭐ 阶段 emoji 映射
const STAGE_EMOJI = {
  cat:    { egg: '🥚', baby: '🐱', adult: '🐈' },
  dog:    { egg: '🥚', baby: '🐶', adult: '🐕' },
  dragon: { egg: '🥚', baby: '🐲', adult: '🐉' },
  rabbit: { egg: '🥚', baby: '🐰', adult: '🐇' },
  panda:  { egg: '🥚', baby: '🐼', adult: '🐼' }
};

// ⭐ 兼容 BIGINT（数字）和 DATE（字符串）两种格式
function getLastUpdateMs(value) {
  if (!value) return Date.now();
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Date) return value.getTime();
  // 尝试当字符串解析
  const parsed = new Date(value).getTime();
  if (!isNaN(parsed)) return parsed;
  const num = Number(value);
  if (!isNaN(num)) return num;
  return Date.now();
}

/**
 * 计算衰减
 */
function applyDecay(pet) {
  const now = Date.now();
  const lastMs = getLastUpdateMs(pet.last_update);
  const elapsedMin = (now - lastMs) / 1000 / 60;

  // 1 分钟内不衰减
  if (elapsedMin < 1) {
    return {
      hunger: +pet.hunger,
      mood: +pet.mood,
      clean: +pet.clean,
      energy: +pet.energy,
      elapsedMin: 0
    };
  }

  // 最多算 24 小时（防止长期不上线）
  const cappedMin = Math.min(elapsedMin, 24 * 60);

  const result = {
    hunger: Math.max(0, +pet.hunger - cappedMin * DECAY_RATES.hunger),
    mood: Math.max(0, +pet.mood - cappedMin * DECAY_RATES.mood),
    clean: Math.max(0, +pet.clean - cappedMin * DECAY_RATES.clean),
    energy: Math.max(0, +pet.energy - cappedMin * DECAY_RATES.energy),
    elapsedMin
  };

  result.hunger = +result.hunger.toFixed(2);
  result.mood = +result.mood.toFixed(2);
  result.clean = +result.clean.toFixed(2);
  result.energy = +result.energy.toFixed(2);

  return result;
}

/**
 * 状态机
 */
function checkStage(pet, values) {
  const avg = (values.hunger + values.mood + values.clean + values.energy) / 4;

  // 死亡：平均 < 5
  if (avg < 5 && pet.stage !== 'egg') return 'dead';

  // 生病：平均 < 15
  if (avg < THRESHOLDS.DANGER && pet.stage !== 'egg' && pet.stage !== 'dead') {
    return 'sick';
  }

  // 康复
  if (pet.stage === 'sick' && avg >= THRESHOLDS.RECOVER) {
    return pet.level >= 5 ? 'adult' : 'baby';
  }

  // 蛋 → 幼年
  if (pet.stage === 'egg' && pet.exp >= LEVEL_EXP.egg) return 'baby';

  // 幼年 → 成年
  if (pet.stage === 'baby' && pet.exp >= LEVEL_EXP.baby) return 'adult';

  return pet.stage;
}

/**
 * 同步宠物（应用衰减 + 状态判定）
 */
async function syncPet(pet) {
  const values = applyDecay(pet);

  if (values.elapsedMin === 0) {
    return { pet: pet.toJSON ? pet.toJSON() : pet, changed: false };
  }

  const newStage = checkStage(pet, values);

  const updateData = {
    hunger: values.hunger,
    mood: values.mood,
    clean: values.clean,
    energy: values.energy,
    last_update: Date.now()
  };

  if (newStage !== pet.stage) {
    updateData.stage = newStage;
    console.log(`🐾 宠物 ${pet.name} 状态变化: ${pet.stage} → ${newStage}`);

    if (newStage === 'dead') {
      const cause = values.hunger < 10 ? '饿死'
                  : values.energy < 10 ? '累死'
                  : values.clean < 10 ? '太脏生病'
                  : values.mood < 10 ? '郁郁寡欢'
                  : '综合衰竭';
      updateData.died_at = new Date();
      updateData.death_cause = cause;

      // ⭐ 异步发死亡邮件
      setTimeout(async () => {
        try {
          const { User } = require('../models');
          const mailer = require('./mailer');
          const owner = await User.findByPk(pet.user_id, {
            attributes: ['username', 'email', 'email_notify']
          });
          if (owner?.email && owner.email_notify === 1) {
            mailer.sendPetDiedNotification({
              to: owner.email,
              toName: owner.username,
              petName: pet.name,
              cause,
              link: 'http://101.37.234.235:8080/pet'
            }).catch(() => {});
          }
        } catch (e) {}
      }, 100);
    }
  }

  await Pet.update(updateData, { where: { id: pet.id } });

  const updated = await Pet.findByPk(pet.id);

  return {
    pet: updated.toJSON(),
    changed: true,
    stageChanged: newStage !== pet.stage
  };
}

/**
 * 行为效果
 */
const ACTIONS = {
  feed:  { name: '喂食', effect: { hunger: 25, mood: 3 },  exp: 5, coins: 0 },
  play:  { name: '玩耍', effect: { mood: 20, energy: -5, hunger: -3 }, exp: 8, coins: 0 },
  clean: { name: '洗澡', effect: { clean: 30, mood: 2 },   exp: 5, coins: 0 },
  sleep: { name: '睡觉', effect: { energy: 30, mood: 5 },  exp: 3, coins: 0 }
};

/**
 * 执行行为
 */
async function doAction(pet, actionKey) {
  const action = ACTIONS[actionKey];
  if (!action) throw new Error('未知行为');

  const synced = await syncPet(pet);
  const currentPet = synced.pet;

  if (currentPet.stage === 'dead') throw new Error('宠物已经离开了...');
  if (currentPet.stage === 'sick') throw new Error('宠物生病了，请先治疗');

  const newValues = {};
  for (const [key, delta] of Object.entries(action.effect)) {
    const current = +currentPet[key];
    newValues[key] = Math.max(0, Math.min(100, current + delta));
  }

  const expGain = action.exp;
  const newExp = currentPet.exp + expGain;
  const statsKey = `total_${actionKey}`;

  // ⭐ 好感度增加
  const INTIMACY_GAIN = { feed: 2, play: 3, clean: 1, sleep: 1 };
  const newIntimacy = Math.min(100, (currentPet.intimacy || 0) + (INTIMACY_GAIN[actionKey] || 1));

  await Pet.update(
    {
      ...newValues,
      exp: newExp,
      intimacy: newIntimacy,
      [statsKey]: (currentPet[statsKey] || 0) + 1,
      last_update: Date.now()
    },
    { where: { id: pet.id } }
  );

  const updated = await Pet.findByPk(pet.id);
  const newStage = checkStage(updated, newValues);
  if (newStage !== updated.stage) {
    await updated.update({ stage: newStage });
  }

  return {
    action: action.name,
    effect: action.effect,
    expGain,
    pet: (await Pet.findByPk(pet.id)).toJSON()
  };
}

function healthScore(pet) {
  const avg = (+pet.hunger + +pet.mood + +pet.clean + +pet.energy) / 4;
  return Math.round(avg);
}

module.exports = {
  STAGE_EMOJI,
  applyDecay,
  checkStage,
  syncPet,
  doAction,
  healthScore,
  ACTIONS,
  THRESHOLDS,
  DECAY_RATES
};
