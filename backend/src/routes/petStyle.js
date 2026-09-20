const router = require('express').Router();
const { Pet } = require('../models');
const { success, fail } = require('../utils/response');
const auth = require('../middlewares/auth');
const { TONES } = require('../config/petTones');
const { SKINS } = require('../config/petSkins');

router.use(auth);

// 获取所有语气
router.get('/tones', async (req, res) => {
  try {
    const list = Object.entries(TONES).map(([id, t]) => ({
      id,
      name: t.name,
      emoji: t.emoji,
      desc: t.desc
    }));
    success(res, list);
  } catch (e) { fail(res, e.message); }
});

// 获取我的宠物皮肤列表
router.get('/skins', async (req, res) => {
  try {
    const pet = await Pet.findOne({ where: { user_id: req.user.id } });
    if (!pet) return fail(res, '你还没有宠物');

    const skins = SKINS[pet.species] || [];
    const data = skins.map(s => ({
      ...s,
      owned: s.price === 0 || true, // 简化：全部可换（也可改成金币购买）
      equipped: s.id === pet.skin
    }));

    success(res, {
      list: data,
      current: pet.skin || 'default'
    });
  } catch (e) { fail(res, e.message); }
});

// 切换语气
router.put('/tone', async (req, res) => {
  try {
    const { tone } = req.body;
    if (!TONES[tone]) return fail(res, '未知语气');

    const pet = await Pet.findOne({ where: { user_id: req.user.id } });
    if (!pet) return fail(res, '你还没有宠物');

    await pet.update({ tone });
    success(res, { tone }, '语气已切换');
  } catch (e) { fail(res, e.message); }
});

// 切换皮肤（花金币）
router.put('/skin', async (req, res) => {
  try {
    const { skin } = req.body;

    const pet = await Pet.findOne({ where: { user_id: req.user.id } });
    if (!pet) return fail(res, '你还没有宠物');

    const skins = SKINS[pet.species] || [];
    const target = skins.find(s => s.id === skin);
    if (!target) return fail(res, '皮肤不存在');

    if (pet.coins < target.price) {
      return fail(res, `需要 ${target.price} 金币，你只有 ${pet.coins}`);
    }

    const newCoins = pet.coins - target.price;
    await pet.update({ skin, coins: newCoins });

    success(res, { skin, coins: newCoins, emoji: target.emoji }, '换肤成功');
  } catch (e) { fail(res, e.message); }
});

module.exports = router;
