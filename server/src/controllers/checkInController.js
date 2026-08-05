const db = require('../models/db');

exports.checkIn = (req, res, next) => {
  try {
    const { reservation_id } = req.params;
    const userId = req.user.id;

    const reservation = db.prepare(`
      SELECT r.*, s.date, s.start_time, s.end_time
      FROM reservations r
      JOIN time_slots s ON r.slot_id = s.id
      WHERE r.id = ? AND r.user_id = ?
    `).get(reservation_id, userId);

    if (!reservation) {
      return res.status(404).json({ code: 2004, message: '预约不存在' });
    }

    if (reservation.status !== 'pending') {
      return res.status(400).json({ code: 2006, message: '当前状态不允许签到' });
    }

    // Check-in window: 15 min before start to 15 min after end
    const now = new Date();
    const slotStart = new Date(`${reservation.date}T${reservation.start_time}`);
    const slotEnd = new Date(`${reservation.date}T${reservation.end_time}`);
    const windowStart = new Date(slotStart.getTime() - 15 * 60 * 1000);
    const windowEnd = new Date(slotEnd.getTime() + 15 * 60 * 1000);

    if (now < windowStart || now > windowEnd) {
      return res.status(400).json({ code: 2005, message: '不在签到时间窗口' });
    }

    const doCheckIn = db.transaction(() => {
      db.prepare('UPDATE reservations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('checked_in', reservation_id);
      db.prepare('INSERT INTO check_ins (reservation_id, checked_by) VALUES (?, ?)').run(reservation_id, 'self');
    });

    doCheckIn();

    res.json({ code: 0, data: { check_in_time: new Date().toISOString() } });
  } catch (err) {
    next(err);
  }
};
