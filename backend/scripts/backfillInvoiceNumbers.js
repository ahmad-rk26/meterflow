/**
 * Run once: node scripts/backfillInvoiceNumbers.js
 * Assigns invoice numbers to all existing billing records that don't have one.
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Load models (Counter is defined inside Billing model)
    const Billing = require('../models/Billing');

    const records = await Billing.find({ invoiceNumber: { $in: [null, undefined, ''] } }).sort({ createdAt: 1 });
    console.log(`Found ${records.length} records without invoice numbers`);

    for (const record of records) {
        // Trigger pre-save hook by marking as modified
        record.invoiceNumber = undefined; // clear so hook generates it
        await record.save();
        console.log(`  ${record._id} → ${record.invoiceNumber} (${record.period})`);
    }

    console.log('Done.');
    await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
