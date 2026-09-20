const { PetDiary, Pet, PetAction } = require('../models');
const { Op, fn, col } = require('sequelize');

/**
 * 生成本周日记
 */
async function generateWeeklyDiary(petId) {
  // 本周起始日（周一）
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  const weekStart = monday.toISOString().slice(0, 10);

  // 检查是否已生成
  const exist = await PetDiary.findOne({
    where: { pet_id: petId, week_start: weekStart }
  });
  if (exist) return exist;

  // 统计本周行为
  const stats = await PetAction.findAll({
    where: {
      pet_id: petId,
      created_at: { [Op.gte]: monday }
    },
    attributes: [
      'action',
      [fn('COUNT', col('id')), 'count']
    ],
    group: ['action'],
    raw: true
  });

  const statMap = {};
  stats.forEach(s => { statMap[s.action] = +s.count; });

  // 取宠物数据
  const pet = await Pet.findByPk(petId);
  if (!pet) return null;

  const data = {
    feed_count: statMap.feed || 0,
    play_count: statMap.play || 0,
    clean_count: statMap.clean || 0,
    sleep_count: statMap.sleep || 0,
    level_up: 0,
    achievements: 0,
    mood_avg: +pet.mood
  };

  // 生成文案
  const totalActions = data.feed_count + data.play_count + data.clean_count + data.sleep_count;
  let intimacyText = '';
  if (totalActions > 50) intimacyText = '我们几乎每天都在一起，超级开心！';
  else if (totalActions > 20) intimacyText = '这一周你陪我玩了好多次～';
  else if (totalActions > 5) intimacyText = '虽然你有点忙，但我还是很开心。';
  else intimacyText = '这一周有点冷清呢，记得多来看看我～';

  const content = `亲爱的主人：

这是我来到你身边的第 ${Math.max(1, Math.floor((Date.now() - new Date(pet.created_at).getTime()) / 86400000 / 7) + 1)} 周。

这一周：
· 你喂了我 ${data.feed_count} 次 🍖
· 陪我玩了 ${data.play_count} 次 🎮
· 给我洗了 ${data.clean_count} 次澡 🛁
· 我睡了 ${data.sleep_count} 次 😴

现在的心情：${Math.round(data.mood_avg)}%
好感度：${pet.intimacy || 0}

${intimacyText}

明天见～
                               —— 你的 ${pet.name}`;

  const diary = await PetDiary.create({
    pet_id: petId,
    week_start: weekStart,
    feed_count: data.feed_count,
    play_count: data.play_count,
    clean_count: data.clean_count,
    sleep_count: data.sleep_count,
    mood_avg: data.mood_avg,
    content
  });

  return diary;
}

/**
 * 获取宠物的日记列表
 */
async function getPetDiaries(petId, limit = 10) {
  return await PetDiary.findAll({
    where: { pet_id: petId },
    order: [['week_start', 'DESC']],
    limit
  });
}

module.exports = { generateWeeklyDiary, getPetDiaries };
