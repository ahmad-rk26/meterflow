const Usage = require('../models/Usage');
const mongoose = require('mongoose');

const getUsage = async (req, res) => {
    try {
        const usage = await Usage.find({ userId: req.userId }).populate('apiId').sort({ timestamp: -1 });
        res.json(usage);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getUsageStats = async (req, res) => {
    try {
        const stats = await Usage.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                    requests: { $sum: 1 },
                    totalCost: { $sum: '$cost' },
                    avgResponseTime: { $avg: '$responseTime' }
                }
            },
            { $sort: { '_id': -1 } },
            { $limit: 30 }
        ]);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getUsage, getUsageStats };