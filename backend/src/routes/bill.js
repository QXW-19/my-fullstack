const router = require('express').Router();
const { Op, fn, col, literal } = require('sequelize');
const { Bill, BillCategory } = require('../models');
const { success, fail } = require('../utils/response');
const auth = require('../middlewares/auth');

router.use(auth);

// ========== 账单列表（按月份筛选 + 分页）==========
router.get('/', async (req, res) => {
  try {
    const { month, page = 1, size = 20 } = req.query;   // month 格式：2026-09

    const where = { user_id: req.user.id, deleted_at: null };

    if (month) {
      // ⭐ 用 DATE_FORMAT 匹配年月
      where[Op.and] = [
        literal(`DATE_FORMAT(bill_date, '%Y-%m') = '${month}'`)
      ];
    }

    const { count, rows } = await Bill.findAndCountAll({
      where,
      include: [{ model: BillCategory, as: 'category', attributes: ['id', 'name', 'icon'] }],
      order: [['bill_date', 'DESC'], ['id', 'DESC']],
      limit: +size,
      offset: (+page - 1) * +size,
      distinct: true
    });

    success(res, { list: rows, total: count, page: +page, size: +size });
  } catch (e) {
    fail(res, e.message);
  }
});

// ========== 月度总览（收入 / 支出 / 结余）==========
router.get('/stats/overview', async (req, res) => {
  try {
    const { month } = req.query;   // 2026-09

    const where = { user_id: req.user.id, deleted_at: null };
    if (month) {
      where[Op.and] = [literal(`DATE_FORMAT(bill_date, '%Y-%m') = '${month}'`)];
    }

    // ⭐ 按 type 分组聚合
    const result = await Bill.findAll({
      attributes: [
        'type',
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('id')), 'count']
      ],
      where,
      group: ['type'],
      raw: true
    });

    const overview = { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 };
    result.forEach(r => {
      if (r.type === 1) {
        overview.income = +r.total;
        overview.incomeCount = +r.count;
      } else {
        overview.expense = +r.total;
        overview.expenseCount = +r.count;
      }
    });
    overview.balance = overview.income - overview.expense;

    success(res, overview);
  } catch (e) {
    fail(res, e.message);
  }
});

// ========== 分类占比（饼图数据）==========
router.get('/stats/category', async (req, res) => {
  try {
    const { month, type = 0 } = req.query;   // type: 0支出 1收入

    const where = { user_id: req.user.id, deleted_at: null, type: +type };
    if (month) {
      where[Op.and] = [literal(`DATE_FORMAT(bill_date, '%Y-%m') = '${month}'`)];
    }

    // ⭐ 按 category_id 分组，聚合金额
    const result = await Bill.findAll({
      attributes: [
        'category_id',
        [fn('SUM', col('amount')), 'value']
      ],
      where,
      include: [{
        model: BillCategory,
        as: 'category',
        attributes: ['name', 'icon']
      }],
      group: ['category_id', 'category.id'],
      raw: false
    });

    const data = result.map(r => ({
      name: r.category?.name || '未知',
      icon: r.category?.icon || '💰',
      value: +r.get('value')
    }));

    success(res, data);
  } catch (e) {
    fail(res, e.message);
  }
});

// ========== 收支趋势（折线图：按月）==========
router.get('/stats/trend', async (req, res) => {
  try {
    const { months = 6 } = req.query;   // 最近 N 个月

    // ⭐ 按月份 + 类型 分组聚合
    const result = await Bill.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('bill_date'), '%Y-%m'), 'month'],
        'type',
        [fn('SUM', col('amount')), 'total']
      ],
      where: { user_id: req.user.id, deleted_at: null },
      group: ['month', 'type'],
      order: [[literal('month'), 'ASC']],
      raw: true,
      limit: 100
    });

    // 组装成 { months: [], income: [], expense: [] }
    const map = {};
    result.forEach(r => {
      if (!map[r.month]) map[r.month] = { month: r.month, income: 0, expense: 0 };
      if (r.type === 1) map[r.month].income = +r.total;
      else map[r.month].expense = +r.total;
    });

    const list = Object.values(map).slice(-months);
    success(res, {
      months: list.map(i => i.month),
      income: list.map(i => i.income),
      expense: list.map(i => i.expense)
    });
  } catch (e) {
    fail(res, e.message);
  }
});

// ========== 新增账单 ==========
router.post('/', async (req, res) => {
  try {
    const { type, amount, category_id, remark, bill_date } = req.body;
    if (![0, 1].includes(type)) return fail(res, '类型无效');
    if (!amount || amount <= 0) return fail(res, '金额必须大于 0');
    if (!category_id) return fail(res, '请选择分类');
    if (!bill_date) return fail(res, '请选择日期');

    const bill = await Bill.create({
      user_id: req.user.id,
      type,
      amount,
      category_id,
      remark,
      bill_date
    });
    success(res, bill, '记账成功');
  } catch (e) {
    fail(res, e.message);
  }
});

// ========== 更新账单 ==========
router.put('/:id', async (req, res) => {
  try {
    const bill = await Bill.findOne({
      where: { id: req.params.id, user_id: req.user.id, deleted_at: null }
    });
    if (!bill) return fail(res, '账单不存在');

    const { type, amount, category_id, remark, bill_date } = req.body;
    await bill.update({ type, amount, category_id, remark, bill_date });
    success(res, bill, '更新成功');
  } catch (e) {
    fail(res, e.message);
  }
});

// ========== 删除账单 ==========
router.delete('/:id', async (req, res) => {
  try {
    const bill = await Bill.findOne({
      where: { id: req.params.id, user_id: req.user.id, deleted_at: null }
    });
    if (!bill) return fail(res, '账单不存在');
    await bill.update({ deleted_at: new Date() });
    success(res, null, '删除成功');
  } catch (e) {
    fail(res, e.message);
  }
});

module.exports = router;
