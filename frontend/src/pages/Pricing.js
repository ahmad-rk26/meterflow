import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const PLAN_META = {
    free: { color: 'border-slate-200 bg-white', btn: 'bg-slate-900 hover:bg-slate-700 text-white', badge: null },
    basic: { color: 'border-2 border-sky-500 bg-sky-50', btn: 'bg-sky-500 hover:bg-sky-400 text-white', badge: 'Most Popular' },
    premium: { color: 'border-slate-200 bg-white', btn: 'bg-slate-900 hover:bg-slate-700 text-white', badge: null },
};

const CheckIcon = () => (
    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const Pricing = () => {
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    const [upgrading, setUpgrading] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (window.Razorpay) { setRazorpayLoaded(true); return; }
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.async = true;
        s.onload = () => setRazorpayLoaded(true);
        document.head.appendChild(s);
    }, []);

    const { data: plans } = useQuery({
        queryKey: ['plans'],
        queryFn: () => api.get('/api/plans').then(r => r.data)
    });

    const { data: authData } = useQuery({
        queryKey: ['auth-verify'],
        queryFn: () => api.get('/api/auth/verify').then(r => r.data)
    });

    const currentPlan = authData?.plan || 'free';

    const handleUpgrade = async (planKey) => {
        if (planKey === 'free' || planKey === currentPlan) return;
        if (!razorpayLoaded) { setMessage('Razorpay is loading, try again.'); return; }
        setUpgrading(planKey);
        setMessage('');
        try {
            const orderRes = await api.post('/api/plans/upgrade-order', { plan: planKey });
            const { orderId, amount, currency } = orderRes.data;
            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID,
                amount,
                currency,
                name: 'MeterFlow',
                description: `Upgrade to ${planKey} plan`,
                order_id: orderId,
                handler: async (response) => {
                    try {
                        await api.post('/api/plans/verify-upgrade', {
                            orderId: response.razorpay_order_id,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                            plan: planKey,
                        });
                        setMessage(`Successfully upgraded to ${planKey} plan!`);
                        window.location.reload();
                    } catch {
                        setMessage('Payment verification failed. Contact support.');
                    }
                },
                prefill: { email: localStorage.getItem('userEmail') || '' },
                theme: { color: '#0f172a' },
            };
            new window.Razorpay(options).open();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error creating order');
        } finally {
            setUpgrading(null);
        }
    };

    const planEntries = plans ? Object.entries(plans) : [];

    const featureLabels = {
        requestLimit: (v) => `${v.toLocaleString()} requests/month`,
        apiLimit: (v) => `${v} APIs`,
        keyLimit: (v) => `${v} API keys`,
        support: (v) => v,
        costPerRequest: (v) => v > 0 ? `₹${v}/request after limit` : 'No per-request charge',
    };

    return (
        <div className="space-y-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Subscription</p>
                        <h1 className="text-3xl font-bold text-slate-900 mt-1">Plans & Pricing</h1>
                        <p className="text-slate-500 mt-1">
                            Current plan: <span className="font-semibold text-slate-800 capitalize">{currentPlan}</span>
                        </p>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`rounded-2xl px-5 py-3 text-sm font-medium ${message.includes('Success') ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                    {message}
                </div>
            )}

            <div className="grid gap-8 lg:grid-cols-3 items-start">
                {planEntries.map(([key, plan]) => {
                    const meta = PLAN_META[key] || PLAN_META.free;
                    const isCurrent = key === currentPlan;
                    const isFree = key === 'free';
                    return (
                        <div key={key} className={`rounded-3xl border p-8 shadow-xl relative ${meta.color}`}>
                            {meta.badge && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-sky-500 text-white px-5 py-1 rounded-full text-xs font-semibold">
                                    {meta.badge}
                                </div>
                            )}
                            {isCurrent && (
                                <div className="absolute -top-4 right-6 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-semibold">
                                    Current Plan
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                            <div className="flex items-end gap-1 mt-3 mb-6">
                                <span className="text-4xl font-bold text-slate-900">₹{plan.price}</span>
                                <span className="text-slate-500 mb-1">/month</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                {Object.entries(featureLabels).map(([field, fmt]) => (
                                    plan[field] !== undefined && (
                                        <li key={field} className="flex items-start gap-2 text-sm text-slate-600">
                                            <CheckIcon />
                                            {fmt(plan[field])}
                                        </li>
                                    )
                                ))}
                            </ul>
                            <button
                                onClick={() => handleUpgrade(key)}
                                disabled={isCurrent || isFree || upgrading === key}
                                className={`w-full rounded-full px-6 py-3 font-medium transition ${meta.btn} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isCurrent ? 'Current Plan' : isFree ? 'Free Forever' : upgrading === key ? 'Processing...' : `Upgrade to ${plan.name}`}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                <h2 className="text-xl font-semibold mb-4">Plan Comparison</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500 font-semibold">Feature</th>
                                <th className="px-4 py-3 text-center text-xs uppercase tracking-wider text-slate-500 font-semibold">Free</th>
                                <th className="px-4 py-3 text-center text-xs uppercase tracking-wider text-sky-600 font-semibold">Basic</th>
                                <th className="px-4 py-3 text-center text-xs uppercase tracking-wider text-slate-500 font-semibold">Premium</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ['Monthly Price', '₹0', '₹499', '₹1,999'],
                                ['Requests/month', '1,000', '50,000', '5,00,000'],
                                ['APIs', '2', '10', '100'],
                                ['API Keys', '3', '25', '500'],
                                ['Cost after limit', '—', '₹0.01/req', '₹0.005/req'],
                                ['Analytics', 'Basic', 'Advanced', 'Full + Export'],
                                ['Support', 'Community', 'Email', 'Priority + SLA'],
                                ['Razorpay Billing', '✓', '✓', '✓'],
                            ].map(([feature, ...vals]) => (
                                <tr key={feature} className="border-t border-slate-100">
                                    <td className="px-4 py-3 font-medium text-slate-700">{feature}</td>
                                    {vals.map((v, i) => (
                                        <td key={i} className={`px-4 py-3 text-center ${i === 1 ? 'text-sky-700 font-medium' : 'text-slate-600'}`}>{v}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
