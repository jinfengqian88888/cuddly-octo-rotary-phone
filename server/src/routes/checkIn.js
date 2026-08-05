const express = require('express');
const router = express.Router();
const { checkIn } = require('../controllers/checkInController');
const { authenticate } = require('../middleware/auth');

router.post('/:reservation_id', authenticate, checkIn);

module.exports = router;
