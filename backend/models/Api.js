const mongoose = require('mongoose');

const apiSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, // clean URL identifier e.g. "my-posts-api"
    description: String,
    endpoint: { type: String, required: true },
    method: { type: String, required: true, enum: ['GET', 'POST', 'PUT', 'DELETE'] },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rateLimit: { type: Number, default: 100 },
    costPerRequest: { type: Number, default: 0.01 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Api', apiSchema);