const express = require('express');
const axios = require('axios');
const { apiKeyAuth } = require('../middleware/apiKeyAuth');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();
const rateLimiter = createRateLimiter(60 * 1000, 100, 'Rate limit exceeded');

// Clean public endpoint: /api/v1/:slug
// End users call this with their X-API-Key header
router.all('/v1/:slug', apiKeyAuth, rateLimiter, async (req, res) => {
    try {
        const api = req.apiKeyDoc.apiId;
        if (!api || !api.endpoint) {
            return res.status(400).json({ message: 'API endpoint not configured' });
        }

        // Verify the slug matches the key's API
        if (api.slug && api.slug !== req.params.slug) {
            return res.status(403).json({ message: 'API key does not match this endpoint' });
        }

        const url = new URL(api.endpoint);
        Object.entries(req.query).forEach(([k, v]) => url.searchParams.set(k, v));

        const response = await axios({
            method: api.method,
            url: url.toString(),
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            data: ['POST', 'PUT', 'PATCH'].includes(api.method) ? req.body : undefined,
            timeout: 15000,
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(502).json({ message: 'Failed to reach upstream API', error: error.message });
        }
    }
});

// Legacy route kept for backward compatibility
router.all('/proxy/:apiId', apiKeyAuth, rateLimiter, async (req, res) => {
    try {
        const api = req.apiKeyDoc.apiId;
        if (!api || !api.endpoint) {
            return res.status(400).json({ message: 'API endpoint not configured' });
        }
        const url = new URL(api.endpoint);
        Object.entries(req.query).forEach(([k, v]) => url.searchParams.set(k, v));
        const response = await axios({
            method: api.method,
            url: url.toString(),
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            data: ['POST', 'PUT', 'PATCH'].includes(api.method) ? req.body : undefined,
            timeout: 15000,
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(502).json({ message: 'Failed to reach upstream API', error: error.message });
        }
    }
});

module.exports = router;
