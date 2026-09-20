const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PetVisit = sequelize.define('PetVisit', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  visitor_id: { type: DataTypes.INTEGER, allowNull: false },
  pet_id: { type: DataTypes.INTEGER, allowNull: false },
  action: { type: DataTypes.STRING(20), allowNull: false },
  message: { type: DataTypes.STRING(200) },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'pet_visit', timestamps: false });

module.exports = PetVisit;
