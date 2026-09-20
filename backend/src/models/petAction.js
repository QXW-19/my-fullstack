const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PetAction = sequelize.define('PetAction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  pet_id: { type: DataTypes.INTEGER, allowNull: false },
  action: { type: DataTypes.STRING(20), allowNull: false },  // feed/play/clean/sleep
  effect: { type: DataTypes.JSON },                           // {"hunger": 20, "mood": 5}
  coins_cost: { type: DataTypes.INTEGER, defaultValue: 0 },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'pet_action', timestamps: false });

module.exports = PetAction;
