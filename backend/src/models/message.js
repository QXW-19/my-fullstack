const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Message = sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  parent_id: { type: DataTypes.INTEGER, defaultValue: 0 },
  content: { type: DataTypes.TEXT, allowNull: false },
  like_count: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'message' });

module.exports = Message;
