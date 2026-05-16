import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import api from '../services/api';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const IntegrationGuide = ({ keyDoc }) => {
    const [copied, setCopied] = useState('');
    const slug = keyDoc.apiId?.slug || keyDoc.apiId?._id;
    const endpoint = `${BASE_URL}/api/v1/${slug}`;
    const method = keyDoc.apiId?.method || 'GET';

    const copy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(''), 2000);
    };

    const curlCmd = `curl -X ${method} "${endpoint}" \\\n  -H "X-API-Key: ${keyDoc.key}"`;
    const jsCode = `fetch("${endpoint}", {\n  method: "${method}",\n  headers: { "X-API-Key": "${keyDoc.key}" }\n})\n  .then(res => res.json())\n  .then(console.log);`;
    const pythonCode = `import requests\n\nresponse = requests.${method.toLowerCase()}(\n    "${endpoint}",\n    headers={"X-API-Key": "${keyDoc.key}"}\n)\nprint(response.json())`;

    return (
        <div className="space-y-4">
            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Your Endpoint</p>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${method === 'GET' ? 'bg-sky-100 text-sky-700' : method === 'POST' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{method}</span>
                    <code className="text-xs text-slate-700 flex-1 truncate">{endpoint}</code>
                    <button onClick={() => copy(endpoint, 'url')} className="text-xs text-sky-600 hover:text-sky-500 font-medium whitespace-nowrap">{copied === 'url' ? 'Copied!' : 'Copy'}</button>
                </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
                {[{ id: 'curl', label: 'cURL', code: curlCmd }, { id: 'js', label: 'JavaScript', code: jsCode }, { id: 'python', label: 'Python', code: pythonCode }].map(({ id, label, code }) => (
                    <div key={id} className="bg-slate-900 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-700">
                            <span className="text-xs text-slate-400 font-medium">{label}</span>
                            <button onClick={() => copy(code, id)} className="text-xs text-sky-400 hover:text-sky-300">{copied === id ? 'Copied!' : 'Copy'}</button>
                        </div>
                        <pre className="text-xs text-emerald-300 p-3 overflow-x-auto whitespace-pre font-mono leading-relaxed">{code}</pre>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TestConsole = ({ keyDoc }) => {
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const slug = keyDoc.apiId?.slug || keyDoc.apiId?._id;

    const handleTest = async () => {
        setLoading(true);
        setResponse(null);
        const start = Date.now();
        try {
            const res = await axios.get(`${BASE_URL}/api/v1/${slug}`, { headers: { 'X-API-Key': keyDoc.key } });
            setResponse({ status: res.status, time: Date.now() - start, data: res.data, ok: true });
        } catch (err) {
            setResponse({ status: err.response?.status ?? 0, time: Date.now() - start, data: err.response?.data ?? { error: err.message }, ok: false });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4 space-y-3">
            <button onClick={handleTest} disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-sm text-white font-medium transition hover:bg-sky-400 disabled:opacity-50">
                {loading ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Sending…</> : '▶ Send Test Request'}
            </button>
            {response && (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className={`flex items-center gap-2 px-4 py-2 text-xs font-medium ${response.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        <span className={`w-2 h-2 rounded-full ${response.ok ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {response.status} · {response.time}ms
                        <span className="ml-auto opacity-60">Usage logged ✓</span>
                    </div>
                    <pre className="bg-slate-900 text-emerald-300 text-xs p-3 overflow-auto max-h-40 font-mono">{JSON.stringify(response.data, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

const ApiKeys = () => {
    const queryClient = useQueryClient();
    const [selectedApi, setSelectedApi] = useState('');
    const [expandedKey, setExpandedKey] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    const { data: keys, isLoading } = useQuery({
        queryKey: ['keys'],
        queryFn: () => api.get('/api/keys').then(r => r.data)
    });

    const { data: apis } = useQuery({
        queryKey: ['apis'],
        queryFn: () => api.get('/api/apis').then(r => r.data)
    });

    const createMutation = useMutation({
        mutationFn: (apiId) => api.post('/api/keys', { apiId }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['keys'] }); setSelectedApi(''); }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/keys/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['keys'] })
    });

    const copyKey = (key, id) => {
        navigator.clipboard.writeText(key);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Security</p>
                        <h1 className="text-3xl font-bold text-slate-900 mt-1">API Keys</h1>
                        <p className="text-slate-500 mt-1">Generate keys and share integration guides with your users.</p>
                    </div>
                    <div className="self-start sm:self-auto rounded-full bg-slate-100 px-5 py-2.5 text-sm text-slate-600 font-medium">
                        {keys?.length ?? 0} active keys
                    </div>
                </div>
            </div>

            <div className="rounded-[2rem] border border-sky-100 bg-sky-50 p-6">
                <h2 className="font-semibold text-sky-900 mb-3">How end users call your API</h2>
                <div className="flex flex-wrap gap-3 text-sm text-sky-800">
                    {['Create an API', 'Generate a key', 'Share endpoint + key', 'Their app calls your proxy', 'Every call is tracked & billed'].map((step, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white border border-sky-100 rounded-full px-4 py-1.5">
                            <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                            {step}
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                <h2 className="text-xl font-semibold mb-6">Generate New Key</h2>
                {!apis?.length ? (
                    <p className="text-slate-500 text-sm">Create an API first before generating keys.</p>
                ) : (
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <select value={selectedApi} onChange={e => setSelectedApi(e.target.value)}
                            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition">
                            <option value="">Select an API</option>
                            {apis?.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                        </select>
                        <button onClick={() => selectedApi && createMutation.mutate(selectedApi)}
                            disabled={!selectedApi || createMutation.isPending}
                            className="rounded-full bg-slate-900 px-8 py-3 text-white font-medium transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                            {createMutation.isPending ? 'Generating...' : 'Generate Key'}
                        </button>
                    </div>
                )}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
                <h2 className="text-xl font-semibold mb-6">Your API Keys</h2>
                {isLoading ? (
                    <div className="text-center py-8 text-slate-400">Loading...</div>
                ) : !keys?.length ? (
                    <div className="text-center py-8 text-slate-400">
                        <p className="text-4xl mb-3">🔑</p>
                        <p className="text-sm">No API keys yet. Generate one above.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {keys.map(k => (
                            <div key={k._id} className="rounded-2xl border border-slate-200 overflow-hidden">
                                <div className="flex flex-wrap items-center gap-3 px-5 py-4 bg-white">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800">{k.apiId?.name ?? '—'}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg truncate max-w-[220px] block">{k.key}</code>
                                            <button onClick={() => copyKey(k.key, k._id)} className="text-xs text-sky-600 hover:text-sky-500 font-medium whitespace-nowrap">
                                                {copiedId === k._id ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${k.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {k.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className="text-xs text-slate-400">{new Date(k.createdAt).toLocaleDateString()}</span>
                                        <button onClick={() => setExpandedKey(expandedKey === k._id ? null : k._id)}
                                            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
                                            {expandedKey === k._id ? 'Hide' : 'Integrate'}
                                        </button>
                                        <button onClick={() => window.confirm('Delete this key?') && deleteMutation.mutate(k._id)}
                                            className="rounded-full bg-red-50 text-red-600 px-3 py-1.5 text-xs font-medium hover:bg-red-100 transition">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                {expandedKey === k._id && (
                                    <div className="border-t border-slate-100 px-5 py-5 bg-slate-50/50 space-y-4">
                                        <IntegrationGuide keyDoc={k} />
                                        <TestConsole keyDoc={k} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApiKeys;
