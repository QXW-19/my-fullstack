const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PetOwnedDecoration = sequelize.define('PetOwnedDecoration', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  pet_id: { type: DataTypes.INTEGER, allowNull: false },
  decoration_id: { type: DataTypes.INTEGER, allowNull: false },
  equipped: { type: DataTypes.TINYINT, defaultValue: 0 },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'pet_owned_decoration', timestamps: false });

module.exports = PetOwnedDecoration;
