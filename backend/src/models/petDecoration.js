const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PetDecoration = sequelize.define('PetDecoration', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
  icon: { type: DataTypes.STRING(20), allowNull: false },
  type: { type: DataTypes.STRING(20), allowNull: false },       // hat / glasses / bg
  price: { type: DataTypes.INTEGER, allowNull: false },
  rarity: { type: DataTypes.STRING(20), defaultValue: 'common' },
  sort: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'pet_decoration', timestamps: false });

module.exports = PetDecoration;
