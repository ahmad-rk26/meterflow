const express = require('express');
const { getPlans, createUpgradeOrder, verifyUpgrade } = require('../controllers/plan');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', getPlans);
router.post('/upgrade-order', authenticate, createUpgradeOrder);
router.post('/verify-upgrade', authenticate, verifyUpgrade);

module.exports = router;
