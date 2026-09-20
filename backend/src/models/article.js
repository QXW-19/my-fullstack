const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Article = sequelize.define('Article', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.TEXT('long'), allowNull: false },   // Markdown 原文
  html: { type: DataTypes.TEXT('long') },                        // 渲染后 HTML
  summary: { type: DataTypes.STRING(500) },                      // 摘要
  cover: { type: DataTypes.STRING(255) },                        // 封面图
  category: { type: DataTypes.STRING(50) },                      // 分类（简单字符串）
  status: { type: DataTypes.TINYINT, defaultValue: 0 },          // 0草稿 1发布
  view_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  deleted_at: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'article' });

module.exports = Article;
