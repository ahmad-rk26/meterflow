import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Billing = () => {
    const [period, setPeriod] = useState('');
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    const [error, setError] = useState('');
    const queryClient = useQueryClient();

    useEffect(() => {
        if (window.Razorpay) { setRazorpayLoaded(true); return; }
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.async = true;
        s.onload = () => setRazorpayLoaded(true);
        document.head.appendChild(s);
    }, []);

    const { data: billing, isLoading } = useQuery({
        queryKey: ['billing'],
        queryFn: () => api.get('/api/billing').then(r => r.data)
    });

    const { data: current } = useQuery({
        queryKey: ['billing-current'],
        queryFn: () => api.get('/api/billing/current').then(r => r.data),
        refetchInterval: 30000,
    });

    const generateMutation = useMutation({
        mutationFn: (data) => api.post('/api/billing/generate', data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['billing'] }); setPeriod(''); setError(''); },
        onError: (err) => setError(err.response?.data?.message || 'Failed to generate report')
    });

    const createOrderMutation = useMutation({
        mutationFn: (data) => api.post('/api/billing/create-order', data)
    });

    const verifyPaymentMutation = useMutation({
        mutationFn: (data) => api.post('/api/billing/verify-payment', data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['billing'] }); }
    });

    const downloadPDF = async (item) => {
        try {
            const response = await api.get(`/api/billing/${item._id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `${item.invoiceNumber || 'invoice'}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch {
            setError('Failed to download PDF');
        }
    };

    const handlePayment = async (item) => {
        if (!razorpayLoaded) { setError('Razorpay is loading. Try again.'); return; }
        setError('');
        try {
            const orderRes = await createOrderMutation.mutateAsync({ billingId: item._id });
            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID,
                amount: orderRes.data.amount,
                currency: orderRes.data.currency,
                name: 'MeterFlow',
                description: `Invoice ${item.invoiceNumber || ''} — ${item.period}`,
                order_id: orderRes.data.orderId,
                handler: async (response) => {
                    try {
                        await verifyPaymentMutation.mutateAsync({
                            orderId: response.razorpay_order_id,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                            billingId: item._id
                        });
                    } catch { setError('Payment verification failed. Contact support.'); }
                },
                prefill: { email: localStorage.getItem('userEmail') || '' },
                theme: { color: '#0f172a' }
            };
            new window.Razorpay(options).open();
        } catch (err) {
            setError(err.response?.data?.message || 'Error creating payment order');
        }
    };

    const totalPaid = billing?.filter(b => b.isPaid).reduce((s, b) => s + b.totalCost, 0) ?? 0;
    const totalPending = billing?.filter(b => !b.isPaid).reduce((s, b) => s + b.totalCost, 0) ?? 0;
    const usagePct = current ? Math.min(100, current.usagePercent) : 0;
    const usageColor = usagePct >= 90 ? 'bg-red-500' : usagePct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';

    return (
        <div className="space-y-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Payments</p>
                        <h1 className="text-3xl font-bold text-slate-900 mt-1">Billing</h1>
                        <p className="text-slate-500 mt-1">Invoices are auto-generated on the 1st of each month.</p>
                    </div>
                    <Link to="/pricing" className="self-start sm:self-auto inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition font-medium">
                        Manage Plan →
                    </Link>
                </div>
            </div>

            {/* Current month meter */}
            {current && (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Current Month Usage</h2>
                            <p className="text-sm text-slate-500 mt-0.5 capitalize">{current.plan} plan · {current.period} · updates live</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-slate-900">{current.totalRequests.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">of {current.planDetails.requestLimit.toLocaleString()} requests</p>
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 mb-3">
                        <div className={`h-3 rounded-full transition-all ${usageColor}`} style={{ width: `${usagePct}%` }}></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{usagePct}% used</span>
                        <span>{current.requestsRemaining.toLocaleString()} remaining</span>
                    </div>
                    {current.overageRequests > 0 && (
                        <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                            ⚠️ {current.overageRequests.toLocaleString()} overage requests · ₹{current.overageCost?.toFixed(2)} extra charge
                        </div>
                    )}
                    {usagePct >= 80 && usagePct < 100 && (
                        <div className="mt-3 rounded-2xl bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-700">
                            You've used {usagePct}% of your monthly limit.{' '}
                            <Link to="/pricing" className="font-semibold underline">Upgrade your plan</Link> to avoid interruptions.
                        </div>
                    )}
                    {usagePct >= 100 && (
                        <div className="mt-3 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                            Monthly limit reached. New requests are being blocked.{' '}
                            <Link to="/pricing" className="font-semibold underline">Upgrade now</Link>
                        </div>
                    )}
                    {/* Estimated invoice */}
                    <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Plan Fee</p>
                            <p className="font-semibold text-slate-800 mt-1">₹{current.planFee}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Overage</p>
                            <p className="font-semibold text-slate-800 mt-1">₹{(current.overageCost || 0).toFixed(2)}</p>
                        </div>
                        <div className="rounded-2xl bg-sky-50 p-3">
                            <p className="text-xs text-sky-600">Est. Invoice</p>
                            <p className="font-semibold text-sky-700 mt-1">₹{current.totalCost.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-lg">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total Paid</p>
                    <p className="mt-3 text-3xl font-semibold text-emerald-700">₹{totalPaid.toFixed(2)}</p>
                </div>
                <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-lg">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pending</p>
                    <p className="mt-3 text-3xl font-semibold text-amber-700">₹{totalPending.toFixed(2)}</p>
                </div>
            </div>

            {error && <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

            {/* Manual generate */}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                <h2 className="text-xl font-semibold mb-2">Generate Invoice</h2>
                <p className="text-slate-500 text-sm mb-5">
                    Invoices auto-generate on the 1st of each month for the previous month. Use this to manually generate one for any <strong>past</strong> month.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                    <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
                        max={(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; })()}
                        className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition" />
                    <button onClick={() => period && generateMutation.mutate({ period })} disabled={!period || generateMutation.isPending}
                        className="rounded-full bg-slate-900 px-8 py-3 text-white font-medium transition hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap">
                        {generateMutation.isPending ? 'Generating...' : 'Generate Invoice'}
                    </button>
                </div>
            </div>

            {/* Billing history */}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                <h2 className="text-xl font-semibold mb-6">Invoice History</h2>
                {isLoading ? (
                    <div className="text-center py-8 text-slate-400">Loading...</div>
                ) : !billing?.length ? (
                    <div className="text-center py-8 text-slate-400">
                        <p className="text-4xl mb-3">💳</p>
                        <p className="text-sm">No invoices yet. They'll appear here automatically each month.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto text-sm">
                            <thead>
                                <tr className="bg-slate-50">
                                    {['Invoice #', 'Period', 'Plan', 'Requests', 'Plan Fee', 'Overage', 'Total', 'Due Date', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {billing.map(item => (
                                    <tr key={item._id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                                        <td className="px-4 py-4 font-mono text-xs text-slate-600">{item.invoiceNumber || '—'}</td>
                                        <td className="px-4 py-4 font-medium text-slate-800">{item.period}</td>
                                        <td className="px-4 py-4 capitalize text-slate-600">{item.plan || '—'}</td>
                                        <td className="px-4 py-4 text-slate-600">{item.totalRequests.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-slate-600">₹{(item.planFee || 0).toFixed(2)}</td>
                                        <td className="px-4 py-4 text-slate-600">₹{(item.overageCost || 0).toFixed(2)}</td>
                                        <td className="px-4 py-4 font-semibold text-slate-800">₹{item.totalCost.toFixed(2)}</td>
                                        <td className="px-4 py-4 text-slate-500 text-xs">{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—'}</td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.isPaid ? 'bg-emerald-100 text-emerald-700' : new Date(item.dueDate) < new Date() ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {item.isPaid ? 'Paid' : new Date(item.dueDate) < new Date() ? 'Overdue' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                {!item.isPaid && item.totalCost > 0 && (
                                                    <button onClick={() => handlePayment(item)}
                                                        disabled={createOrderMutation.isPending}
                                                        className="rounded-full bg-sky-500 px-3 py-1.5 text-xs text-white font-medium hover:bg-sky-400 disabled:opacity-50 transition whitespace-nowrap">
                                                        Pay Now
                                                    </button>
                                                )}
                                                <button onClick={() => downloadPDF(item)}
                                                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition whitespace-nowrap">
                                                    PDF ↓
                                                </button>
                                                {item.isPaid && item.paidAt && (
                                                    <span className="text-xs text-slate-400">{new Date(item.paidAt).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Billing;
