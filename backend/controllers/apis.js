const Api = require('../models/Api');
const PLANS = require('../config/plans');
const User = require('../models/User');

const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const createApi = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const plan = PLANS[user.plan] || PLANS.free;
        const existingCount = await Api.countDocuments({ userId: req.userId });
        if (existingCount >= plan.apiLimit) {
            return res.status(403).json({ message: `Your ${plan.name} plan allows up to ${plan.apiLimit} APIs. Upgrade to create more.` });
        }
        let slug = generateSlug(req.body.name);
        const existing = await Api.findOne({ slug });
        if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
        const api = new Api({ ...req.body, slug, userId: req.userId });
        await api.save();
        res.status(201).json(api);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getApis = async (req, res) => {
    try {
        const apis = await Api.find({ userId: req.userId });
        res.json(apis);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const updateApi = async (req, res) => {
    try {
        const api = await Api.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            req.body,
            { new: true }
        );
        if (!api) {
            return res.status(404).json({ message: 'API not found' });
        }
        res.json(api);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteApi = async (req, res) => {
    try {
        const api = await Api.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!api) {
            return res.status(404).json({ message: 'API not found' });
        }
        res.json({ message: 'API deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createApi, getApis, updateApi, deleteApi };