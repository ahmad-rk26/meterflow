import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { setAuth } from '../services/api';

const Register = () => {
    const [step, setStep] = useState(1); // 1=form, 2=otp
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const startCooldown = () => {
        setResendCooldown(60);
        const t = setInterval(() => {
            setResendCooldown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
        }, 1000);
    };

    // Step 1: send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setLoading(true);
        try {
            await api.post('/api/auth/send-register-otp', { email: formData.email });
            setStep(2);
            startCooldown();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: verify OTP and register
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        if (otp.length !== 6) { setError('Enter the 6-digit OTP.'); return; }
        setLoading(true);
        try {
            const response = await api.post('/api/auth/register', { ...formData, otp });
            setAuth(response.data.token, response.data.user);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setError('');
        setLoading(true);
        try {
            await api.post('/api/auth/send-register-otp', { email: formData.email });
            startCooldown();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-900 to-slate-900 items-center justify-center p-12">
                <div className="max-w-md text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-white">Join MeterFlow</h2>
                    <p className="text-slate-400 leading-relaxed">
                        Start building your API monetization strategy with powerful billing, analytics, and key management tools.
                    </p>
                    {/* Steps indicator */}
                    <div className="flex items-center justify-center gap-3 pt-2">
                        {['Details', 'Verify Email'].map((label, i) => (
                            <div key={label} className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step > i + 1 ? 'bg-emerald-500 text-white' : step === i + 1 ? 'bg-white text-slate-900' : 'bg-white/10 text-slate-400'}`}>
                                    {step > i + 1 ? '✓' : i + 1}
                                </div>
                                <span className={`text-sm ${step === i + 1 ? 'text-white' : 'text-slate-500'}`}>{label}</span>
                                {i < 1 && <div className="w-8 h-px bg-slate-600 mx-1" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    {step === 1 ? (
                        <>
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-slate-900">Create account</h1>
                                <p className="text-slate-500 mt-2">We'll send a verification code to your email</p>
                            </div>
                            {error && <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
                            <form onSubmit={handleSendOtp} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                                    <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="johndoe"
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com"
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min. 6 characters"
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition" required />
                                </div>
                                <button type="submit" disabled={loading}
                                    className="w-full rounded-full bg-slate-900 py-3 text-white font-medium transition hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed">
                                    {loading ? 'Sending OTP...' : 'Continue'}
                                </button>
                            </form>
                            <p className="text-center mt-6 text-slate-500 text-sm">
                                Already have an account?{' '}
                                <Link to="/login" className="text-emerald-600 hover:text-emerald-500 font-medium">Sign in</Link>
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="mb-8">
                                <button onClick={() => { setStep(1); setOtp(''); setError(''); }} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4">
                                    ← Back
                                </button>
                                <h1 className="text-3xl font-bold text-slate-900">Verify your email</h1>
                                <p className="text-slate-500 mt-2">
                                    We sent a 6-digit code to <span className="font-medium text-slate-700">{formData.email}</span>
                                </p>
                            </div>
                            {error && <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
                            <form onSubmit={handleVerifyOtp} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Verification Code</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        maxLength={6}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 text-center text-2xl tracking-[0.5em] placeholder-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={loading || otp.length !== 6}
                                    className="w-full rounded-full bg-slate-900 py-3 text-white font-medium transition hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed">
                                    {loading ? 'Verifying...' : 'Create Account'}
                                </button>
                            </form>
                            <p className="text-center mt-5 text-sm text-slate-500">
                                Didn't receive it?{' '}
                                <button onClick={handleResend} disabled={resendCooldown > 0 || loading}
                                    className="text-emerald-600 hover:text-emerald-500 font-medium disabled:text-slate-400 disabled:cursor-not-allowed">
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                                </button>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
