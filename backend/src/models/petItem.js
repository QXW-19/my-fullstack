const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PetItem = sequelize.define('PetItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
  icon: { type: DataTypes.STRING(20), allowNull: false },
  type: { type: DataTypes.STRING(20), allowNull: false },   // food / toy / soap
  price: { type: DataTypes.INTEGER, allowNull: false },
  effect: { type: DataTypes.JSON, allowNull: false },        // {"hunger": 25, "mood": 5}
  rarity: { type: DataTypes.STRING(20), defaultValue: 'common' },  // common/rare/legendary
  description: { type: DataTypes.STRING(255) },
  unlock_level: { type: DataTypes.INTEGER, defaultValue: 1 } // 解锁等级
}, { tableName: 'pet_item', timestamps: false });

module.exports = PetItem;
