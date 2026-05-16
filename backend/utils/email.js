const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendOtpEmail = async (to, otp, type) => {
    const subject = type === 'register' ? 'Verify your MeterFlow account' : 'Reset your MeterFlow password';
    const action = type === 'register' ? 'complete your registration' : 'reset your password';
    await transporter.sendMail({
        from: `"MeterFlow" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
            <h2 style="color:#0f172a;margin-bottom:8px;">MeterFlow</h2>
            <h3 style="color:#0f172a;">Your verification code</h3>
            <p style="color:#64748b;">Use the code below to ${action}. Expires in <strong>10 minutes</strong>.</p>
            <div style="background:#0f172a;color:#fff;font-size:32px;font-weight:700;letter-spacing:12px;text-align:center;padding:20px;border-radius:12px;margin:24px 0;">
                ${otp}
            </div>
            <p style="color:#94a3b8;font-size:13px;">If you didn't request this, ignore this email.</p>
        </div>`
    });
};

const sendInvoiceEmail = async (to, username, billing, pdfBuffer) => {
    const isPaid = billing.isPaid;
    const subject = `Invoice ${billing.invoiceNumber} — MeterFlow (${billing.period})`;
    await transporter.sendMail({
        from: `"MeterFlow Billing" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <div style="background:#0f172a;padding:28px 32px;">
                <h1 style="color:#ffffff;margin:0;font-size:20px;">MeterFlow</h1>
                <p style="color:#94a3b8;margin:4px 0 0;font-size:13px;">API Billing Platform</p>
            </div>
            <div style="padding:32px;">
                <p style="color:#0f172a;font-size:16px;">Hi ${username},</p>
                <p style="color:#475569;">Your invoice for <strong>${billing.period}</strong> has been generated.</p>
                <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2e8f0;">
                    <table style="width:100%;border-collapse:collapse;">
                        <tr><td style="color:#64748b;padding:6px 0;font-size:13px;">Invoice Number</td><td style="text-align:right;font-weight:600;color:#0f172a;font-size:13px;">${billing.invoiceNumber}</td></tr>
                        <tr><td style="color:#64748b;padding:6px 0;font-size:13px;">Period</td><td style="text-align:right;font-weight:600;color:#0f172a;font-size:13px;">${billing.period}</td></tr>
                        <tr><td style="color:#64748b;padding:6px 0;font-size:13px;">Plan</td><td style="text-align:right;font-weight:600;color:#0f172a;font-size:13px;text-transform:capitalize;">${billing.plan}</td></tr>
                        <tr><td style="color:#64748b;padding:6px 0;font-size:13px;">Total Requests</td><td style="text-align:right;font-weight:600;color:#0f172a;font-size:13px;">${billing.totalRequests.toLocaleString()}</td></tr>
                        <tr style="border-top:1px solid #e2e8f0;"><td style="color:#0f172a;padding:10px 0 6px;font-weight:700;font-size:15px;">Total Amount</td><td style="text-align:right;font-weight:700;color:#0f172a;font-size:15px;padding:10px 0 6px;">₹${billing.totalCost.toFixed(2)}</td></tr>
                    </table>
                </div>
                ${isPaid
                ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;color:#16a34a;font-weight:600;">✓ This invoice has been paid. Thank you!</div>`
                : `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;color:#92400e;margin-bottom:20px;">⚠️ Payment is due. Please log in to pay via UPI, card, or netbanking.</div>
                       <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing" style="display:inline-block;background:#0ea5e9;color:#ffffff;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;">Pay Now →</a>`
            }
                <p style="color:#94a3b8;font-size:12px;margin-top:28px;">The full invoice PDF is attached to this email.</p>
            </div>
            <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;">
                <p style="color:#94a3b8;font-size:12px;margin:0;">MeterFlow · support@meterflow.app</p>
            </div>
        </div>`,
        attachments: [{
            filename: `${billing.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
        }]
    });
};

const sendPaymentReceiptEmail = async (to, username, billing) => {
    await transporter.sendMail({
        from: `"MeterFlow Billing" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Payment Received — ${billing.invoiceNumber} ✓`,
        html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <div style="background:#0f172a;padding:28px 32px;">
                <h1 style="color:#ffffff;margin:0;font-size:20px;">MeterFlow</h1>
            </div>
            <div style="padding:32px;">
                <div style="text-align:center;margin-bottom:24px;">
                    <div style="width:56px;height:56px;background:#f0fdf4;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">✓</div>
                    <h2 style="color:#16a34a;margin:12px 0 4px;">Payment Successful</h2>
                    <p style="color:#64748b;margin:0;">₹${billing.totalCost.toFixed(2)} received</p>
                </div>
                <div style="background:#f8fafc;border-radius:12px;padding:20px;border:1px solid #e2e8f0;">
                    <table style="width:100%;border-collapse:collapse;">
                        <tr><td style="color:#64748b;padding:5px 0;font-size:13px;">Invoice</td><td style="text-align:right;font-weight:600;color:#0f172a;font-size:13px;">${billing.invoiceNumber}</td></tr>
                        <tr><td style="color:#64748b;padding:5px 0;font-size:13px;">Period</td><td style="text-align:right;font-weight:600;color:#0f172a;font-size:13px;">${billing.period}</td></tr>
                        <tr><td style="color:#64748b;padding:5px 0;font-size:13px;">Payment ID</td><td style="text-align:right;font-weight:600;color:#0f172a;font-size:13px;">${billing.paymentId}</td></tr>
                        <tr><td style="color:#64748b;padding:5px 0;font-size:13px;">Paid On</td><td style="text-align:right;font-weight:600;color:#0f172a;font-size:13px;">${new Date(billing.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td></tr>
                        <tr style="border-top:1px solid #e2e8f0;"><td style="color:#0f172a;padding:10px 0 0;font-weight:700;">Amount Paid</td><td style="text-align:right;font-weight:700;color:#16a34a;padding:10px 0 0;">₹${billing.totalCost.toFixed(2)}</td></tr>
                    </table>
                </div>
                <p style="color:#64748b;font-size:13px;margin-top:20px;">Hi ${username}, thank you for your payment. Your account is active and in good standing.</p>
            </div>
            <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;">
                <p style="color:#94a3b8;font-size:12px;margin:0;">MeterFlow · support@meterflow.app</p>
            </div>
        </div>`
    });
};

const sendOverdueReminderEmail = async (to, username, billing, daysPastDue) => {
    await transporter.sendMail({
        from: `"MeterFlow Billing" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Action Required: Invoice ${billing.invoiceNumber} is ${daysPastDue} days overdue`,
        html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <div style="background:#dc2626;padding:28px 32px;">
                <h1 style="color:#ffffff;margin:0;font-size:20px;">MeterFlow</h1>
                <p style="color:#fca5a5;margin:4px 0 0;font-size:13px;">Payment Overdue Notice</p>
            </div>
            <div style="padding:32px;">
                <p style="color:#0f172a;font-size:16px;">Hi ${username},</p>
                <p style="color:#475569;">Invoice <strong>${billing.invoiceNumber}</strong> for <strong>${billing.period}</strong> is <strong style="color:#dc2626;">${daysPastDue} days overdue</strong>.</p>
                <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin:20px 0;">
                    <table style="width:100%;border-collapse:collapse;">
                        <tr><td style="color:#64748b;padding:5px 0;font-size:13px;">Invoice</td><td style="text-align:right;font-weight:600;color:#0f172a;font-size:13px;">${billing.invoiceNumber}</td></tr>
                        <tr><td style="color:#64748b;padding:5px 0;font-size:13px;">Period</td><td style="text-align:right;font-weight:600;color:#0f172a;font-size:13px;">${billing.period}</td></tr>
                        <tr style="border-top:1px solid #fecaca;"><td style="color:#dc2626;padding:10px 0 0;font-weight:700;">Amount Due</td><td style="text-align:right;font-weight:700;color:#dc2626;padding:10px 0 0;">₹${billing.totalCost.toFixed(2)}</td></tr>
                    </table>
                </div>
                <p style="color:#475569;font-size:13px;">Please pay immediately to avoid service interruption. If you've already paid, please ignore this email.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing" style="display:inline-block;background:#dc2626;color:#ffffff;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px;">Pay Now →</a>
            </div>
            <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;">
                <p style="color:#94a3b8;font-size:12px;margin:0;">MeterFlow · support@meterflow.app</p>
            </div>
        </div>`
    });
};

module.exports = { sendOtpEmail, sendInvoiceEmail, sendPaymentReceiptEmail, sendOverdueReminderEmail };
