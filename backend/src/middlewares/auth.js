const { verify } = require('../utils/jwt');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ code: 401, msg: '未登录' });
  try {
    req.user = verify(token);
    next();
  } catch {
    res.status(401).json({ code: 401, msg: 'token 失效' });
  }
};
