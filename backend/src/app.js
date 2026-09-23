// ⭐ 强制 IPv4（必须在所有 require 前）
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// 引入模型
const { sequelize } = require('./models');

// 引入 Socket.io
const { initSocket } = require('./socket');

// HTTP 路由
// ⭐ 静态文件服务（上传的文件）
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', require('./routes'));

// 统一错误处理
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ code: 500, msg: err.message });
});

const PORT = process.env.PORT || 3000;

// 用 http.createServer 包住 express，才能挂 Socket.io
const server = http.createServer(app);
initSocket(server);

// 同步数据库 + 启动
sequelize.sync()
  .then(() => {
    console.log('✅ 数据库表同步完成');
    server.listen(PORT, () => {
      console.log(`✅ Backend: http://localhost:${PORT}`);
      console.log(`✅ WebSocket: ws://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ 数据库同步失败:', err);
  });
