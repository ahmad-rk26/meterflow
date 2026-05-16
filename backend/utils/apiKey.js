const crypto = require('crypto');

const generateApiKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

const validateApiKey = (key) => {
    // Basic validation - check if it's a valid hex string of 64 characters
    return /^[a-f0-9]{64}$/.test(key);
};

module.exports = {
    generateApiKey,
    validateApiKey
};