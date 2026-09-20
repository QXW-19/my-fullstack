const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PetInventory = sequelize.define('PetInventory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  pet_id: { type: DataTypes.INTEGER, allowNull: false },
  item_id: { type: DataTypes.INTEGER, allowNull: false },
  count: { type: DataTypes.INTEGER, defaultValue: 1 },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'pet_inventory', timestamps: false });

module.exports = PetInventory;
