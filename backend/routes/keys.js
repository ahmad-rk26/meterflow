const express = require('express');
const { createApiKey, getApiKeys, deleteApiKey } = require('../controllers/keys');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.post('/', createApiKey);
router.get('/', getApiKeys);
router.delete('/:id', deleteApiKey);

module.exports = router;