const express = require('express');
const { sendRegisterOtp, register, login, verify, sendForgotOtp, verifyForgotOtp, resetPassword } = require('../controllers/auth');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/send-register-otp', sendRegisterOtp);
router.post('/register', register);
router.post('/login', login);
router.get('/verify', authenticate, verify);
router.post('/send-forgot-otp', sendForgotOtp);
router.post('/verify-forgot-otp', verifyForgotOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
