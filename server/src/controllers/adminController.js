const db = require('../models/db');

exports.list = (req, res, next) => {
  try {
    const { date, status, page = 1, size = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(size);

    let where = 'WHERE 1=1';
    const params = [];

    if (date) {
      where += ' AND s.date = ?';
      params.push(date);
    }
    if (status) {
      where += ' AND r.status = ?';
      params.push(status);
    }

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM reservations r JOIN time_slots s ON r.slot_id = s.id ${where}
    `).get(...params).count;

    const list = db.prepare(`
      SELECT r.*, s.date, s.start_time, s.end_time, u.username, u.real_name
      FROM reservations r
      JOIN time_slots s ON r.slot_id = s.id
      JOIN users u ON r.user_id = u.id
      ${where}
      ORDER BY s.date DESC, s.start_time DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(size), offset);

    res.json({ code: 0, data: { list, total, page: parseInt(page), size: parseInt(size) } });
  } catch (err) {
    next(err);
  }
};

exports.cancel = (req, res, next) => {
  try {
    const { id } = req.params;

    const reservation = db.prepare('SELECT r.*, s.date, s.start_time FROM reservations r JOIN time_slots s ON r.slot_id = s.id WHERE r.id = ?').get(id);
    if (!reservation) return res.status(404).json({ code: 2004, message: '预约不存在' });
    if (reservation.status === 'cancelled') {
      return res.status(400).json({ code: 2006, message: '预约已取消' });
    }

    const cancel = db.transaction(() => {
      const oldStatus = reservation.status;
      db.prepare('UPDATE reservations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('cancelled', id);
      if (oldStatus === 'pending') {
        db.prepare('UPDATE time_slots SET reserved = reserved - 1 WHERE id = ?').run(reservation.slot_id);
      }
    });

    cancel();
    res.json({ code: 0 });
  } catch (err) {
    next(err);
  }
};

exports.checkIn = (req, res, next) => {
  try {
    const { id } = req.params;

    const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
    if (!reservation) return res.status(404).json({ code: 2004, message: '预约不存在' });
    if (reservation.status !== 'pending') {
      return res.status(400).json({ code: 2006, message: '当前状态不允许签到' });
    }

    const doCheckIn = db.transaction(() => {
      db.prepare('UPDATE reservations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('checked_in', id);
      db.prepare('INSERT INTO check_ins (reservation_id, checked_by) VALUES (?, ?)').run(id, 'admin');
    });

    doCheckIn();
    res.json({ code: 0, data: { check_in_time: new Date().toISOString() } });
  } catch (err) {
    next(err);
  }
};
