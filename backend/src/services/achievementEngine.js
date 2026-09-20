const { PetAchievement, PetUserAchievement, PetCoinLog } = require('../models');

/**
 * 检查并解锁成就
 * @param {Object} pet 宠物对象
 * @returns {Array} 新解锁的成就列表
 */
async function checkAchievements(pet) {
  const achievements = await PetAchievement.findAll({ order: [['sort', 'ASC']] });
  const unlocked = [];

  for (const ach of achievements) {
    try {
      // 查询/创建进度
      const [progress] = await PetUserAchievement.findOrCreate({
        where: { pet_id: pet.id, achievement_id: ach.id },
        defaults: { progress: 0 }
      });

      // 已解锁，跳过
      if (progress.unlocked_at) continue;

      // 计算当前进度
      const cond = ach.condition || {};
      let currentProgress = 0;

      switch (cond.type) {
        case 'feed':  currentProgress = pet.total_feed  || 0; break;
        case 'play':  currentProgress = pet.total_play  || 0; break;
        case 'clean': currentProgress = pet.total_clean || 0; break;
        case 'sleep': currentProgress = pet.total_sleep || 0; break;
        case 'level': currentProgress = pet.level || 1; break;
        case 'coins': currentProgress = pet.coins || 0; break;
        case 'stage': currentProgress = pet.stage === cond.value ? 1 : 0; break;
        default:      currentProgress = 0;
      }

      // 更新进度
      if (currentProgress !== progress.progress) {
        await progress.update({ progress: currentProgress });
      }

      // 检查是否达成
      const target = cond.count || cond.value || 1;
      if (currentProgress >= target) {
        // 解锁
        await progress.update({
          progress: target,
          unlocked_at: new Date()
        });

        // 发金币奖励
        if (ach.reward_coins > 0) {
          const newCoins = (pet.coins || 0) + ach.reward_coins;
          await pet.update({ coins: newCoins });
          await PetCoinLog.create({
            pet_id: pet.id,
            amount: ach.reward_coins,
            reason: 'achievement',
            balance: newCoins
          });
          pet.coins = newCoins;
        }

        unlocked.push({
          id: ach.id,
          code: ach.code,
          name: ach.name,
          icon: ach.icon,
          description: ach.description,
          reward_coins: ach.reward_coins
        });

        console.log(`🏆 解锁成就：${ach.icon} ${ach.name}`);
      }
    } catch (e) {
      console.error(`❌ 检查成就 ${ach.code} 失败:`, e.message);
    }
  }

  return unlocked;
}

/**
 * 获取宠物成就列表（含进度）
 */
async function getPetAchievements(petId) {
  const achievements = await PetAchievement.findAll({ order: [['sort', 'ASC']] });
  const userAchievements = await PetUserAchievement.findAll({
    where: { pet_id: petId }
  });

  const progressMap = {};
  userAchievements.forEach(ua => {
    progressMap[ua.achievement_id] = ua;
  });

  return achievements.map(ach => {
    const ua = progressMap[ach.id];
    const cond = ach.condition || {};
    const target = cond.count || cond.value || 1;

    return {
      id: ach.id,
      code: ach.code,
      name: ach.name,
      icon: ach.icon,
      description: ach.description,
      reward_coins: ach.reward_coins,
      target,
      progress: ua?.progress || 0,
      unlocked: !!ua?.unlocked_at,
      unlocked_at: ua?.unlocked_at
    };
  });
}

module.exports = { checkAchievements, getPetAchievements };
