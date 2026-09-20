const router = require('express').Router();
const { Op } = require('sequelize');
const { Pet, PetItem, PetInventory, PetCoinLog, PetAction } = require('../models');
const { success, fail } = require('../utils/response');
const auth = require('../middlewares/auth');

router.use(auth);

async function getPet(userId) {
  const pet = await Pet.findOne({ where: { user_id: userId } });
  if (!pet) throw new Error('你还没有宠物');
  return pet;
}

// ========== 商店物品列表 ==========
router.get('/items', async (req, res) => {
  try {
    const pet = await getPet(req.user.id);
    const { type } = req.query;
    const where = { unlock_level: { [Op.lte]: pet.level } };
    if (type) where.type = type;

    const items = await PetItem.findAll({
      where,
      order: [['type', 'ASC'], ['price', 'ASC']]
    });

    const inventory = await PetInventory.findAll({ where: { pet_id: pet.id } });
    const owned = {};
    inventory.forEach(i => { owned[i.item_id] = i.count; });

    const data = items.map(item => ({ ...item.toJSON(), owned: owned[item.id] || 0 }));
    success(res, { items: data, coins: pet.coins });
  } catch (e) { fail(res, e.message); }
});

// ========== 购买物品 ==========
router.post('/buy', async (req, res) => {
  try {
    const { itemId, count = 1 } = req.body;
    if (!itemId || count < 1) return fail(res, '参数错误');

    const pet = await getPet(req.user.id);
    const item = await PetItem.findByPk(itemId);
    if (!item) return fail(res, '物品不存在');

    const totalCost = item.price * count;
    if (pet.coins < totalCost) {
      return fail(res, `金币不足（需要 ${totalCost}，你有 ${pet.coins}）`);
    }

    const newCoins = pet.coins - totalCost;
    await pet.update({ coins: newCoins });

    const [inv, created] = await PetInventory.findOrCreate({
      where: { pet_id: pet.id, item_id: item.id },
      defaults: { count }
    });
    if (!created) await inv.update({ count: inv.count + count });

    await PetCoinLog.create({
      pet_id: pet.id, amount: -totalCost, reason: 'buy', balance: newCoins
    });

    success(res, { coins: newCoins, owned: inv.count }, `购买 ${item.name} × ${count}`);
  } catch (e) { fail(res, e.message); }
});

// ========== 背包 ==========
router.get('/inventory', async (req, res) => {
  try {
    const pet = await getPet(req.user.id);
    const inventory = await PetInventory.findAll({
      where: { pet_id: pet.id },
      include: [{ model: PetItem, as: 'item' }],
      order: [['created_at', 'DESC']]
    });
    const data = inventory
      .filter(i => i.item && i.count > 0)
      .map(i => ({ id: i.id, count: i.count, item: i.item.toJSON() }));
    success(res, { list: data, coins: pet.coins });
  } catch (e) { fail(res, e.message); }
});

// ========== 使用物品 ==========
router.post('/use', async (req, res) => {
  try {
    const { inventoryId } = req.body;
    if (!inventoryId) return fail(res, '参数错误');

    const pet = await getPet(req.user.id);
    const inv = await PetInventory.findOne({
      where: { id: inventoryId, pet_id: pet.id },
      include: [{ model: PetItem, as: 'item' }]
    });
    if (!inv || inv.count <= 0) return fail(res, '物品不存在');
    if (pet.stage === 'dead') return fail(res, '宠物已经离开了...');
    if (pet.stage === 'sick') return fail(res, '宠物生病了，请先治疗');

    const engine = require('../services/petEngine');
    const { pet: currentPet } = await engine.syncPet(pet);

    const effect = inv.item.effect;
    const newValues = {};
    for (const [key, delta] of Object.entries(effect)) {
      if (['hunger', 'mood', 'clean', 'energy'].includes(key)) {
        newValues[key] = Math.max(0, Math.min(100, +currentPet[key] + delta));
      }
    }

    await Pet.update(
      { ...newValues, exp: currentPet.exp + 10, last_update: Date.now() },
      { where: { id: pet.id } }
    );

    if (inv.count > 1) await inv.update({ count: inv.count - 1 });
    else await inv.destroy();

    await PetAction.create({
      pet_id: pet.id,
      action: inv.item.type === 'food' ? 'feed' : inv.item.type === 'toy' ? 'play' : 'clean',
      effect, coins_cost: 0
    });

    success(res, {
      item: inv.item.toJSON(),
      effect,
      expGain: 10,
      pet: (await Pet.findByPk(pet.id)).toJSON()
    }, `使用 ${inv.item.name} 成功`);
  } catch (e) { fail(res, e.message); }
});

// ========== 每日签到 ==========
router.post('/signin', async (req, res) => {
  try {
    const pet = await getPet(req.user.id);
    const today = new Date().toISOString().slice(0, 10);
    if (pet.last_login_date === today) return fail(res, '今天已经签到过了');

    const logs = await PetCoinLog.findAll({
      where: { pet_id: pet.id, reason: 'signin' },
      order: [['created_at', 'DESC']],
      limit: 30
    });
    const signedDays = new Set(logs.map(log => new Date(log.created_at).toISOString().slice(0, 10)));
    let streak = 1;
    const cursor = new Date(`${today}T00:00:00Z`);
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    while (signedDays.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    const REWARD = 50 + Math.min(streak - 1, 6) * 10;
    const newCoins = pet.coins + REWARD;
    await pet.update({ coins: newCoins, last_login_date: today });
    await PetCoinLog.create({
      pet_id: pet.id, amount: REWARD, reason: 'signin', balance: newCoins
    });

    success(res, { coins: newCoins, reward: REWARD, streak }, `连续签到 ${streak} 天！+${REWARD} 金币`);
  } catch (e) { fail(res, e.message); }
});

// ========== 金币记录 ==========
router.get('/coin-log', async (req, res) => {
  try {
    const pet = await getPet(req.user.id);
    const logs = await PetCoinLog.findAll({
      where: { pet_id: pet.id },
      order: [['created_at', 'DESC']],
      limit: 30
    });
    success(res, logs);
  } catch (e) { fail(res, e.message); }
});

module.exports = router;
