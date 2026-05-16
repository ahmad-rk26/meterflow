import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const SLIDES = [
    { tag: 'API Gateway', headline: 'Route every request through your own metered gateway.', sub: 'MeterFlow sits between your customers and your APIs — logging every call, enforcing limits, and calculating costs in real time.', stat: { label: 'Requests proxied today', value: '2.4M+' }, accent: 'from-sky-600 to-cyan-500', dot: 'bg-sky-400' },
    { tag: 'Usage Analytics', headline: 'Know exactly what your APIs are doing, right now.', sub: 'Live dashboards show response times, error rates, per-API breakdowns, and daily trends — no extra tooling needed.', stat: { label: 'Avg dashboard load', value: '< 200ms' }, accent: 'from-violet-600 to-purple-500', dot: 'bg-violet-400' },
    { tag: 'Automated Billing', headline: 'Invoices generated automatically. Payments collected instantly.', sub: 'On the 1st of every month, MeterFlow generates invoices for every customer — plan fee + overage — and lets them pay via Razorpay.', stat: { label: 'Payment success rate', value: '99.2%' }, accent: 'from-emerald-600 to-teal-500', dot: 'bg-emerald-400' },
    { tag: 'Plan Management', headline: 'Three plans. Clear limits. Zero surprises.', sub: 'Free, Basic, and Premium plans with hard request limits, per-API key controls, and instant Razorpay upgrades.', stat: { label: 'Plan upgrade time', value: '< 30s' }, accent: 'from-rose-600 to-pink-500', dot: 'bg-rose-400' },
];

const FEATURES = [
    { icon: '📡', title: 'Smart Proxy Gateway', desc: 'Every API call routes through MeterFlow. Logged, timed, and billed automatically.' },
    { icon: '⚡', title: 'Real-time Analytics', desc: 'Live request logs, response times, status codes, and daily breakdowns.' },
    { icon: '🔑', title: 'API Key Management', desc: 'Generate, revoke, and monitor keys per endpoint with one-click integration guides.' },
    { icon: '💳', title: 'Razorpay Billing', desc: 'Collect INR payments via UPI, cards, and netbanking. Auto-invoicing every month.' },
    { icon: '🛡️', title: 'Rate Limiting', desc: 'Per-plan request limits enforced at the gateway. Abuse blocked before it hits your server.' },
    { icon: '📊', title: 'Usage-based Pricing', desc: 'Charge per request. Free tier, flat plans, or pay-as-you-go — your choice.' },
];

const PLANS = [
    { name: 'Free', price: '₹0', tagline: 'Try it out, no card needed', color: 'border-slate-200 bg-white', btn: 'bg-slate-900 hover:bg-slate-700 text-white', badge: null, features: ['1,000 requests/month', '2 APIs', '3 API keys', 'Basic analytics', 'Community support'] },
    { name: 'Basic', price: '₹499', tagline: 'For indie devs & small teams', color: 'border-2 border-sky-500 bg-sky-50', btn: 'bg-sky-500 hover:bg-sky-400 text-white', badge: 'Most Popular', features: ['50,000 requests/month', '10 APIs', '25 API keys', 'Advanced analytics', 'Email support', '₹0.01/req after limit'] },
    { name: 'Premium', price: '₹1,999', tagline: 'For scaling SaaS products', color: 'border-slate-200 bg-white', btn: 'bg-slate-900 hover:bg-slate-700 text-white', badge: null, features: ['5,00,000 requests/month', '100 APIs', '500 API keys', 'Full analytics + export', 'Priority support + SLA', '₹0.005/req after limit'] },
];

const TESTIMONIALS = [
    { name: 'Arjun Mehta', role: 'Founder, DataPipe.io', text: 'MeterFlow cut our billing setup from weeks to a single afternoon. The proxy gateway just works.', avatar: 'AM' },
    { name: 'Priya Sharma', role: 'Backend Lead, Finstack', text: 'We moved 3 internal APIs to MeterFlow. Usage tracking is accurate and the Razorpay integration is seamless.', avatar: 'PS' },
    { name: 'Rohan Verma', role: 'CTO, APIBridge', text: 'The per-plan rate limiting saved us from a DDoS that would have cost thousands. Highly recommend.', avatar: 'RV' },
];

const CheckIcon = () => (
    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const HeroCarousel = () => {
    const [active, setActive] = useState(0);
    const timer = useRef(null);

    const go = (i) => {
        setActive(i);
        clearInterval(timer.current);
        timer.current = setInterval(() => setActive(p => (p + 1) % SLIDES.length), 5000);
    };

    useEffect(() => {
        timer.current = setInterval(() => setActive(p => (p + 1) % SLIDES.length), 5000);
        return () => clearInterval(timer.current);
    }, []);

    const s = SLIDES[active];

    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 py-24 text-white overflow-hidden">
            <div className="container mx-auto px-4 grid gap-12 lg:grid-cols-2 items-center">
                <div className="space-y-7">
                    <span className={`inline-flex rounded-full bg-gradient-to-r ${s.accent} px-4 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-lg`}>{s.tag}</span>
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl leading-tight">{s.headline}</h1>
                    <p className="max-w-xl text-slate-300 leading-relaxed text-lg">{s.sub}</p>
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Link to="/register" className="inline-flex items-center justify-center rounded-full bg-sky-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400">Start for Free</Link>
                        <Link to="/login" className="inline-flex items-center justify-center rounded-full border border-slate-600 px-7 py-3.5 text-base font-semibold text-slate-100 transition hover:border-slate-400">Sign In</Link>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        {SLIDES.map((_, i) => (
                            <button key={i} onClick={() => go(i)} className={`rounded-full transition-all duration-300 ${i === active ? `w-8 h-2.5 ${s.dot}` : 'w-2.5 h-2.5 bg-slate-600 hover:bg-slate-400'}`} />
                        ))}
                    </div>
                </div>
                <div className="relative">
                    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl space-y-4">
                        <div className={`rounded-2xl bg-gradient-to-br ${s.accent} p-6 shadow-xl`}>
                            <p className="text-xs uppercase tracking-widest text-white/70">{s.stat.label}</p>
                            <p className="mt-3 text-5xl font-bold text-white">{s.stat.value}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[{ l: 'APIs', v: '8' }, { l: 'Keys', v: '24' }, { l: 'Revenue', v: '₹4.2K' }].map(x => (
                                <div key={x.l} className="rounded-2xl bg-slate-950/80 p-4 text-center">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider">{x.l}</p>
                                    <p className="mt-2 text-xl font-semibold text-white">{x.v}</p>
                                </div>
                            ))}
                        </div>
                        <div className="rounded-2xl bg-slate-900/60 p-4 space-y-2">
                            {[['GET /v1/weather-api', '200', '142ms'], ['POST /v1/sms-api', '200', '89ms'], ['GET /v1/maps-api', '429', '12ms']].map(([ep, st, t]) => (
                                <div key={ep} className="flex items-center justify-between text-xs font-mono">
                                    <span className="text-slate-300 truncate">{ep}</span>
                                    <span className={`ml-3 font-bold ${st === '200' ? 'text-emerald-400' : 'text-amber-400'}`}>{st}</span>
                                    <span className="ml-3 text-slate-500">{t}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={`pointer-events-none absolute -right-16 top-10 h-64 w-64 rounded-full bg-gradient-to-br ${s.accent} opacity-20 blur-3xl transition-all duration-700`}></div>
                </div>
            </div>
        </div>
    );
};

const Landing = () => (
    <section className="relative overflow-hidden -mt-8 -mx-4">
        <HeroCarousel />

        {/* Stats bar */}
        <div className="bg-slate-900 py-10">
            <div className="container mx-auto px-4 grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
                {[{ l: 'API Requests Processed', v: '50M+' }, { l: 'Developers Using MeterFlow', v: '2,400+' }, { l: 'Avg Response Overhead', v: '< 5ms' }, { l: 'Payment Success Rate', v: '99.2%' }].map(s => (
                    <div key={s.l}><p className="text-3xl font-bold text-white">{s.v}</p><p className="text-slate-400 text-sm mt-1">{s.l}</p></div>
                ))}
            </div>
        </div>

        {/* Features */}
        <div className="container mx-auto px-4 py-20">
            <div className="text-center mb-14">
                <p className="text-xs uppercase tracking-widest text-sky-600 font-semibold mb-3">Platform Features</p>
                <h2 className="text-3xl font-bold text-slate-900">Everything you need to monetise APIs</h2>
                <p className="text-slate-500 mt-3 max-w-xl mx-auto">Built for developers who want to ship fast and bill accurately</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map(f => (
                    <div key={f.title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                        <div className="text-3xl mb-4">{f.icon}</div>
                        <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
                        <p className="mt-3 text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* How it works */}
        <div className="bg-slate-50 py-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-14">
                    <p className="text-xs uppercase tracking-widest text-sky-600 font-semibold mb-3">Quick Start</p>
                    <h2 className="text-3xl font-bold text-slate-900">Up and running in 5 minutes</h2>
                </div>
                <div className="relative max-w-4xl mx-auto">
                    <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-slate-200 z-0"></div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
                        {[
                            { step: '01', title: 'Register', desc: 'Create your free account. No credit card needed.', icon: '👤' },
                            { step: '02', title: 'Add your API', desc: 'Register your endpoint and set a cost per request.', icon: '🔌' },
                            { step: '03', title: 'Share the key', desc: 'Generate an API key and give it to your users.', icon: '🔑' },
                            { step: '04', title: 'Get paid', desc: 'Every request is tracked. Invoices auto-generated.', icon: '💰' },
                        ].map(s => (
                            <div key={s.step} className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-lg">
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white text-lg flex items-center justify-center mx-auto mb-4">{s.icon}</div>
                                <p className="text-xs text-slate-400 font-mono mb-1">{s.step}</p>
                                <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
                                <p className="text-slate-500 text-sm">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Pricing */}
        <div className="container mx-auto px-4 py-20">
            <div className="text-center mb-14">
                <p className="text-xs uppercase tracking-widest text-sky-600 font-semibold mb-3">Pricing</p>
                <h2 className="text-3xl font-bold text-slate-900">Simple, transparent pricing</h2>
                <p className="text-slate-500 mt-3 max-w-xl mx-auto">Start free. Upgrade when you need more. No hidden fees.</p>
            </div>
            <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto items-start">
                {PLANS.map(plan => (
                    <div key={plan.name} className={`rounded-3xl border p-8 shadow-xl relative ${plan.color}`}>
                        {plan.badge && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-sky-500 text-white px-5 py-1 rounded-full text-xs font-semibold">{plan.badge}</div>}
                        <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                        <p className="text-slate-500 text-sm mt-1 mb-5">{plan.tagline}</p>
                        <div className="flex items-end gap-1 mb-6">
                            <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                            <span className="text-slate-500 mb-1">/month</span>
                        </div>
                        <ul className="space-y-3 mb-8">
                            {plan.features.map(f => <li key={f} className="flex items-start gap-2 text-sm text-slate-600"><CheckIcon />{f}</li>)}
                        </ul>
                        <Link to="/register" className={`w-full inline-flex items-center justify-center rounded-full px-6 py-3 font-medium transition ${plan.btn}`}>
                            {plan.price === '₹0' ? 'Get Started Free' : 'Start Now'}
                        </Link>
                    </div>
                ))}
            </div>
            <p className="text-center text-slate-400 text-sm mt-8">All plans include a 7-day free trial. Cancel anytime.</p>
        </div>

        {/* Testimonials */}
        <div className="bg-slate-900 py-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-14">
                    <p className="text-xs uppercase tracking-widest text-sky-400 font-semibold mb-3">Testimonials</p>
                    <h2 className="text-3xl font-bold text-white">Trusted by developers</h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                    {TESTIMONIALS.map(t => (
                        <div key={t.name} className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{t.avatar}</div>
                                <div>
                                    <p className="font-semibold text-white text-sm">{t.name}</p>
                                    <p className="text-slate-400 text-xs">{t.role}</p>
                                </div>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed">"{t.text}"</p>
                            <div className="flex gap-1 mt-4">{[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-xs">★</span>)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* FAQ */}
        <div className="container mx-auto px-4 py-20 max-w-3xl">
            <div className="text-center mb-14">
                <p className="text-xs uppercase tracking-widest text-sky-600 font-semibold mb-3">FAQ</p>
                <h2 className="text-3xl font-bold text-slate-900">Common questions</h2>
            </div>
            <div className="space-y-4">
                {[
                    { q: 'How does the proxy work?', a: 'You register your API endpoint in MeterFlow. Your customers call our proxy URL with their API key. We forward the request, log it, and return the response — all in under 5ms overhead.' },
                    { q: 'When are invoices generated?', a: 'Automatically on the 1st of every month for the previous month. You can also manually generate invoices for past months from the Billing page.' },
                    { q: 'What payment methods are supported?', a: 'UPI, credit/debit cards, and netbanking via Razorpay. All payments are in INR.' },
                    { q: 'What happens when I hit my request limit?', a: "Requests are blocked with a 429 response. You'll see a warning at 80% usage. Upgrade your plan anytime to increase your limit instantly." },
                    { q: 'Can I downgrade my plan?', a: 'Yes. Downgrades take effect from the next billing cycle. If your current usage exceeds the new plan\'s limits, you\'ll be notified before the change applies.' },
                ].map(({ q, a }) => (
                    <details key={q} className="group rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-medium text-slate-900 list-none">
                            {q}
                            <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </summary>
                        <p className="px-6 pb-5 text-slate-500 text-sm leading-relaxed">{a}</p>
                    </details>
                ))}
            </div>
        </div>

        {/* Final CTA — different from hero */}
        <div className="bg-gradient-to-r from-sky-600 to-cyan-500 py-16">
            <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">Start metering your APIs today.</h2>
                    <p className="text-sky-100 mt-2">Free forever. No credit card. Upgrade when you're ready.</p>
                </div>
                <Link to="/register" className="flex-shrink-0 inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-sky-700 shadow-xl transition hover:bg-sky-50">
                    Create Free Account →
                </Link>
            </div>
        </div>
    </section>
);

export default Landing;
