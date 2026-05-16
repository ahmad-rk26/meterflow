import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';

const StatCard = ({ label, value, color, icon }) => (
    <div className={`rounded-[1.75rem] border border-slate-200 bg-gradient-to-br ${color} p-6 shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm uppercase tracking-[0.18em] text-slate-500">{label}</h3>
            <span className="text-2xl">{icon}</span>
        </div>
        <p className="text-4xl font-semibold text-slate-800">{value}</p>
    </div>
);

const RecentKeyRow = ({ apiKey: k }) => {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(k.key);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 gap-3">
            <div className="min-w-0">
                <p className="font-medium text-slate-800 text-sm truncate">{k.apiId?.name ?? '—'}</p>
                <p className="font-mono text-xs text-slate-400 truncate mt-0.5">{k.key.slice(0, 20)}…</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${k.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {k.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={copy} className="text-xs text-sky-600 hover:text-sky-500 font-medium">
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const username = localStorage.getItem('username') || 'there';
    const [stats, setStats] = useState({ totalApis: 0, totalKeys: 0, totalUsage: 0, totalBilling: '0.00' });

    const { data: apis } = useQuery({ queryKey: ['apis'], queryFn: () => api.get('/api/apis').then(r => r.data) });
    const { data: keys } = useQuery({ queryKey: ['keys'], queryFn: () => api.get('/api/keys').then(r => r.data) });
    const { data: usageStats } = useQuery({ queryKey: ['usage-stats'], queryFn: () => api.get('/api/usage/stats').then(r => r.data) });
    const { data: billing } = useQuery({ queryKey: ['billing'], queryFn: () => api.get('/api/billing').then(r => r.data) });

    useEffect(() => {
        const totalUsage = usageStats?.reduce((sum, s) => sum + s.requests, 0) ?? 0;
        const totalBilling = billing?.reduce((sum, b) => sum + b.totalCost, 0) ?? 0;
        setStats({
            totalApis: apis?.length ?? 0,
            totalKeys: keys?.length ?? 0,
            totalUsage,
            totalBilling: totalBilling.toFixed(2)
        });
    }, [apis, keys, usageStats, billing]);

    const recentStats = usageStats?.slice(0, 5) ?? [];

    return (
        <div className="space-y-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Overview</p>
                        <h1 className="text-3xl font-bold text-slate-900 mt-1">Hello, {username}</h1>
                        <p className="text-slate-500 mt-1">Here's what's happening with your APIs today.</p>
                    </div>
                    <Link to="/apis" className="self-start sm:self-auto inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700">
                        + New API
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total APIs" value={stats.totalApis} color="from-sky-50 to-white" icon="🔌" />
                <StatCard label="API Keys" value={stats.totalKeys} color="from-emerald-50 to-white" icon="🔑" />
                <StatCard label="Total Requests" value={stats.totalUsage.toLocaleString()} color="from-violet-50 to-white" icon="📊" />
                <StatCard label="Total Billed" value={`₹${stats.totalBilling}`} color="from-rose-50 to-white" icon="💳" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-slate-900">Recent Usage</h2>
                        <Link to="/usage" className="text-sm text-sky-600 hover:text-sky-500 font-medium">View all</Link>
                    </div>
                    {recentStats.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <p className="text-4xl mb-3">📭</p>
                            <p className="text-sm">No usage data yet. Make API calls to see stats here.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentStats.map(stat => (
                                <div key={stat._id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                    <div>
                                        <p className="font-medium text-slate-800 text-sm">{stat._id}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{stat.requests} requests · {stat.avgResponseTime?.toFixed(0)}ms avg</p>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">₹{stat.totalCost?.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-slate-900">Recent API Keys</h2>
                        <Link to="/keys" className="text-sm text-sky-600 hover:text-sky-500 font-medium">Manage keys</Link>
                    </div>
                    {!keys || keys.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <p className="text-4xl mb-3">🔑</p>
                            <p className="text-sm">No API keys yet.</p>
                            <Link to="/keys" className="mt-3 inline-block text-sm text-sky-600 hover:text-sky-500 font-medium">Generate your first key →</Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {keys.slice(0, 3).map(k => (
                                <RecentKeyRow key={k._id} apiKey={k} />
                            ))}
                            {keys.length > 3 && (
                                <p className="text-xs text-slate-400 text-center pt-1">+{keys.length - 3} more keys</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
