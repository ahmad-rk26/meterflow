// Plan definitions — single source of truth for both backend enforcement and frontend display
const PLANS = {
    free: {
        name: 'Free',
        price: 0,           // ₹/month
        requestLimit: 1000, // per month
        apiLimit: 2,        // max APIs
        keyLimit: 3,        // max API keys
        costPerRequest: 0,  // no charge on free
        support: 'Community support',
    },
    basic: {
        name: 'Basic',
        price: 499,         // ₹/month
        requestLimit: 50000,
        apiLimit: 10,
        keyLimit: 25,
        costPerRequest: 0.01, // ₹ per request beyond plan
        support: 'Email support',
    },
    premium: {
        name: 'Premium',
        price: 1999,        // ₹/month
        requestLimit: 500000,
        apiLimit: 100,
        keyLimit: 500,
        costPerRequest: 0.005,
        support: 'Priority support + SLA',
    },
};

module.exports = PLANS;
