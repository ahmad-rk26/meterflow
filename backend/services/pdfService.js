const PDFDocument = require('pdfkit');

const generateInvoicePDF = (billing, user) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];

        doc.on('data', chunk => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        const W = doc.page.width;   // 595
        const primary = '#0f172a';
        const accent = '#0ea5e9';
        const muted = '#64748b';
        const light = '#f8fafc';
        const border = '#e2e8f0';

        // Use INR instead of ₹ symbol (avoids font encoding issues in pdfkit)
        const fmt = (n) => `INR ${parseFloat(n || 0).toFixed(2)}`;

        // ── Header bar ────────────────────────────────────────────────────────
        doc.rect(0, 0, W, 85).fill(primary);

        doc.fontSize(24).fillColor('#ffffff').font('Helvetica-Bold')
            .text('MeterFlow', 50, 25);
        doc.fontSize(9).fillColor('#94a3b8').font('Helvetica')
            .text('API Billing Platform', 50, 52);

        doc.fontSize(26).fillColor('#ffffff').font('Helvetica-Bold')
            .text('INVOICE', 50, 25, { align: 'right', width: W - 100 });
        doc.fontSize(10).fillColor('#94a3b8').font('Helvetica')
            .text(billing.invoiceNumber || 'Pending', 50, 52, { align: 'right', width: W - 100 });

        // ── Billed To + Invoice Meta ──────────────────────────────────────────
        const metaTop = 110;
        const colLeft = 50;
        const colRight = 320;
        const colRightVal = 460;

        // Left column
        doc.fontSize(8).fillColor(muted).font('Helvetica-Bold')
            .text('BILLED TO', colLeft, metaTop);
        doc.fontSize(12).fillColor(primary).font('Helvetica-Bold')
            .text(user.username || 'N/A', colLeft, metaTop + 16);
        doc.fontSize(10).fillColor(muted).font('Helvetica')
            .text(user.email || '', colLeft, metaTop + 32);
        doc.fontSize(10).fillColor(muted)
            .text(`Plan: ${(billing.plan || 'free').charAt(0).toUpperCase() + (billing.plan || 'free').slice(1)}`, colLeft, metaTop + 48);

        // Right column — label + value side by side with enough space
        const metaRows = [
            ['Invoice Number', billing.invoiceNumber || '—'],
            ['Billing Period', billing.period || '—'],
            ['Issue Date', new Date(billing.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
            ['Due Date', billing.dueDate ? new Date(billing.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Immediate'],
            ['Status', billing.isPaid ? 'PAID' : 'PENDING'],
        ];

        metaRows.forEach(([label, value], i) => {
            const y = metaTop + i * 18;
            doc.fontSize(9).fillColor(muted).font('Helvetica')
                .text(label, colRight, y, { width: 110 });
            const isStatus = label === 'Status';
            doc.fontSize(9)
                .fillColor(isStatus && billing.isPaid ? '#16a34a' : isStatus ? '#dc2626' : primary)
                .font('Helvetica-Bold')
                .text(value, colRightVal, y, { width: W - colRightVal - 50 });
        });

        // ── Divider ───────────────────────────────────────────────────────────
        const tableTop = metaTop + 105;
        doc.moveTo(50, tableTop - 8).lineTo(W - 50, tableTop - 8)
            .strokeColor(border).lineWidth(1).stroke();

        // ── Table header ──────────────────────────────────────────────────────
        doc.rect(50, tableTop, W - 100, 22).fill(light);

        const col = {
            desc: 55,
            qty: 330,
            unit: 410,
            amt: 500,
        };

        doc.fontSize(8).fillColor(muted).font('Helvetica-Bold');
        doc.text('DESCRIPTION', col.desc, tableTop + 7, { width: 260 });
        doc.text('QTY', col.qty, tableTop + 7, { width: 70, align: 'center' });
        doc.text('UNIT PRICE', col.unit, tableTop + 7, { width: 80, align: 'right' });
        doc.text('AMOUNT', col.amt, tableTop + 7, { width: W - col.amt - 55, align: 'right' });

        // ── Table rows ────────────────────────────────────────────────────────
        const rows = [
            {
                desc: `${(billing.plan || 'free').charAt(0).toUpperCase() + (billing.plan || 'free').slice(1)} Plan — Monthly Subscription`,
                sub: `Includes ${(billing.includedRequests || 0).toLocaleString()} API requests`,
                qty: '1 month',
                unit: fmt(billing.planFee),
                amount: fmt(billing.planFee),
            },
        ];

        if ((billing.overageRequests || 0) > 0) {
            const unitPrice = billing.overageRequests > 0
                ? (billing.overageCost / billing.overageRequests).toFixed(4)
                : '0.0000';
            rows.push({
                desc: 'Overage Requests',
                sub: `${billing.overageRequests.toLocaleString()} requests beyond plan limit`,
                qty: `${billing.overageRequests.toLocaleString()} req`,
                unit: `INR ${unitPrice}`,
                amount: fmt(billing.overageCost),
            });
        }

        let rowY = tableTop + 28;
        rows.forEach((row, i) => {
            if (i % 2 === 1) {
                doc.rect(50, rowY - 4, W - 100, 34).fill('#fafafa');
            }
            doc.fontSize(9).fillColor(primary).font('Helvetica-Bold')
                .text(row.desc, col.desc, rowY, { width: 265 });
            doc.fontSize(8).fillColor(muted).font('Helvetica')
                .text(row.sub, col.desc, rowY + 13, { width: 265 });
            doc.fontSize(9).fillColor(primary).font('Helvetica')
                .text(row.qty, col.qty, rowY + 4, { width: 70, align: 'center' });
            doc.text(row.unit, col.unit, rowY + 4, { width: 80, align: 'right' });
            doc.font('Helvetica-Bold')
                .text(row.amount, col.amt, rowY + 4, { width: W - col.amt - 55, align: 'right' });
            rowY += 38;
        });

        // ── Totals ────────────────────────────────────────────────────────────
        doc.moveTo(50, rowY + 4).lineTo(W - 50, rowY + 4)
            .strokeColor(border).lineWidth(1).stroke();
        rowY += 14;

        const totals = [
            ['Subtotal', fmt(billing.totalCost)],
            ['GST (0%)', 'INR 0.00'],
        ];
        totals.forEach(([label, val]) => {
            doc.fontSize(9).fillColor(muted).font('Helvetica')
                .text(label, col.unit - 60, rowY, { width: 130, align: 'right' });
            doc.fillColor(primary)
                .text(val, col.amt, rowY, { width: W - col.amt - 55, align: 'right' });
            rowY += 17;
        });

        // Total box
        const totalBoxX = col.unit - 60;
        const totalBoxW = W - totalBoxX - 50;
        doc.rect(totalBoxX, rowY, totalBoxW, 28).fill(primary);
        doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold')
            .text('TOTAL', totalBoxX + 8, rowY + 8, { width: 100 });
        doc.text(fmt(billing.totalCost), totalBoxX, rowY + 8, { width: totalBoxW - 8, align: 'right' });
        rowY += 42;

        // ── PAID watermark ────────────────────────────────────────────────────
        if (billing.isPaid) {
            doc.save();
            doc.rotate(-25, { origin: [W / 2, rowY - 30] });
            doc.fontSize(60).fillColor('#16a34a').opacity(0.08).font('Helvetica-Bold')
                .text('PAID', W / 2 - 80, rowY - 80);
            doc.restore();
            doc.opacity(1);
        }

        // ── Notes ─────────────────────────────────────────────────────────────
        if (billing.isPaid && billing.paymentId) {
            doc.fontSize(8).fillColor(muted).font('Helvetica')
                .text(`Payment ID: ${billing.paymentId}`, 50, rowY, { width: W - 100 });
            rowY += 14;
        }

        // ── Footer ────────────────────────────────────────────────────────────
        const footerY = doc.page.height - 60;
        doc.moveTo(50, footerY - 8).lineTo(W - 50, footerY - 8)
            .strokeColor(border).lineWidth(1).stroke();
        doc.fontSize(8).fillColor(muted).font('Helvetica')
            .text('MeterFlow  |  support@meterflow.app  |  meterflow.app', 50, footerY, { align: 'center', width: W - 100 });
        doc.fontSize(7).fillColor('#94a3b8')
            .text('For billing queries contact support@meterflow.app', 50, footerY + 14, { align: 'center', width: W - 100 });

        doc.end();
    });
};

module.exports = { generateInvoicePDF };
