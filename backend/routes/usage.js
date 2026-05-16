const express = require('express');
const { getUsage, getUsageStats } = require('../controllers/usage');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.get('/', getUsage);
router.get('/stats', getUsageStats);

module.exports = router;