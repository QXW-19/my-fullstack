const router = require('express').Router();
const { Op, fn, col, literal } = require('sequelize');
const { Pet, User, PetVisit } = require('../models');
const { success, fail } = require('../utils/response');
const auth = require('../middlewares/auth');
const { createNotification } = require('../services/notification');

router.use(auth);

const SPECIES = {
  cat:    { name: '猫',   emoji: '🐱' },
  dog:    { name: '狗',   emoji: '🐶' },
  dragon: { name: '龙',   emoji: '🐉' },
  rabbit: { name: '兔',   emoji: '🐰' },
  panda:  { name: '熊猫', emoji: '🐼' }
};

// ========== 好友列表 ==========
router.get('/list', async (req, res) => {
  try {
    const users = await User.findAll({
      where: { id: { [Op.ne]: req.user.id } },
      attributes: ['id', 'username', 'avatar'],
      limit: 50
    });

    const userIds = users.map(u => u.id);
    const pets = userIds.length ? await Pet.findAll({
      where: { user_id: { [Op.in]: userIds } },
      // ⭐ 明确指定 Pet. 前缀避免歧义
      attributes: ['id', 'user_id', 'name', 'species', 'stage', 'level', 'hunger', 'mood', 'clean', 'energy']
    }) : [];

    const petMap = {};
    pets.forEach(p => { petMap[p.user_id] = p; });

    const data = users.map(u => {
      const p = petMap[u.id];
      return {
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        hasPet: !!p,
        pet: p ? {
          id: p.id,
          name: p.name,
          species: p.species,
          stage: p.stage,
          level: p.level,
          emoji: SPECIES[p.species]?.emoji || '🐱',
          health: Math.round((+p.hunger + +p.mood + +p.clean + +p.energy) / 4)
        } : null
      };
    });

    data.sort((a, b) => (b.hasPet ? 1 : 0) - (a.hasPet ? 1 : 0));
    success(res, data);
  } catch (e) {
    console.error('friend list error:', e);
    fail(res, e.message);
  }
});

// ========== 好友宠物详情 ==========
router.get('/:petId', async (req, res) => {
  try {
    const pet = await Pet.findByPk(req.params.petId, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'username', 'avatar'] }]
    });
    if (!pet) return fail(res, '宠物不存在');
    if (pet.user_id === req.user.id) return fail(res, '这是你自己的宠物');

    await PetVisit.create({
      visitor_id: req.user.id,
      pet_id: pet.id,
      action: 'visit'
    });

    // ⭐ 明确 PetVisit.id
    const recentVisits = await PetVisit.findAll({
      where: { pet_id: pet.id },
      attributes: ['id', 'visitor_id', 'action', 'message', 'created_at'],
      include: [{ model: User, as: 'visitor', attributes: ['id', 'username', 'avatar'] }],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    success(res, {
      pet: {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        stage: pet.stage,
        level: pet.level,
        hunger: +pet.hunger,
        mood: +pet.mood,
        clean: +pet.clean,
        energy: +pet.energy,
        emoji: SPECIES[pet.species]?.emoji || '🐱',
        health: Math.round((+pet.hunger + +pet.mood + +pet.clean + +pet.energy) / 4)
      },
      owner: pet.owner,  // ⭐ 用 owner 别名
      recentVisits
    });
  } catch (e) {
    console.error('friend detail error:', e);
    fail(res, e.message);
  }
});

// ========== 帮好友宠物做事 ==========
router.post('/:petId/help', async (req, res) => {
  try {
    const { action, message } = req.body;
    if (!['feed', 'play', 'clean'].includes(action)) {
      return fail(res, '未知行为');
    }

    const pet = await Pet.findByPk(req.params.petId);
    if (!pet) return fail(res, '宠物不存在');
    if (pet.user_id === req.user.id) return fail(res, '不能帮自己');

    const EFFECTS = {
      feed:  { hunger: 15, mood: 5,  label: '喂了食' },
      play:  { mood: 15, energy: -3, label: '陪玩' },
      clean: { clean: 15, mood: 3,   label: '洗了澡' }
    };
    const eff = EFFECTS[action];

    const updates = {};
    ['hunger', 'mood', 'clean', 'energy'].forEach(k => {
      if (eff[k] !== undefined) {
        updates[k] = Math.max(0, Math.min(100, +pet[k] + eff[k]));
      }
    });

    await pet.update(updates);

    await PetVisit.create({
      visitor_id: req.user.id,
      pet_id: pet.id,
      action,
      message: message?.slice(0, 200)
    });

    // 查访问者信息
    const visitor = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'avatar']
    });

    // 查宠物主人信息（含邮箱）
    const owner = await User.findByPk(pet.user_id, {
      attributes: ['id', 'username', 'email', 'email_notify']
    });

    // 1. 站内通知
    createNotification({
      userId: pet.user_id,
      fromUserId: req.user.id,
      type: 'system',
      title: `${visitor?.username} ${eff.label}你的宠物`,
      content: message || `你的宠物 ${pet.name} 获得了帮助`,
      link: '/pet'
    }).catch(() => {});

    // 2. ⭐ 邮件通知
    if (owner?.email && owner.email_notify === 1) {
      const mailer = require('../services/mailer');
      mailer.sendFriendHelpNotification({
        to: owner.email,
        toName: owner.username,
        fromName: visitor?.username || '有人',
        petName: pet.name,
        action: eff.label,
        message: message || '',
        link: 'http://101.37.234.235:8080/pet'
      }).catch(e => {
        console.error('发送好友帮助邮件失败:', e.message);
      });
    }

    success(res, { action: eff.label }, '帮助成功！');
  } catch (e) {
    console.error('help error:', e);
    fail(res, e.message);
  }
});

// ========== 留言 ==========
router.post('/:petId/message', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return fail(res, '留言不能为空');
    if (message.length > 200) return fail(res, '留言太长');

    const pet = await Pet.findByPk(req.params.petId);
    if (!pet) return fail(res, '宠物不存在');

    await PetVisit.create({
      visitor_id: req.user.id,
      pet_id: pet.id,
      action: 'message',
      message: message.trim()
    });

    if (pet.user_id !== req.user.id) {
      const visitor = await User.findByPk(req.user.id, { attributes: ['username'] });
      createNotification({
        userId: pet.user_id,
        fromUserId: req.user.id,
        type: 'system',
        title: `${visitor?.username} 给你的宠物留言`,
        content: message.slice(0, 50),
        link: '/pet'
      }).catch(() => {});
    }

    success(res, null, '留言成功');
  } catch (e) {
    console.error('message error:', e);
    fail(res, e.message);
  }
});

// ========== 我宠物的访客 ==========
router.get('/my/visitors', async (req, res) => {
  try {
    const myPet = await Pet.findOne({ where: { user_id: req.user.id } });
    if (!myPet) return fail(res, '你还没有宠物');

    const visits = await PetVisit.findAll({
      where: { pet_id: myPet.id },
      attributes: ['id', 'visitor_id', 'action', 'message', 'created_at'],
      include: [{ model: User, as: 'visitor', attributes: ['id', 'username', 'avatar'] }],
      order: [['created_at', 'DESC']],
      limit: 50
    });

    success(res, visits);
  } catch (e) {
    console.error('visitors error:', e);
    fail(res, e.message);
  }
});

// ========== 互访排行榜 ==========
router.get('/rank/helpers', async (req, res) => {
  try {
    const rank = await PetVisit.findAll({
      attributes: [
        'visitor_id',
        [fn('COUNT', col('PetVisit.id')), 'helpCount']
      ],
      where: { action: { [Op.in]: ['feed', 'play', 'clean'] } },
      include: [{ model: User, as: 'visitor', attributes: ['id', 'username', 'avatar'] }],
      group: ['visitor_id', 'visitor.id'],
      order: [[literal('helpCount'), 'DESC']],
      limit: 10,
      raw: false
    });

    const data = rank.map(r => ({
      id: r.visitor?.id,
      username: r.visitor?.username,
      avatar: r.visitor?.avatar,
      helpCount: +r.get('helpCount')
    }));

    success(res, data);
  } catch (e) {
    console.error('rank error:', e);
    fail(res, e.message);
  }
});

module.exports = router;
