const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  password: { type: DataTypes.STRING(100), allowNull: false },
  avatar: { type: DataTypes.STRING(255), defaultValue: '' },
  email: { type: DataTypes.STRING(100), allowNull: true },
  email_notify: { type: DataTypes.TINYINT, defaultValue: 1 }
}, { tableName: 'user' });

module.exports = User;
