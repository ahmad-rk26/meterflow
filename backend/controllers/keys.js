const ApiKey = require('../models/ApiKey');
const { generateApiKey } = require('../utils/apiKey');
const PLANS = require('../config/plans');
const User = require('../models/User');

const createApiKey = async (req, res) => {
    try {
        const { apiId } = req.body;
        if (!apiId) return res.status(400).json({ message: 'apiId is required' });

        const Api = require('../models/Api');
        const api = await Api.findOne({ _id: apiId, userId: req.userId });
        if (!api) return res.status(403).json({ message: 'API not found or access denied' });

        const user = await User.findById(req.userId);
        const plan = PLANS[user.plan] || PLANS.free;
        const keyCount = await ApiKey.countDocuments({ userId: req.userId });
        if (keyCount >= plan.keyLimit) {
            return res.status(403).json({ message: `Your ${plan.name} plan allows up to ${plan.keyLimit} API keys. Upgrade to create more.` });
        }

        const key = generateApiKey();
        const apiKey = new ApiKey({ key, userId: req.userId, apiId });
        await apiKey.save();
        res.status(201).json(apiKey);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getApiKeys = async (req, res) => {
    try {
        const apiKeys = await ApiKey.find({ userId: req.userId }).populate('apiId');
        res.json(apiKeys);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteApiKey = async (req, res) => {
    try {
        const apiKey = await ApiKey.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!apiKey) {
            return res.status(404).json({ message: 'API key not found' });
        }
        res.json({ message: 'API key deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createApiKey, getApiKeys, deleteApiKey };