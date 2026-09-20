const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PetUserAchievement = sequelize.define('PetUserAchievement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  pet_id: { type: DataTypes.INTEGER, allowNull: false },
  achievement_id: { type: DataTypes.INTEGER, allowNull: false },
  progress: { type: DataTypes.INTEGER, defaultValue: 0 },
  unlocked_at: { type: DataTypes.DATE, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'pet_user_achievement', timestamps: false });

module.exports = PetUserAchievement;
