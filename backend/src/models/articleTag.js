const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ArticleTag = sequelize.define('ArticleTag', {
  article_id: { type: DataTypes.INTEGER, primaryKey: true },
  tag_id: { type: DataTypes.INTEGER, primaryKey: true }
}, { tableName: 'article_tag', timestamps: false });

module.exports = ArticleTag;
