const User = require('../models/User');
const PLANS = require('../config/plans');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getPlans = (req, res) => {
    res.json(PLANS);
};

const createUpgradeOrder = async (req, res) => {
    try {
        const { plan } = req.body;
        if (!PLANS[plan] || plan === 'free') {
            return res.status(400).json({ message: 'Invalid plan' });
        }
        const amountInPaise = PLANS[plan].price * 100;
        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `plan_${plan}_${req.userId}`,
        });
        res.json({ orderId: order.id, amount: order.amount, currency: order.currency, plan });
    } catch (error) {
        res.status(500).json({ message: 'Error creating order', error: error.message });
    }
};

const verifyUpgrade = async (req, res) => {
    try {
        const { orderId, paymentId, signature, plan } = req.body;
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(`${orderId}|${paymentId}`);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature !== signature) {
            return res.status(400).json({ message: 'Payment signature mismatch' });
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { plan, planActivatedAt: new Date() },
            { new: true }
        ).select('-password');

        res.json({ message: `Upgraded to ${PLANS[plan].name} plan`, user });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying upgrade', error: error.message });
    }
};

module.exports = { getPlans, createUpgradeOrder, verifyUpgrade };
