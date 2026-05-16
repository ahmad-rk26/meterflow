class QueueService {
    constructor() {
        this.usageQueue = null;
        this.connection = null;
        this.initialized = false;

        if (process.env.REDIS_URL) {
            try {
                const { Queue } = require('bullmq');
                const IORedis = require('ioredis');

                this.connection = new IORedis(process.env.REDIS_URL, {
                    maxRetriesPerRequest: null,
                    enableReadyCheck: false,
                    tls: process.env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
                });

                this.connection.on('error', (err) => {
                    console.log('Redis Connection Error:', err.message);
                });

                this.usageQueue = new Queue('usage', { connection: this.connection });
                this.initialized = true;

                this.usageQueue.on('error', (err) => {
                    console.log('Queue Error:', err.message);
                });
            } catch (error) {
                console.log('Could not initialize queue:', error.message);
                this.usageQueue = null;
            }
        }
    }

    async addUsageJob(data) {
        if (!this.usageQueue) {
            console.log('Queue not available - storing usage data directly');
            return Promise.resolve();
        }
        try {
            await this.usageQueue.add('process-usage', data);
        } catch (error) {
            console.log('Error adding job to queue:', error.message);
        }
    }

    async processUsageJobs() {
        if (!this.usageQueue) {
            console.log('Queue not available - skipping job processing');
            return;
        }
        try {
            const { Worker } = require('bullmq');
            new Worker('usage', async (job) => {
                console.log('Processing usage:', job.data);
            }, { connection: this.connection });
        } catch (error) {
            console.log('Error processing jobs:', error.message);
        }
    }
}

module.exports = new QueueService();
