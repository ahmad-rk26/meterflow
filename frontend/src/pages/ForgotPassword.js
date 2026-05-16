import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const navigate = useNavigate();

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
        setLoading(true);
        try {
            await api.post('/api/auth/send-forgot-otp', { email });
            setStep(2);
            startCooldown();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        if (otp.length !== 6) { setError('Enter the 6-digit OTP.'); return; }
        setLoading(true);
        try {
            await api.post('/api/auth/verify-forgot-otp', { email, otp });
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired OTP.');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: reset password
    const handleReset = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
        setLoading(true);
        try {
            await api.post('/api/auth/reset-password', { email, otp, newPassword });
            navigate('/login', { state: { message: 'Password reset successfully. Please sign in.' } });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setError('');
        setLoading(true);
        try {
            await api.post('/api/auth/send-forgot-otp', { email });
            startCooldown();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setLoading(false);
        }
    };

    const stepTitles = ['Enter your email', 'Verify your email', 'Set new password'];
    const stepSubs = [
        "We'll send a reset code to your email",
        `We sent a 6-digit code to ${email}`,
        'Choose a strong new password'
    ];

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md">
                {/* Progress */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map(s => (
                        <React.Fragment key={s}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step > s ? 'bg-sky-500 text-white' : step === s ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                {step > s ? '✓' : s}
                            </div>
                            {s < 3 && <div className={`h-px w-10 transition-all ${step > s ? 'bg-sky-500' : 'bg-slate-200'}`} />}
                        </React.Fragment>
                    ))}
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-xl shadow-slate-900/5">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-900">{stepTitles[step - 1]}</h1>
                        <p className="text-slate-500 mt-1 text-sm">{stepSubs[step - 1]}</p>
                    </div>

                    {error && (
                        <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
                    )}

                    {step === 1 && (
                        <form onSubmit={handleSendOtp} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition" required />
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full rounded-full bg-slate-900 py-3 text-white font-medium transition hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed">
                                {loading ? 'Sending...' : 'Send Reset Code'}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleVerifyOtp} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Verification Code</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    maxLength={6}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 text-center text-2xl tracking-[0.5em] placeholder-slate-300 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition"
                                    required
                                />
                            </div>
                            <button type="submit" disabled={loading || otp.length !== 6}
                                className="w-full rounded-full bg-slate-900 py-3 text-white font-medium transition hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed">
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </button>
                            <p className="text-center text-sm text-slate-500">
                                Didn't receive it?{' '}
                                <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || loading}
                                    className="text-sky-600 hover:text-sky-500 font-medium disabled:text-slate-400 disabled:cursor-not-allowed">
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                                </button>
                            </p>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleReset} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition" required />
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full rounded-full bg-slate-900 py-3 text-white font-medium transition hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed">
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    )}

                    <p className="text-center mt-6 text-sm text-slate-500">
                        Remember your password?{' '}
                        <Link to="/login" className="text-sky-600 hover:text-sky-500 font-medium">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
