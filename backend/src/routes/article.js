const router = require('express').Router();
const { Op } = require('sequelize');
const { Article, Tag, User, ArticleTag, sequelize } = require('../models');
const { success, fail } = require('../utils/response');
const auth = require('../middlewares/auth');
const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');

// 初始化 Markdown 渲染器
const md = new MarkdownIt({
  html: false,        // ⭐ 禁止原始 HTML（防 XSS）
  linkify: true,
  breaks: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
      } catch (e) {}
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  }
});

// ========== 文章列表（分页 + 搜索 + 标签筛选）==========
router.get('/', async (req, res) => {
  try {
    const { page = 1, size = 10, keyword, category, tag, status } = req.query;

    const where = { deleted_at: null };
    if (status !== undefined && status !== '') where.status = +status;
    if (category) where.category = category;
    if (keyword) where.title = { [Op.like]: `%${keyword}%` };

    // 标签筛选需要 include
    const include = [
      { model: User, as: 'user', attributes: ['id', 'username'] },
      { model: Tag, as: 'tags', attributes: ['id', 'name'], through: { attributes: [] } }
    ];

    // 按标签筛选
    if (tag) {
      include[1].where = { name: tag };
      include[1].required = true;
    }

    const { count, rows } = await Article.findAndCountAll({
      where,
      // ⭐ 列表页不返回 content 和 html（大字段，性能关键）
      attributes: { exclude: ['content', 'html'] },
      include,
      order: [['created_at', 'DESC']],
      limit: +size,
      offset: (+page - 1) * +size,
      distinct: true
    });

    success(res, { list: rows, total: count, page: +page, size: +size });
  } catch (e) {
    fail(res, e.message);
  }
});

// ========== 文章详情 ==========
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findOne({
      where: { id: req.params.id, deleted_at: null },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });
    if (!article) return fail(res, '文章不存在');

    // 阅读量 +1（异步，不阻塞返回）
    Article.increment('view_count', { where: { id: article.id } }).catch(() => {});

    success(res, article);
  } catch (e) {
    fail(res, e.message);
  }
});

// ========== 新增文章 ==========
router.post('/', auth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { title, content, category, status = 0, tags = [] } = req.body;
    if (!title?.trim() || !content?.trim()) {
      await t.rollback();
      return fail(res, '标题和内容不能为空');
    }

    // 渲染 Markdown
    const html = md.render(content);
    const summary = content.replace(/[#*`>\-\[\]()]/g, '').slice(0, 100);

    const article = await Article.create({
      user_id: req.user.id,
      title: title.trim(),
      content,
      html,
      summary,
      category,
      status
    }, { transaction: t });

    // 处理标签（多对多）
    if (tags.length) {
      const tagRecords = await Promise.all(
        tags.map(name =>
          Tag.findOrCreate({ where: { name: name.trim() }, transaction: t })
        )
      );
      await article.setTags(tagRecords.map(([tag]) => tag), { transaction: t });
    }

    await t.commit();
    success(res, article, '发布成功');
  } catch (e) {
    await t.rollback();
    fail(res, e.message);
  }
});

// ========== 更新文章 ==========
router.put('/:id', auth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const article = await Article.findOne({
      where: { id: req.params.id, user_id: req.user.id, deleted_at: null },
      transaction: t
    });
    if (!article) {
      await t.rollback();
      return fail(res, '文章不存在');
    }

    const { title, content, category, status, tags } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;

    if (content !== undefined) {
      updateData.content = content;
      updateData.html = md.render(content);
      updateData.summary = content.replace(/[#*`>\-\[\]()]/g, '').slice(0, 100);
    }

    await article.update(updateData, { transaction: t });

    // 更新标签
    if (Array.isArray(tags)) {
      const tagRecords = await Promise.all(
        tags.map(name =>
          Tag.findOrCreate({ where: { name: name.trim() }, transaction: t })
        )
      );
      await article.setTags(tagRecords.map(([tag]) => tag), { transaction: t });
    }

    await t.commit();
    success(res, article, '更新成功');
  } catch (e) {
    await t.rollback();
    fail(res, e.message);
  }
});

// ========== 删除（软删除）==========
router.delete('/:id', auth, async (req, res) => {
  try {
    const article = await Article.findOne({
      where: { id: req.params.id, user_id: req.user.id, deleted_at: null }
    });
    if (!article) return fail(res, '文章不存在');
    await article.update({ deleted_at: new Date() });
    success(res, null, '删除成功');
  } catch (e) {
    fail(res, e.message);
  }
});

// ========== 标签列表（用于筛选）==========
router.get('/meta/tags', async (req, res) => {
  try {
    const tags = await Tag.findAll({ attributes: ['id', 'name'] });
    success(res, tags);
  } catch (e) {
    fail(res, e.message);
  }
});

module.exports = router;
