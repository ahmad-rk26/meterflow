import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-slate-950 text-slate-300 py-12">
            <div className="container mx-auto px-4 grid gap-10 lg:grid-cols-3">
                <div>
                    <h3 className="text-2xl font-semibold text-white mb-3">MeterFlow</h3>
                    <p className="max-w-sm leading-relaxed text-slate-400">
                        Modern usage-based billing for APIs. Built to make metering, reporting, and billing seamless for developers and SaaS teams.
                    </p>
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Product</h4>
                    <ul className="space-y-3 text-slate-400">
                        <li><Link to="/" className="transition hover:text-white">Overview</Link></li>
                        <li><Link to="/login" className="transition hover:text-white">Login</Link></li>
                        <li><Link to="/register" className="transition hover:text-white">Register</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Developer</h4>
                    <ul className="space-y-2 text-slate-400">
                        <li className="font-medium text-white">Ahmad Raza Khan</li>
                        <li>Full Stack Developer</li>
                        <li>Beusarai, Bihar, India — 851211</li>
                        <li>
                            <a href="mailto:razakhanahmad68@gmail.com" className="transition hover:text-white">
                                razakhanahmad68@gmail.com
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="mt-12 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
                © {new Date().getFullYear()} MeterFlow. Built by Ahmad Raza Khan. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
