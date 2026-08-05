const express = require('express');
const router = express.Router();
const { list, create, batchCreate, update, remove } = require('../controllers/slotController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.get('/', authenticate, list);
router.post('/', authenticate, requireAdmin, create);
router.post('/batch', authenticate, requireAdmin, batchCreate);
router.put('/:id', authenticate, requireAdmin, update);
router.delete('/:id', authenticate, requireAdmin, remove);

module.exports = router;
