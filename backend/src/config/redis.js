const Redis = require('ioredis');

const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  // password: '你的redis密码',  // 宝塔里如果设了密码就填
  lazyConnect: false,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

redis.on('connect', () => console.log('✅ Redis 连接成功'));
redis.on('error', (err) => console.error('❌ Redis 错误:', err.message));

module.exports = redis;
