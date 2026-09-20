const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.sign = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
exports.verify = (token) => jwt.verify(token, process.env.JWT_SECRET);
