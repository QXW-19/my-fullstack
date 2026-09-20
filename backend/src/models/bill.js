const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Bill = sequelize.define('Bill', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.TINYINT, allowNull: false },            // 0支出 1收入
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },    // ⭐ DECIMAL 防止精度丢失
  category_id: { type: DataTypes.INTEGER, allowNull: false },
  remark: { type: DataTypes.STRING(255) },
  bill_date: { type: DataTypes.DATEONLY, allowNull: false },       // ⭐ DATE 类型，避免时区问题
  deleted_at: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'bill' });

module.exports = Bill;
