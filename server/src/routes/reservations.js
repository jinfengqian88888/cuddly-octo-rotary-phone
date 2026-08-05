const express = require('express');
const router = express.Router();
const { create, remove, list } = require('../controllers/reservationController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, list);
router.post('/', authenticate, create);
router.delete('/:id', authenticate, remove);

module.exports = router;
