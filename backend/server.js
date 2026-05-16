const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(helmet());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database connection
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
        .then(() => console.log('MongoDB connected'))
        .catch(err => console.log('MongoDB connection error:', err.message));
} else {
    console.log('No MONGODB_URI provided - running without database');
}
// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/apis', require('./routes/apis'));
app.use('/api/keys', require('./routes/keys'));
app.use('/api/usage', require('./routes/usage'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/plans', require('./routes/plan'));
app.use('/api', require('./routes/proxy'));

// Start background scheduler (auto-billing, cleanup)
const { startScheduler } = require('./services/schedulerService');
startScheduler();

// BullMQ setup for queues
let usageQueue = null;
let redisConnection = null;
if (process.env.REDIS_URL) {
    try {
        redisConnection = new IORedis(process.env.REDIS_URL, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            tls: process.env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
        });
        redisConnection.on('error', (err) => {
            console.log('Redis Connection Error:', err.message);
        });
        usageQueue = new Queue('usage', { connection: redisConnection });
        usageQueue.on('error', (err) => {
            console.log('Redis Queue Error:', err.message);
        });
        usageQueue.on('ready', () => {
            console.log('Redis connected for queues');
        });
    } catch (error) {
        console.log('Redis queue not available:', error.message);
        usageQueue = null;
    }
} else {
    console.log('Redis not configured - running without background queues');
}

// Bull Board for monitoring
if (usageQueue) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');
    createBullBoard({
        queues: [new BullMQAdapter(usageQueue)],
        serverAdapter,
    });
    app.use('/admin/queues', serverAdapter.getRouter());
}
// Socket.io for real-time updates
io.on('connection', (socket) => {
    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
    });
    socket.on('disconnect', () => { });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { io };