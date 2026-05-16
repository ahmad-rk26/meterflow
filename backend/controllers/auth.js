const crypto = require('crypto');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const { sendOtpEmail } = require('../utils/email');

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

// Step 1: Send OTP for registration
const sendRegisterOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already registered' });

        const otp = generateOtp();
        await Otp.deleteMany({ email, type: 'register' }); // clear old OTPs
        await Otp.create({ email, otp, type: 'register', expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
        await sendOtpEmail(email, otp, 'register');

        res.json({ message: 'OTP sent to your email' });
    } catch (error) {
        console.error('sendRegisterOtp error:', error.message);
        res.status(500).json({ message: 'Failed to send OTP. Check email configuration.' });
    }
};

// Step 2: Verify OTP and complete registration
const register = async (req, res) => {
    try {
        const { username, email, password, otp } = req.body;

        const otpDoc = await Otp.findOne({ email, type: 'register', used: false });
        if (!otpDoc || otpDoc.otp !== otp || otpDoc.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already registered' });

        const hashedPassword = await hashPassword(password);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        otpDoc.used = true;
        await otpDoc.save();

        const token = generateToken(user._id);
        res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email } });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await comparePassword(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = generateToken(user._id);
        res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const verify = async (req, res) => {
    try {
        const User = require('../models/User');
        const PLANS = require('../config/plans');
        const user = await User.findById(req.userId).select('-password');
        const plan = PLANS[user.plan] || PLANS.free;
        res.json({ valid: true, userId: req.userId, plan: user.plan, planDetails: plan });
    } catch {
        res.json({ valid: true, userId: req.userId });
    }
};

// Step 1: Send OTP for password reset
const sendForgotOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'No account found with this email' });

        const otp = generateOtp();
        await Otp.deleteMany({ email, type: 'forgot-password' });
        await Otp.create({ email, otp, type: 'forgot-password', expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
        await sendOtpEmail(email, otp, 'forgot-password');

        res.json({ message: 'OTP sent to your email' });
    } catch (error) {
        console.error('sendForgotOtp error:', error.message);
        res.status(500).json({ message: 'Failed to send OTP. Check email configuration.' });
    }
};

// Step 2: Verify OTP for password reset
const verifyForgotOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const otpDoc = await Otp.findOne({ email, type: 'forgot-password', used: false });
        if (!otpDoc || otpDoc.otp !== otp || otpDoc.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }
        res.json({ message: 'OTP verified', verified: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Step 3: Reset password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const otpDoc = await Otp.findOne({ email, type: 'forgot-password', used: false });
        if (!otpDoc || otpDoc.otp !== otp || otpDoc.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const hashedPassword = await hashPassword(newPassword);
        await User.findOneAndUpdate({ email }, { password: hashedPassword });

        otpDoc.used = true;
        await otpDoc.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { sendRegisterOtp, register, login, verify, sendForgotOtp, verifyForgotOtp, resetPassword };
