const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MessageLike = sequelize.define('MessageLike', {
  message_id: { type: DataTypes.INTEGER, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, primaryKey: true }
}, { tableName: 'message_like', timestamps: false });

module.exports = MessageLike;
