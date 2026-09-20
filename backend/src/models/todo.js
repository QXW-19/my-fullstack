const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Todo = sequelize.define('Todo', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  status: { type: DataTypes.TINYINT, defaultValue: 0 },       // 0未完成 1已完成
  priority: { type: DataTypes.TINYINT, defaultValue: 1 },     // 0低 1中 2高
  category: { type: DataTypes.STRING(50), defaultValue: '' },
  due_date: { type: DataTypes.DATE },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  deleted_at: { type: DataTypes.DATE, allowNull: true }       // 软删除
}, { tableName: 'todo' });

module.exports = Todo;
