const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PetDiary = sequelize.define('PetDiary', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  pet_id: { type: DataTypes.INTEGER, allowNull: false },
  week_start: { type: DataTypes.DATEONLY, allowNull: false },
  feed_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  play_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  clean_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  sleep_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  level_up: { type: DataTypes.INTEGER, defaultValue: 0 },
  achievements: { type: DataTypes.INTEGER, defaultValue: 0 },
  mood_avg: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  content: { type: DataTypes.TEXT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'pet_diary', timestamps: false });

module.exports = PetDiary;
