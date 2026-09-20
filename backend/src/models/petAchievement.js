const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PetAchievement = sequelize.define('PetAchievement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
  icon: { type: DataTypes.STRING(20), allowNull: false },
  description: { type: DataTypes.STRING(200), allowNull: false },
  // condition: { type: 'feed', count: 10 } / { type: 'level', value: 5 }
  condition: { type: DataTypes.JSON, allowNull: false },
  reward_coins: { type: DataTypes.INTEGER, defaultValue: 50 },
  sort: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'pet_achievement', timestamps: false });

module.exports = PetAchievement;
