import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

const EMPTY_FORM = { name: '', description: '', endpoint: '', method: 'GET', rateLimit: 100, costPerRequest: 0.01 };

const Apis = () => {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [error, setError] = useState('');
    const queryClient = useQueryClient();

    const { data: apis, isLoading } = useQuery({
        queryKey: ['apis'],
        queryFn: () => api.get('/api/apis').then(r => r.data)
    });

    const createMutation = useMutation({
        mutationFn: (newApi) => api.post('/api/apis', newApi),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['apis'] });
            setFormData(EMPTY_FORM);
            setError('');
        },
        onError: (err) => setError(err.response?.data?.message || 'Failed to create API')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/apis/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apis'] })
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="space-y-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Management</p>
                        <h1 className="text-3xl font-bold text-slate-900 mt-1">APIs</h1>
                        <p className="text-slate-500 mt-1">Create and manage your API endpoints.</p>
                    </div>
                    <div className="self-start sm:self-auto rounded-full bg-slate-100 px-5 py-2.5 text-sm text-slate-600 font-medium">
                        {apis?.length ?? 0} APIs
                    </div>
                </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                <h2 className="text-xl font-semibold mb-6">Create New API</h2>
                {error && (
                    <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input type="text" name="name" placeholder="API Name" value={formData.name} onChange={handleChange}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition" required />
                    <input type="text" name="description" placeholder="Description (optional)" value={formData.description} onChange={handleChange}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition" />
                    <input type="text" name="endpoint" placeholder="Endpoint URL (e.g. https://api.example.com)" value={formData.endpoint} onChange={handleChange}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition" required />
                    <select name="method" value={formData.method} onChange={handleChange}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition">
                        {['GET', 'POST', 'PUT', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input type="number" name="rateLimit" placeholder="Rate Limit (req/min)" value={formData.rateLimit} onChange={handleChange}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition" min="1" />
                    <input type="number" step="0.001" name="costPerRequest" placeholder="Cost per Request (₹)" value={formData.costPerRequest} onChange={handleChange}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition" min="0" />
                    <div className="sm:col-span-2">
                        <button type="submit" disabled={createMutation.isPending}
                            className="rounded-full bg-slate-900 px-8 py-3 text-white font-medium transition hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed">
                            {createMutation.isPending ? 'Creating...' : 'Create API'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                <h2 className="text-xl font-semibold mb-6">Your APIs</h2>
                {isLoading ? (
                    <div className="text-center py-8 text-slate-400">Loading...</div>
                ) : apis?.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <p className="text-4xl mb-3">🔌</p>
                        <p className="text-sm">No APIs yet. Create your first one above.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto text-sm">
                            <thead>
                                <tr className="bg-slate-50 rounded-xl">
                                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold">Name</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold">Endpoint</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold">Method</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold">Rate Limit</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold">Cost/Req</th>
                                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {apis?.map(a => (
                                    <tr key={a._id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                                        <td className="px-4 py-4 font-medium text-slate-800">{a.name}</td>
                                        <td className="px-4 py-4 text-slate-500 max-w-[200px] truncate">{a.endpoint}</td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${a.method === 'GET' ? 'bg-sky-100 text-sky-700' :
                                                    a.method === 'POST' ? 'bg-emerald-100 text-emerald-700' :
                                                        a.method === 'PUT' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-red-100 text-red-700'
                                                }`}>{a.method}</span>
                                        </td>
                                        <td className="px-4 py-4 text-slate-600">{a.rateLimit}/min</td>
                                        <td className="px-4 py-4 text-slate-600">₹{a.costPerRequest}</td>
                                        <td className="px-4 py-4">
                                            <button onClick={() => window.confirm('Delete this API?') && deleteMutation.mutate(a._id)}
                                                className="rounded-full bg-red-50 text-red-600 px-3 py-1.5 text-xs font-medium hover:bg-red-100 transition">
                                                Delete
                                            </button>
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

export default Apis;
