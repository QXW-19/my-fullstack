const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },         // 接收者
  from_user_id: { type: DataTypes.INTEGER },                       // 触发者
  type: { type: DataTypes.STRING(30), allowNull: false },         // message_reply / blog_comment / chat_message / system
  title: { type: DataTypes.STRING(200) },
  content: { type: DataTypes.STRING(500) },
  link: { type: DataTypes.STRING(255) },                           // 点击跳转路径
  is_read: { type: DataTypes.TINYINT, defaultValue: 0 }
}, { tableName: 'notification' });

module.exports = Notification;
