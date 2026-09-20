const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PetChat = sequelize.define('PetChat', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  pet_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  role: { type: DataTypes.STRING(20), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'pet_chat', timestamps: false });

module.exports = PetChat;
