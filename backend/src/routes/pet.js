const router = require('express').Router();
const { Pet, PetAction, PetDecoration } = require('../models');
const { success, fail } = require('../utils/response');
const auth = require('../middlewares/auth');
const engine = require('../services/petEngine');
const achievementEngine = require('../services/achievementEngine');
const { checkRandomEvent } = require('../services/petEvents');
const { generateWeeklyDiary, getPetDiaries } = require('../services/petDiary');

router.use(auth);

const SPECIES = {
  cat:    { name: '猫',   emoji: '🐱', speed: 1.0 },
  dog:    { name: '狗',   emoji: '🐶', speed: 1.1 },
  dragon: { name: '龙',   emoji: '🐉', speed: 1.3 },
  rabbit: { name: '兔',   emoji: '🐰', speed: 0.9 },
  panda:  { name: '熊猫', emoji: '🐼', speed: 1.2 }
};

// 领养
router.post('/adopt', async (req, res) => {
  try {
    const { name, species } = req.body;
    if (!name?.trim()) return fail(res, '请给宠物起个名字');
    if (name.length > 20) return fail(res, '名字太长');
    if (!SPECIES[species]) return fail(res, '请选择物种');

    const exist = await Pet.findOne({ where: { user_id: req.user.id } });
    if (exist) return fail(res, '你已经有一只宠物了');

    const pet = await Pet.create({
      user_id: req.user.id,
      name: name.trim(),
      species,
      stage: 'egg',
      coins: 1000,
      last_update: Date.now(),
      birthday: new Date()
    });

    success(res, pet, '领养成功！🐾');
  } catch (e) { fail(res, e.message); }
});

// 获取宠物
router.get('/', async (req, res) => {
  try {
    const pet = await Pet.findOne({ where: { user_id: req.user.id } });
    if (!pet) return success(res, null);

    const { pet: syncedPet } = await engine.syncPet(pet);

    const STAGE_EMOJI = engine.STAGE_EMOJI || {};
    const stageEmoji = STAGE_EMOJI[syncedPet.species]?.[syncedPet.stage] || SPECIES[syncedPet.species]?.emoji || '🐱';

    // 查装扮详情
    let equippedInfo = {};
    if (syncedPet.equipped && Object.keys(syncedPet.equipped).length) {
      try {
        const decoIds = Object.values(syncedPet.equipped).filter(Boolean);
        if (decoIds.length) {
          const decos = await PetDecoration.findAll({
            where: { id: decoIds },
            attributes: ['id', 'name', 'icon', 'type']
          });
          const decoMap = {};
          decos.forEach(d => { decoMap[d.id] = { icon: d.icon, name: d.name, type: d.type }; });
          Object.entries(syncedPet.equipped).forEach(([type, id]) => {
            if (decoMap[id]) equippedInfo[type] = decoMap[id];
          });
        }
      } catch (e) {}
    }

    // 随机事件
    let randomEvent = null;
    try {
      const { checkRandomEvent } = require('../services/petEvents');
      randomEvent = await checkRandomEvent(syncedPet);
    } catch (e) {
      console.error('randomEvent error:', e.message);
    }

    success(res, {
      ...syncedPet,
      speciesInfo: { ...SPECIES[syncedPet.species], emoji: stageEmoji },
      currentEmoji: stageEmoji,
      equipped: syncedPet.equipped || {},
      equippedInfo,
      healthScore: engine.healthScore(syncedPet),
      tone: syncedPet.tone || 'normal',
      skin: syncedPet.skin || 'default',
      randomEvent
    });
  } catch (e) {
    console.error('GET /pet error:', e);
    fail(res, e.message);
  }
});

// 执行行为
router.post('/action', async (req, res) => {
  try {
    const { action } = req.body;
    if (!['feed', 'play', 'clean', 'sleep'].includes(action)) {
      return fail(res, '未知行为');
    }

    const pet = await Pet.findOne({ where: { user_id: req.user.id } });
    if (!pet) return fail(res, '你还没有宠物');

    const result = await engine.doAction(pet, action);

    await PetAction.create({
      pet_id: pet.id,
      action,
      effect: engine.ACTIONS[action].effect,
      coins_cost: 0
    });

    const freshPet = await Pet.findByPk(pet.id);
    let unlocked = [];
    try {
      unlocked = await achievementEngine.checkAchievements(freshPet);
    } catch (e) {
      console.error('checkAchievements error:', e.message);
    }

    success(res, { ...result, unlocked }, result.action + '成功！');
  } catch (e) { fail(res, e.message); }
});

// 行为历史
router.get('/actions', async (req, res) => {
  try {
    const pet = await Pet.findOne({ where: { user_id: req.user.id } });
    if (!pet) return fail(res, '你还没有宠物');

    const actions = await PetAction.findAll({
      where: { pet_id: pet.id },
      order: [['created_at', 'DESC']],
      limit: 5
    });

    success(res, actions);
  } catch (e) { fail(res, e.message); }
});

// 改名
router.post('/rename', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return fail(res, '名字不能为空');
    if (name.length > 20) return fail(res, '名字太长');

    const pet = await Pet.findOne({ where: { user_id: req.user.id } });
    if (!pet) return fail(res, '你还没有宠物');

    await pet.update({ name: name.trim() });
    success(res, null, '改名成功');
  } catch (e) { fail(res, e.message); }
});

// 复活（花 500 金币）
router.post('/revive', async (req, res) => {
  try {
    const pet = await Pet.findOne({ where: { user_id: req.user.id } });
    if (!pet) return fail(res, '你还没有宠物');
    if (pet.stage !== 'dead') return fail(res, '宠物还活着');

    const COST = 500;
    if (pet.coins < COST) {
      return fail(res, `需要 ${COST} 金币，你只有 ${pet.coins}`);
    }

    await pet.update({
      stage: pet.level >= 5 ? 'adult' : 'baby',
      coins: pet.coins - COST,
      hunger: 60,
      mood: 60,
      clean: 60,
      energy: 60,
      last_update: Date.now(),
      died_at: null,
      death_cause: null,
      revive_count: (pet.revive_count || 0) + 1
    });

    success(res, {
      revive_count: (pet.revive_count || 0) + 1,
      coins: pet.coins - COST
    }, '宠物复活了！🎉');
  } catch (e) { fail(res, e.message); }
});

// 成就列表
router.get('/achievements', async (req, res) => {
  try {
    const pet = await Pet.findOne({ where: { user_id: req.user.id } });
    if (!pet) return fail(res, '你还没有宠物');

    const list = await achievementEngine.getPetAchievements(pet.id);
    success(res, list);
  } catch (e) { fail(res, e.message); }
});

// 墓碑
router.get('/tombstone', async (req, res) => {
  try {
    const pet = await Pet.findOne({ where: { user_id: req.user.id } });
    if (!pet) return fail(res, '你还没有宠物');

    success(res, {
      pet_name: pet.name,
      species: pet.species,
      died_at: pet.died_at,
      death_cause: pet.death_cause,
      revive_count: pet.revive_count || 0,
      is_dead: pet.stage === 'dead'
    });
  } catch (e) { fail(res, e.message); }
});

// 宠物日记
router.get('/diaries', async (req, res) => {
  try {
    const pet = await Pet.findOne({ where: { user_id: req.user.id } });
    if (!pet) return fail(res, '你还没有宠物');

    const list = await getPetDiaries(pet.id, 10);
    success(res, list);
  } catch (e) { fail(res, e.message); }
});

// 生成本周日记
router.post('/diaries/generate', async (req, res) => {
  try {
    const pet = await Pet.findOne({ where: { user_id: req.user.id } });
    if (!pet) return fail(res, '你还没有宠物');

    const diary = await generateWeeklyDiary(pet.id);
    success(res, diary, '日记生成成功');
  } catch (e) { fail(res, e.message); }
});

module.exports = router;
