const ApiKey = require('../models/ApiKey');
const Usage = require('../models/Usage');
const User = require('../models/User');
const PLANS = require('../config/plans');

const apiKeyAuth = async (req, res, next) => {
    const apiKey = req.header('X-API-Key');
    if (!apiKey) return res.status(401).json({ message: 'API key required' });

    try {
        const keyDoc = await ApiKey.findOne({ key: apiKey, isActive: true }).populate('apiId');
        if (!keyDoc || !keyDoc.apiId) {
            return res.status(401).json({ message: 'Invalid or inactive API key' });
        }

        // Enforce monthly request limit
        const user = await User.findById(keyDoc.userId);
        const plan = PLANS[user?.plan] || PLANS.free;
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const monthlyCount = await Usage.countDocuments({
            userId: keyDoc.userId,
            timestamp: { $gte: monthStart, $lt: monthEnd }
        });

        if (monthlyCount >= plan.requestLimit) {
            return res.status(429).json({
                message: `Monthly limit of ${plan.requestLimit.toLocaleString()} requests reached for your ${plan.name} plan.`,
                limit: plan.requestLimit,
                used: monthlyCount,
                upgradeUrl: '/pricing'
            });
        }

        req.apiKeyDoc = keyDoc;
        req.apiId = keyDoc.apiId._id;
        req.userId = keyDoc.userId;
        req.monthlyCount = monthlyCount;
        req.userPlan = plan;

        const startTime = Date.now();
        res.on('finish', async () => {
            try {
                const responseTime = Date.now() - startTime;
                // Free plan: no cost. Paid plans: cost per request
                const cost = plan.price === 0 ? 0 : keyDoc.apiId.costPerRequest;

                await Usage.create({
                    apiKeyId: keyDoc._id,
                    apiId: req.apiId,
                    userId: req.userId,
                    responseTime,
                    statusCode: res.statusCode,
                    cost,
                });

                // Real-time update via socket
                const { io } = require('../server');
                if (io) {
                    io.to(`user_${req.userId}`).emit('usage-update', {
                        monthlyCount: monthlyCount + 1,
                        limit: plan.requestLimit,
                    });
                }
            } catch (err) {
                console.error('[usage] Logging error:', err.message);
            }
        });

        next();
    } catch (error) {
        console.error('[apiKeyAuth] Error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { apiKeyAuth };
