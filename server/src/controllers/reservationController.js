const db = require('../models/db');

exports.create = (req, res, next) => {
  const { slot_id } = req.body;
  const userId = req.user.id;

  if (!slot_id) {
    return res.status(400).json({ code: 1001, message: '缺少时段ID' });
  }

  const book = db.transaction(() => {
    // Lock the slot row
    const slot = db.prepare('SELECT * FROM time_slots WHERE id = ?').get(slot_id);
    if (!slot) throw { code: 2001, message: '时段不存在' };
    if (slot.status !== 'active') throw { code: 2002, message: '时段不可预约' };

    const today = new Date().toISOString().slice(0, 10);
    if (slot.date < today) throw { code: 2002, message: '不可预约过去的时段' };

    if (slot.reserved >= slot.capacity) throw { code: 2002, message: '时段已满' };

    const existing = db.prepare(
      'SELECT id FROM reservations WHERE user_id = ? AND slot_id = ?'
    ).get(userId, slot_id);
    if (existing) throw { code: 2003, message: '已预约过此时段' };

    db.prepare('UPDATE time_slots SET reserved = reserved + 1 WHERE id = ?').run(slot_id);

    const result = db.prepare(
      'INSERT INTO reservations (user_id, slot_id) VALUES (?, ?)'
    ).run(userId, slot_id);

    return result;
  });

  try {
    const result = book();
    res.json({ code: 0, data: { id: result.lastInsertRowid, status: 'pending' } });
  } catch (err) {
    if (err.code) {
      return res.status(400).json(err);
    }
    next(err);
  }
};

exports.remove = (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reservation = db.prepare('SELECT r.*, s.date, s.start_time FROM reservations r JOIN time_slots s ON r.slot_id = s.id WHERE r.id = ? AND r.user_id = ?').get(id, userId);
    if (!reservation) return res.status(404).json({ code: 2004, message: '预约不存在' });
    if (reservation.status !== 'pending') {
      return res.status(400).json({ code: 2006, message: '当前状态不允许取消' });
    }

    const now = new Date();
    const slotStart = new Date(`${reservation.date}T${reservation.start_time}`);
    if (now >= slotStart) {
      return res.status(400).json({ code: 2006, message: '时段已开始，不可取消' });
    }

    const cancel = db.transaction(() => {
      db.prepare('UPDATE reservations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('cancelled', id);
      db.prepare('UPDATE time_slots SET reserved = reserved - 1 WHERE id = ?').run(reservation.slot_id);
    });

    cancel();
    res.json({ code: 0 });
  } catch (err) {
    next(err);
  }
};

exports.list = (req, res, next) => {
  try {
    const { status } = req.query;
    const userId = req.user.id;

    let sql = `
      SELECT r.*, s.date, s.start_time, s.end_time
      FROM reservations r
      JOIN time_slots s ON r.slot_id = s.id
      WHERE r.user_id = ?
    `;
    const params = [userId];

    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY s.date DESC, s.start_time DESC';

    const reservations = db.prepare(sql).all(...params);
    res.json({ code: 0, data: reservations });
  } catch (err) {
    next(err);
  }
};
