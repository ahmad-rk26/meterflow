import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { clearAuth } from '../services/api';

const Navbar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const checkAuth = useCallback(() => {
        const token = localStorage.getItem('token');
        const expiry = localStorage.getItem('tokenExpiry');
        if (!token) { setIsLoggedIn(false); return; }
        // Expired client-side
        if (expiry && Date.now() > parseInt(expiry)) {
            clearAuth();
            setIsLoggedIn(false);
            return;
        }
        setIsLoggedIn(true);
    }, []);

    // Check on every route change
    useEffect(() => {
        checkAuth();
        setIsMenuOpen(false);
    }, [location.pathname, checkAuth]);

    // Cross-tab sync
    useEffect(() => {
        const onStorage = () => checkAuth();
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [checkAuth]);

    const handleLogout = useCallback(() => {
        clearAuth();
        setIsLoggedIn(false);
        setIsMenuOpen(false);
        navigate('/login');
    }, [navigate]);

    return (
        <nav className="bg-slate-950 text-white shadow-xl shadow-slate-900/20 sticky top-0 z-50">
            <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
                <Link to="/" className="flex items-center gap-2 text-xl font-semibold uppercase tracking-[0.2em] text-slate-100">
                    <span className="inline-block h-8 w-8 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 shadow-lg shadow-sky-500/20"></span>
                    MeterFlow
                </Link>

                <button className="lg:hidden text-slate-200 hover:text-white" onClick={() => setIsMenuOpen(o => !o)} aria-label="Toggle menu">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                    </svg>
                </button>

                <div className={`w-full lg:w-auto ${isMenuOpen ? 'block' : 'hidden'} lg:block`}>
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3 text-sm font-medium text-slate-200 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                        {isLoggedIn ? (
                            <>
                                <Link to="/dashboard" className="transition hover:text-white px-1">Dashboard</Link>
                                <Link to="/apis" className="transition hover:text-white px-1">APIs</Link>
                                <Link to="/keys" className="transition hover:text-white px-1">API Keys</Link>
                                <Link to="/usage" className="transition hover:text-white px-1">Usage</Link>
                                <Link to="/billing" className="transition hover:text-white px-1">Billing</Link>
                                <Link to="/pricing" className="transition hover:text-white px-1">Plans</Link>
                                <button onClick={handleLogout} className="rounded-full border border-slate-700 px-4 py-2 text-slate-200 transition hover:border-slate-400 hover:text-white">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="rounded-full border border-slate-700 px-4 py-2 transition hover:border-slate-400 hover:text-white">Login</Link>
                                <Link to="/register" className="rounded-full bg-sky-500 px-4 py-2 text-white transition hover:bg-sky-400">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
