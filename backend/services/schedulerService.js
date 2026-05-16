const { sendOverdueReminderEmail } = require('../utils/email');

let schedulerStarted = false;

// ── Monthly billing auto-generation ──────────────────────────────────────────
const runMonthlyBilling = async () => {
    try {
        const User = require('../models/User');
        const Billing = require('../models/Billing');
        const PLANS = require('../config/plans');
        const { createAndSendInvoice } = require('../controllers/billing');

        const now = new Date();
        if (now.getDate() !== 1) return; // only run on 1st of month

        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const period = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

        console.log(`[scheduler] Generating invoices for ${period}`);
        const users = await User.find({});
        let generated = 0;

        for (const user of users) {
            try {
                const existing = await Billing.findOne({ userId: user._id, period });
                if (existing) continue;

                const plan = PLANS[user.plan] || PLANS.free;
                await createAndSendInvoice(user._id, period, plan, user, true);
                generated++;
            } catch (err) {
                console.error(`[scheduler] Billing error for user ${user._id}:`, err.message);
            }
        }

        console.log(`[scheduler] Generated ${generated} invoices for ${period}`);
    } catch (err) {
        console.error('[scheduler] Monthly billing failed:', err.message);
    }
};

// ── Overdue reminders — runs daily ────────────────────────────────────────────
const runOverdueReminders = async () => {
    try {
        const Billing = require('../models/Billing');
        const User = require('../models/User');

        const now = new Date();
        const reminderDays = [3, 7, 14]; // send reminders at 3, 7, 14 days overdue

        const overdueBillings = await Billing.find({
            isPaid: false,
            totalCost: { $gt: 0 },
            dueDate: { $lt: now },
        });

        for (const billing of overdueBillings) {
            const daysPastDue = Math.floor((now - billing.dueDate) / (1000 * 60 * 60 * 24));

            for (const day of reminderDays) {
                if (daysPastDue < day) continue;

                // Check if we already sent a reminder for this day threshold
                const alreadySent = billing.overdueReminderSentAt.some(sentAt => {
                    const sentDays = Math.floor((sentAt - billing.dueDate) / (1000 * 60 * 60 * 24));
                    return sentDays >= day;
                });
                if (alreadySent) continue;

                const user = await User.findById(billing.userId);
                if (!user || !process.env.EMAIL_USER) continue;

                await sendOverdueReminderEmail(user.email, user.username, billing, daysPastDue);

                await Billing.findByIdAndUpdate(billing._id, {
                    $push: { overdueReminderSentAt: now }
                });

                console.log(`[scheduler] Overdue reminder sent to ${user.email} for ${billing.invoiceNumber} (${daysPastDue}d overdue)`);
                break; // only send one reminder per run per invoice
            }
        }
    } catch (err) {
        console.error('[scheduler] Overdue reminders failed:', err.message);
    }
};

// ── Start all jobs ────────────────────────────────────────────────────────────
const startScheduler = () => {
    if (schedulerStarted) return;
    schedulerStarted = true;

    // Monthly billing: check every hour
    setInterval(runMonthlyBilling, 60 * 60 * 1000);
    setTimeout(runMonthlyBilling, 5000); // also check on startup

    // Overdue reminders: check every 6 hours
    setInterval(runOverdueReminders, 6 * 60 * 60 * 1000);
    setTimeout(runOverdueReminders, 10000);

    console.log('[scheduler] Started — monthly billing + overdue reminders active');
};

module.exports = { startScheduler, runMonthlyBilling, runOverdueReminders };
