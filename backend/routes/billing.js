const express = require('express');
const { getBilling, getCurrentUsage, generateBilling, downloadInvoice, createPaymentOrder, verifyPayment } = require('../controllers/billing');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', getBilling);
router.get('/current', getCurrentUsage);
router.get('/:id/download', downloadInvoice);
router.post('/generate', generateBilling);
router.post('/create-order', createPaymentOrder);
router.post('/verify-payment', verifyPayment);

module.exports = router;
