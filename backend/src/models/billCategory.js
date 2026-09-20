const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BillCategory = sequelize.define('BillCategory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(50), allowNull: false },
  icon: { type: DataTypes.STRING(50), defaultValue: '💰' },
  type: { type: DataTypes.TINYINT, allowNull: false }              // 0支出 1收入
}, { tableName: 'bill_category' });

module.exports = BillCategory;
