const db = require('../models/db');

exports.list = (req, res, next) => {
  try {
    const { date, days = 7 } = req.query;
    const startDate = date || new Date().toISOString().slice(0, 10);
    const d = Math.min(parseInt(days) || 7, 30);

    const slots = db.prepare(`
      SELECT * FROM time_slots
      WHERE date >= ? AND date < date(?, '+' || ? || ' days') AND status = 'active'
      ORDER BY date, start_time
    `).all(startDate, startDate, d);

    res.json({ code: 0, data: slots });
  } catch (err) {
    next(err);
  }
};

exports.create = (req, res, next) => {
  try {
    const { date, start_time, end_time, capacity } = req.body;

    if (!date || !start_time || !end_time || !capacity || capacity <= 0) {
      return res.status(400).json({ code: 1001, message: '参数不合法' });
    }

    if (start_time >= end_time) {
      return res.status(400).json({ code: 1001, message: '开始时间必须早于结束时间' });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (date < today) {
      return res.status(400).json({ code: 1001, message: '不可创建过去的时段' });
    }

    const result = db.prepare(`
      INSERT INTO time_slots (date, start_time, end_time, capacity) VALUES (?, ?, ?, ?)
    `).run(date, start_time, end_time, capacity);

    res.json({ code: 0, data: { id: result.lastInsertRowid } });
  } catch (err) {
    next(err);
  }
};

exports.batchCreate = (req, res, next) => {
  try {
    const { date_from, date_to, start_time, end_time, capacity, weekdays } = req.body;

    const insert = db.prepare(`
      INSERT INTO time_slots (date, start_time, end_time, capacity) VALUES (?, ?, ?, ?)
    `);

    const start = new Date(date_from);
    const end = new Date(date_to);
    let count = 0;

    const batch = db.transaction(() => {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayStr = d.toISOString().slice(0, 10);
        const dayOfWeek = d.getDay(); // 0=Sun
        if (weekdays && weekdays.length > 0 && !weekdays.includes(dayOfWeek)) continue;
        insert.run(dayStr, start_time, end_time, capacity);
        count++;
      }
    });

    batch();
    res.json({ code: 0, data: { created: count } });
  } catch (err) {
    next(err);
  }
};

exports.update = (req, res, next) => {
  try {
    const { id } = req.params;
    const { capacity } = req.body;

    const slot = db.prepare('SELECT * FROM time_slots WHERE id = ?').get(id);
    if (!slot) return res.status(404).json({ code: 2001, message: '时段不存在' });

    if (capacity < slot.reserved) {
      return res.status(400).json({ code: 1001, message: '容量不能小于已预约数' });
    }

    db.prepare('UPDATE time_slots SET capacity = ? WHERE id = ?').run(capacity, id);
    res.json({ code: 0 });
  } catch (err) {
    next(err);
  }
};

exports.remove = (req, res, next) => {
  try {
    const { id } = req.params;

    const slot = db.prepare('SELECT * FROM time_slots WHERE id = ?').get(id);
    if (!slot) return res.status(404).json({ code: 2001, message: '时段不存在' });
    if (slot.reserved > 0) {
      return res.status(400).json({ code: 1001, message: '时段有预约记录，不可删除' });
    }

    db.prepare('DELETE FROM time_slots WHERE id = ?').run(id);
    res.json({ code: 0 });
  } catch (err) {
    next(err);
  }
};
