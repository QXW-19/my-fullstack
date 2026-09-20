const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ChatMessage = sequelize.define('ChatMessage', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  conversation_id: { type: DataTypes.INTEGER, allowNull: false },
  from_id: { type: DataTypes.INTEGER, allowNull: false },
  to_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.TINYINT, defaultValue: 0 },       // ⭐ 0文本 1图片
  content: { type: DataTypes.TEXT },                         // 文本或图片 URL
  is_read: { type: DataTypes.TINYINT, defaultValue: 0 },
  status: { type: DataTypes.TINYINT, defaultValue: 0 }       // ⭐ 0正常 1已撤回
}, { tableName: 'chat_message' });

module.exports = ChatMessage;
