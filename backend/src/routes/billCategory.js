const router = require('express').Router();
const { BillCategory, Bill } = require('../models');
const { success, fail } = require('../utils/response');
const auth = require('../middlewares/auth');

router.use(auth);

// 分类列表
router.get('/', async (req, res) => {
  try {
    const list = await BillCategory.findAll({
      where: { user_id: req.user.id },
      order: [['type', 'ASC'], ['id', 'ASC']]
    });
    success(res, list);
  } catch (e) {
    fail(res, e.message);
  }
});

// 新增分类
router.post('/', async (req, res) => {
  try {
    const { name, icon = '💰', type } = req.body;
    if (!name?.trim()) return fail(res, '分类名不能为空');
    if (![0, 1].includes(type)) return fail(res, '类型无效');

    const category = await BillCategory.create({
      user_id: req.user.id,
      name: name.trim(),
      icon,
      type
    });
    success(res, category, '创建成功');
  } catch (e) {
    fail(res, e.message);
  }
});

// 删除分类（如果有账单使用则拒绝）
router.delete('/:id', async (req, res) => {
  try {
    const category = await BillCategory.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!category) return fail(res, '分类不存在');

    const count = await Bill.count({
      where: { category_id: category.id, deleted_at: null }
    });
    if (count > 0) return fail(res, '该分类下有账单，无法删除');

    await category.destroy();
    success(res, null, '删除成功');
  } catch (e) {
    fail(res, e.message);
  }
});

module.exports = router;
