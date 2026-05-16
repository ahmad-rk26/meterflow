const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema({
    apiKeyId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiKey', required: true },
    apiId: { type: mongoose.Schema.Types.ObjectId, ref: 'Api', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
    responseTime: Number, // in ms
    statusCode: Number,
    cost: { type: Number, default: 0 }
});

module.exports = mongoose.model('Usage', usageSchema);