const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Pet = sequelize.define('Pet', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
  species: { type: DataTypes.STRING(20), allowNull: false },
  stage: { type: DataTypes.STRING(20), defaultValue: 'egg' },
  level: { type: DataTypes.INTEGER, defaultValue: 1 },
  exp: { type: DataTypes.INTEGER, defaultValue: 0 },
  coins: { type: DataTypes.INTEGER, defaultValue: 1000 },

  // 4 个核心数值（0-100）
  hunger: { type: DataTypes.DECIMAL(5, 2), defaultValue: 80 },
  mood: { type: DataTypes.DECIMAL(5, 2), defaultValue: 80 },
  clean: { type: DataTypes.DECIMAL(5, 2), defaultValue: 80 },
  energy: { type: DataTypes.DECIMAL(5, 2), defaultValue: 80 },

  // ⭐ 核心字段：上次更新时间戳（毫秒，BIGINT）
  last_update: { type: DataTypes.BIGINT, allowNull: false, defaultValue: () => Date.now() },

  // 死亡机制
  died_at: { type: DataTypes.DATE, allowNull: true },
  death_cause: { type: DataTypes.STRING(100), allowNull: true },
  revive_count: { type: DataTypes.INTEGER, defaultValue: 0 },

  // 已装备装扮 { hat: id, glasses: id, bg: id }
  equipped: { type: DataTypes.JSON, defaultValue: {} },

  // ⭐ 好感度系统
  intimacy: { type: DataTypes.INTEGER, defaultValue: 0 },

  // ⭐ 性格语气
  tone: { type: DataTypes.STRING(20), defaultValue: 'normal' },

  // ⭐ 皮肤配色
  skin: { type: DataTypes.STRING(20), defaultValue: 'default' },
  last_random_at: { type: DataTypes.BIGINT, allowNull: true },

  // 统计
  total_feed: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_play: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_clean: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_sleep: { type: DataTypes.INTEGER, defaultValue: 0 },

  // 时间
  birthday: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  last_login_date: { type: DataTypes.DATEONLY },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'pet', timestamps: false });

module.exports = Pet;
