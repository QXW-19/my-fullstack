
const { Sequelize } = require('sequelize');

require('dotenv').config();



const sequelize = new Sequelize(

  process.env.DB_NAME,

  process.env.DB_USER,

  process.env.DB_PASS,

  {

    host: process.env.DB_HOST,

    port: process.env.DB_PORT,

    dialect: 'mysql',

    logging: false,

    define: { timestamps: true, underscored: true },

    timezone: '+08:00'

  }

);



sequelize.authenticate()

  .then(() => console.log('✅ MySQL 连接成功'))

  .catch(err => console.error('❌ MySQL 连接失败:', err.message));



module.exports = sequelize;

