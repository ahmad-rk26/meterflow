const express = require('express');
const { createApi, getApis, updateApi, deleteApi } = require('../controllers/apis');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.post('/', createApi);
router.get('/', getApis);
router.put('/:id', updateApi);
router.delete('/:id', deleteApi);

module.exports = router;