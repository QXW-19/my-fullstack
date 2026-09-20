const router = require('express').Router();
const { Op } = require('sequelize');
const { Todo } = require('../models');
const { success, fail } = require('../utils/response');
const auth = require('../middlewares/auth');

// 全部需要登录
router.use(auth);

// ========== 列表（动态筛选）==========
router.get('/', async (req, res) => {
  try {
    const { status, category, keyword, priority } = req.query;

    const where = {
      user_id: req.user.id,
      deleted_at: null
    };

    // 动态筛选
    if (status !== undefined && status !== '') where.status = +status;
    if (category) where.category = category;
    if (priority !== undefined && priority !== '') where.priority = +priority;
    if (keyword) where.title = { [Op.like]: `%${keyword}%` };

    const list = await Todo.findAll({
      where,
      order: [['sort_order', 'DESC'], ['created_at', 'DESC']]
    });

    success(res, list);
  } catch (e) {
    fail(res, e.message);
  }
});

// ========== 详情 ==========
router.get('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOne({
      where: { id: req.params.id, user_id: req.user.id, deleted_at: null }
    });
    if (!todo) return fail(res, '待办不存在');
    success(res, todo);
  } catch (e) {
    fail(res, e.message);
  }
});

// ========== 新增 ==========
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, category, due_date } = req.body;
    if (!title?.trim()) return fail(res, '标题不能为空');

    const todo = await Todo.create({
      user_id: req.user.id,
      title: title.trim(),
      description,
      priority: priority ?? 1,
      category,
      due_date
    });
    success(res, todo, '创建成功');
  } catch (e) {
    fail(res, e.message);
  }
});

// ========== 更新（RESTful PUT）==========
router.put('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOne({
      where: { id: req.params.id, user_id: req.user.id, deleted_at: null }
    });
    if (!todo) return fail(res, '待办不存在');

    const { title, description, priority, category, due_date } = req.body;
    await todo.update({ title, description, priority, category, due_date });
    success(res, todo, '更新成功');
  } catch (e) {
    fail(res, e.message);
  }
});

// ========== 只改状态（PATCH 优雅）==========
router.patch('/:id/status', async (req, res) => {
  try {
    const todo = await Todo.findOne({
      where: { id: req.params.id, user_id: req.user.id, deleted_at: null }
    });
    if (!todo) return fail(res, '待办不存在');

    const { status } = req.body;
    if (![0, 1].includes(status)) return fail(res, '状态值无效');

    await todo.update({ status });
    success(res, todo, status === 1 ? '已完成' : '已恢复');
  } catch (e) {
    fail(res, e.message);
  }
});

// ========== 拖拽排序（批量）==========
router.put('/sort/batch', async (req, res) => {
  try {
    const { items } = req.body;   // [{id, sort_order}, ...]
    if (!Array.isArray(items)) return fail(res, '参数错误');

    // 批量更新
    await Promise.all(
      items.map(item =>
        Todo.update(
          { sort_order: item.sort_order },
          { where: { id: item.id, user_id: req.user.id } }
        )
      )
    );
    success(res, null, '排序已保存');
  } catch (e) {
    fail(res, e.message);
  }
});

// ========== 删除（软删除）==========
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOne({
      where: { id: req.params.id, user_id: req.user.id, deleted_at: null }
    });
    if (!todo) return fail(res, '待办不存在');

    await todo.update({ deleted_at: new Date() });
    success(res, null, '删除成功');
  } catch (e) {
    fail(res, e.message);
  }
});

module.exports = router;
