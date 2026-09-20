const router = require('express').Router();
const { Pet, PetDecoration, PetOwnedDecoration, PetCoinLog } = require('../models');
const { success, fail } = require('../utils/response');
const auth = require('../middlewares/auth');

router.use(auth);

async function getPet(userId) {
  const pet = await Pet.findOne({ where: { user_id: userId } });
  if (!pet) throw new Error('你还没有宠物');
  return pet;
}

// ========== 装扮商店列表 ==========
router.get('/list', async (req, res) => {
  try {
    const pet = await getPet(req.user.id);
    const list = await PetDecoration.findAll({ order: [['sort', 'ASC']] });

    // 查已拥有的
    const owned = await PetOwnedDecoration.findAll({ where: { pet_id: pet.id } });
    const ownedMap = {};
    owned.forEach(o => { ownedMap[o.decoration_id] = o; });

    const equipped = pet.equipped || {};

    const data = list.map(d => {
      const o = ownedMap[d.id];
      return {
        id: d.id,
        name: d.name,
        icon: d.icon,
        type: d.type,
        price: d.price,
        rarity: d.rarity,
        owned: !!o,
        equipped: o ? +o.equipped === 1 : false,
        ownedId: o?.id
      };
    });

    success(res, { list: data, coins: pet.coins, equipped });
  } catch (e) { fail(res, e.message); }
});

// ========== 购买装扮 ==========
router.post('/buy', async (req, res) => {
  try {
    const { decorationId } = req.body;
    if (!decorationId) return fail(res, '参数错误');

    const pet = await getPet(req.user.id);
    const dec = await PetDecoration.findByPk(decorationId);
    if (!dec) return fail(res, '装扮不存在');

    // 已拥有？
    const exist = await PetOwnedDecoration.findOne({
      where: { pet_id: pet.id, decoration_id: dec.id }
    });
    if (exist) return fail(res, '已经拥有这个装扮');

    // 金币够吗？
    if (pet.coins < dec.price) {
      return fail(res, `金币不足（需要 ${dec.price}，你有 ${pet.coins}）`);
    }

    // 扣金币
    const newCoins = pet.coins - dec.price;
    await pet.update({ coins: newCoins });

    // 加入拥有列表
    const owned = await PetOwnedDecoration.create({
      pet_id: pet.id,
      decoration_id: dec.id,
      equipped: 0
    });

    // 日志
    await PetCoinLog.create({
      pet_id: pet.id,
      amount: -dec.price,
      reason: 'decoration',
      balance: newCoins
    });

    success(res, { coins: newCoins, ownedId: owned.id }, `购买 ${dec.name} 成功`);
  } catch (e) { fail(res, e.message); }
});

// ========== 装备/卸下 ==========
router.post('/toggle', async (req, res) => {
  try {
    const { ownedId } = req.body;
    if (!ownedId) return fail(res, '参数错误');

    const pet = await getPet(req.user.id);
    const owned = await PetOwnedDecoration.findOne({
      where: { id: ownedId, pet_id: pet.id },
      include: [{ model: PetDecoration, as: 'decoration' }]
    });
    if (!owned || !owned.decoration) return fail(res, '装扮不存在');

    const type = owned.decoration.type;      // hat / glasses / bg
    const nowEquipped = +owned.equipped === 1;

    // 当前 equipped 字段
    const equipped = { ...(pet.equipped || {}) };

    if (nowEquipped) {
      // 卸下
      await owned.update({ equipped: 0 });
      delete equipped[type];
      await pet.update({ equipped });
      success(res, { action: 'unequip', equipped }, '已卸下');
    } else {
      // 先卸下同类型的其他装扮
      const sameTypeOwned = await PetOwnedDecoration.findAll({
        where: { pet_id: pet.id, equipped: 1 },
        include: [{ model: PetDecoration, as: 'decoration' }]
      });

      for (const o of sameTypeOwned) {
        if (o.decoration?.type === type) {
          await o.update({ equipped: 0 });
        }
      }

      // 装备新的
      await owned.update({ equipped: 1 });
      equipped[type] = owned.decoration_id;
      await pet.update({ equipped });
      success(res, { action: 'equip', equipped, icon: owned.decoration.icon }, `已装备 ${owned.decoration.name}`);
    }
  } catch (e) { fail(res, e.message); }
});

// ========== 我的装扮（背包）==========
router.get('/my', async (req, res) => {
  try {
    const pet = await getPet(req.user.id);

    const owned = await PetOwnedDecoration.findAll({
      where: { pet_id: pet.id },
      include: [{ model: PetDecoration, as: 'decoration' }],
      order: [['created_at', 'DESC']]
    });

    const data = owned.map(o => ({
      id: o.id,
      equipped: +o.equipped === 1,
      decoration: o.decoration
    }));

    success(res, { list: data, coins: pet.coins, equipped: pet.equipped || {} });
  } catch (e) { fail(res, e.message); }
});

module.exports = router;
