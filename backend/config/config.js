const config = {
    port: process.env.PORT || 5000,
    mongodbUri: process.env.MONGODB_URI,
    redisUrl: process.env.REDIS_URL,
    jwtSecret: process.env.JWT_SECRET,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
};

module.exports = config;
