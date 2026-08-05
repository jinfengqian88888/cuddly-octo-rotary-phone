const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');

const JWT_SECRET = process.env.JWT_SECRET || 'fitness-booking-dev-secret';
const JWT_EXPIRES = '24h';

exports.register = async (req, res, next) => {
  try {
    const { username, password, real_name } = req.body;

    if (!username || !password || !real_name) {
      return res.status(400).json({ code: 1001, message: '参数不完整' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ code: 1001, message: '用户名已存在' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, password_hash, real_name) VALUES (?, ?, ?)'
    ).run(username, password_hash, real_name);

    res.json({ code: 0, data: { id: result.lastInsertRowid, username } });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(401).json({ code: 1001, message: '用户名或密码错误' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ code: 1001, message: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      code: 0,
      data: {
        token,
        user: { id: user.id, username: user.username, real_name: user.real_name, role: user.role }
      }
    });
  } catch (err) {
    next(err);
  }
};
