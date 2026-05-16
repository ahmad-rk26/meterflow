import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';

const Usage = () => {
    const [page, setPage] = useState(1);
    const [liveCount, setLiveCount] = useState(null);
    const PAGE_SIZE = 20;
    const socket = useSocket();

    const { data: usage, isLoading: loadingUsage, refetch: refetchUsage } = useQuery({
        queryKey: ['usage'],
        queryFn: () => api.get('/api/usage').then(r => r.data)
    });

    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['usage-stats'],
        queryFn: () => api.get('/api/usage/stats').then(r => r.data)
    });

    const { data: current } = useQuery({
        queryKey: ['billing-current'],
        queryFn: () => api.get('/api/billing/current').then(r => r.data),
        refetchInterval: 30000,
    });

    // Real-time updates via socket
    useEffect(() => {
        if (!socket) return;
        const userId = localStorage.getItem('userId');
        if (userId) socket.emit('join', userId);
        socket.on('usage-update', (data) => {
            setLiveCount(data.monthlyCount);
            refetchUsage();
        });
        return () => socket.off('usage-update');
    }, [socket, refetchUsage]);

    const totalPages = Math.ceil((usage?.length ?? 0) / PAGE_SIZE);
    const paginatedUsage = usage?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [];
    const totalRequests = stats?.reduce((s, i) => s + i.requests, 0) ?? 0;
    const totalCost = stats?.reduce((s, i) => s + i.totalCost, 0) ?? 0;
    const avgResponse = stats?.length ? stats.reduce((s, i) => s + i.avgResponseTime, 0) / stats.length : 0;

    // Per-API breakdown
    const apiBreakdown = usage?.reduce((acc, u) => {
        const name = u.apiId?.name || 'Unknown';
        if (!acc[name]) acc[name] = { requests: 0, cost: 0, errors: 0 };
        acc[name].requests++;
        acc[name].cost += u.cost;
        if (u.statusCode >= 400) acc[name].errors++;
        return acc;
    }, {}) ?? {};

    const usagePct = current ? Math.min(100, current.usagePercent) : 0;
    const usageColor = usagePct >= 90 ? 'bg-red-500' : usagePct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
    const monthlyCount = liveCount ?? current?.totalRequests ?? 0;

    return (
        <div className="space-y-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Analytics</p>
                        <h1 className="text-3xl font-bold text-slate-900 mt-1">Usage</h1>
                        <p className="text-slate-500 mt-1">Live request tracking and performance analytics.</p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-sm text-slate-500">Live</span>
                    </div>
                </div>
            </div>

            {/* Current month meter */}
            {current && (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">This Month</h2>
                            <p className="text-sm text-slate-500 capitalize">{current.plan} plan · {current.period}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-slate-900">{monthlyCount.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">of {current.planDetails.requestLimit.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2">
                        <div className={`h-2.5 rounded-full transition-all duration-500 ${usageColor}`} style={{ width: `${usagePct}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>{usagePct}% used</span>
                        <span>{current.requestsRemaining.toLocaleString()} remaining</span>
                    </div>
                    {usagePct >= 80 && (
                        <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${usagePct >= 100 ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
                            {usagePct >= 100 ? '🚫 Limit reached — requests are being blocked. ' : `⚠️ ${usagePct}% used. `}
                            <Link to="/pricing" className="font-semibold underline">Upgrade your plan</Link>
                        </div>
                    )}
                </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-6 shadow-lg">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total Requests (30d)</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-800">{totalRequests.toLocaleString()}</p>
                </div>
                <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-rose-50 to-white p-6 shadow-lg">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total Cost (30d)</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-800">₹{totalCost.toFixed(2)}</p>
                </div>
                <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-violet-50 to-white p-6 shadow-lg">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Avg Response</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-800">{avgResponse.toFixed(0)}ms</p>
                </div>
            </div>

            {/* Per-API breakdown */}
            {Object.keys(apiBreakdown).length > 0 && (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                    <h2 className="text-xl font-semibold mb-6">Per-API Breakdown</h2>
                    <div className="space-y-3">
                        {Object.entries(apiBreakdown).sort((a, b) => b[1].requests - a[1].requests).map(([name, data]) => {
                            const errorRate = data.requests > 0 ? Math.round((data.errors / data.requests) * 100) : 0;
                            const pct = totalRequests > 0 ? Math.round((data.requests / totalRequests) * 100) : 0;
                            return (
                                <div key={name} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-slate-800">{name}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span>{data.requests.toLocaleString()} reqs</span>
                                            <span>₹{data.cost.toFixed(2)}</span>
                                            {errorRate > 0 && <span className="text-red-500">{errorRate}% errors</span>}
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                                        <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Daily stats */}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                <h2 className="text-xl font-semibold mb-6">Daily Breakdown (Last 30 days)</h2>
                {loadingStats ? <div className="text-center py-8 text-slate-400">Loading...</div> :
                    !stats?.length ? (
                        <div className="text-center py-8 text-slate-400"><p className="text-4xl mb-3">📊</p><p className="text-sm">No stats yet.</p></div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {stats.map(stat => (
                                <div key={stat._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <p className="font-semibold text-slate-800 text-sm">{stat._id}</p>
                                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-500">
                                        <div><p className="font-medium text-slate-700">{stat.requests}</p><p>requests</p></div>
                                        <div><p className="font-medium text-slate-700">₹{stat.totalCost.toFixed(2)}</p><p>cost</p></div>
                                        <div><p className="font-medium text-slate-700">{stat.avgResponseTime.toFixed(0)}ms</p><p>avg</p></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
            </div>

            {/* Request log */}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                <h2 className="text-xl font-semibold mb-6">Request Log</h2>
                {loadingUsage ? <div className="text-center py-8 text-slate-400">Loading...</div> :
                    !paginatedUsage.length ? (
                        <div className="text-center py-8 text-slate-400"><p className="text-4xl mb-3">📭</p><p className="text-sm">No requests yet.</p></div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full table-auto text-sm">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            {['API', 'Timestamp', 'Response', 'Status', 'Cost'].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedUsage.map(item => (
                                            <tr key={item._id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                                                <td className="px-4 py-3 font-medium text-slate-800">{item.apiId?.name ?? '—'}</td>
                                                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(item.timestamp).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-slate-600">{item.responseTime}ms</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.statusCode < 300 ? 'bg-emerald-100 text-emerald-700' : item.statusCode < 400 ? 'bg-sky-100 text-sky-700' : 'bg-red-100 text-red-700'}`}>
                                                        {item.statusCode}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">₹{item.cost}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                                    <p className="text-sm text-slate-500">Page {page} of {totalPages} · {usage.length} total</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition">Previous</button>
                                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition">Next</button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
            </div>
        </div>
    );
};

export default Usage;
