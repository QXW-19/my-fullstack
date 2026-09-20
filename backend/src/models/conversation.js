const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Conversation = sequelize.define('Conversation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user1_id: { type: DataTypes.INTEGER, allowNull: false },   // 较小的 user_id
  user2_id: { type: DataTypes.INTEGER, allowNull: false },   // 较大的 user_id
  last_message: { type: DataTypes.STRING(500) },
  last_time: { type: DataTypes.DATE }
}, { tableName: 'conversation' });

module.exports = Conversation;
