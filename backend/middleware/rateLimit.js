const rateLimit = require('express-rate-limit');

// Use memory store by default (Redis store can be added later if needed)
const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: { message },
        standardHeaders: true,
        legacyHeaders: false,
    });
};

module.exports = { createRateLimiter };
