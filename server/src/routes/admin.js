const express = require('express');
const router = express.Router();
const { list, cancel, checkIn } = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.get('/reservations', authenticate, requireAdmin, list);
router.post('/reservations/:id/cancel', authenticate, requireAdmin, cancel);
router.post('/reservations/:id/check-in', authenticate, requireAdmin, checkIn);

module.exports = router;
