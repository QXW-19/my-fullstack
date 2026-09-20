const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PetCoinLog = sequelize.define('PetCoinLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  pet_id: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.INTEGER, allowNull: false },     // 正数=收入，负数=支出
  reason: { type: DataTypes.STRING(50), allowNull: false },  // signin/buy/revive
  balance: { type: DataTypes.INTEGER },                       // 变动后余额
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'pet_coin_log', timestamps: false });

module.exports = PetCoinLog;
