import React, { useState, useRef } from 'react';
import api from '../../services/api';
import {
    ChevronRight, Sparkles, ArrowLeft, Copy, CheckCircle2
} from 'lucide-react';
import { PitchForgeData } from '../../types';
import { getCachedResult } from '../../services/cache';

function PitchForgeApp({ onBack, setStatus }: { onBack: () => void, setStatus: (s: 'idle' | 'processing' | 'active') => void }) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<PitchForgeData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastText, setLastText] = useState('');
    const [copiedField, setCopiedField] = useState<string | null>(null);
    // OPT 5: In-flight deduplication + debounce
    const inFlightRef = useRef<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const suggestions = [
        "AI Logistics Optimization",
        "Bio-Synthetic Materials",
        "Renewable Energy Grids",
        "Autonomous Construction",
        "Quantum Computing SaaS"
    ];

    const runForge = async (text: string = lastText || input) => {
        if (!text) return;
        // OPT 5: Deduplicate in-flight requests
        const key = text.trim().toLowerCase();
        if (inFlightRef.current === key) return;
        if (loading) return;
        inFlightRef.current = key;

        setLoading(true); setData(null); setError(null);
        setLastText(text);
        setStatus('processing');
        try {
            // Pull market data from Validator cache to ground the pitch
            const cached = getCachedResult(text);
            const mkt = (cached?.data?.market || {}) as any;
            const topComp = (cached?.data?.competitors as any)?.[0]?.name || '';
            const response = await api.post(`/pitch_forge`, {
                user_idea: text,
                market_size: mkt.forecast_tam || '',
                growth_rate: mkt.growth || '',
                top_competitor: topComp,
            }, { retry: 2 } as any);
            setData(response.data);
            setStatus('active');
        } catch (err) {
            console.error(err);
            setError('Forge failed. The copywriter walked out. Try again.');
            setStatus('idle');
        }
        finally {
            setLoading(false);
            inFlightRef.current = null; // OPT 5: Clear in-flight marker
        }
    };

    // OPT 5: Debounced click handler
    const handleForgeClick = (text?: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => runForge(text), 300);
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    return (
        <div className={`w-full flex-1 flex flex-col items-center ${!data && !loading ? 'justify-center' : ''}`}>
            {!data && !loading && (
                <>
                    <div className="text-center pt-10 relative z-40 max-w-4xl mx-auto mb-10">
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-tight">
                            <span className="text-white block">Generate a winning</span>
                            <span className="text-amber-500 block">pitch deck.</span>
                        </h1>
                        <p className="text-gray-400 text-base max-w-2xl mx-auto">Turn a simple prompt into a structured, investor-ready presentation.</p>
                    </div>

                    <div className="w-full max-w-3xl space-y-8 relative z-50">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-1000"></div>
                            <div className="relative flex items-center bg-[#0B1221] rounded-full p-2 pl-6 shadow-2xl border border-white/10">
                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="What is your startup about?"
                                    className="flex-1 bg-transparent text-white placeholder-gray-500 text-base outline-none h-10"
                                    onKeyDown={e => e.key === 'Enter' && handleForgeClick()}
                                />
                                <button onClick={() => handleForgeClick()} className="bg-amber-500 hover:bg-amber-400 text-white px-6 h-10 rounded-full font-bold text-xs tracking-wide transition-transform active:scale-95 flex items-center gap-2">
                                    GENERATE <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 items-center w-full">
                            <div className="flex flex-nowrap justify-center gap-3 w-full">
                                {suggestions.slice(0, 3).map((s) => (
                                    <button key={s} onClick={() => { setInput(s); handleForgeClick(s); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-xs text-gray-400 hover:text-white transition-all whitespace-nowrap">
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-nowrap justify-center gap-3 w-full">
                                {suggestions.slice(3, 5).map((s) => (
                                    <button key={s} onClick={() => { setInput(s); handleForgeClick(s); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-xs text-gray-400 hover:text-white transition-all whitespace-nowrap">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {loading && (
                <div className="animate-pulse w-full max-w-5xl px-6 pb-20 mt-10">
                    {/* tagline banner skeleton */}
                    <div className="bg-gradient-to-br from-amber-500/40 to-orange-600/40 p-0.5 rounded-3xl mb-12">
                        <div className="bg-[#050914] rounded-[22px] p-10 text-center space-y-3">
                            <div className="h-6 bg-slate-800 rounded-full w-2/3 mx-auto"></div>
                            <div className="h-6 bg-slate-800 rounded-full w-1/3 mx-auto"></div>
                        </div>
                    </div>
                    {/* 2x2 cards skeleton */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl space-y-3">
                                <div className="h-3 bg-slate-800 rounded-full w-24 mb-4"></div>
                                <div className="h-3 bg-slate-800 rounded-full w-full"></div>
                                <div className="h-3 bg-slate-800 rounded-full w-4/5"></div>
                                <div className="h-3 bg-slate-800 rounded-full w-3/5"></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {error && !loading && (
                <div className="flex flex-col items-center gap-3 py-10">
                    <p className="text-amber-400 text-sm font-bold">{error}</p>
                    <button
                        onClick={() => runForge()}
                        className="text-amber-400 hover:text-amber-300 text-sm font-black tracking-wide border border-amber-500/30 px-4 py-1.5 rounded-full hover:border-amber-400/60 transition-all"
                    >
                        ↻ Retry Forge
                    </button>
                </div>
            )}

            {data && (
                <div className="animate-in slide-in-from-bottom-20 fade-in duration-700 w-full max-w-5xl px-6 pb-20 mt-10">
                    <button onClick={() => { setData(null); setError(null); setLastText(''); setStatus('idle'); }} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4" /> New Deck</button>
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 rounded-3xl mb-12 shadow-[0_0_60px_rgba(245,158,11,0.2)]">
                        <div className="bg-[#050914] rounded-[22px] p-10 text-center relative">
                            <h2 className="text-3xl md:text-5xl font-black text-white italic">"{data.tagline}"</h2>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { title: 'Elevator Pitch', content: data.elevator_pitch, id: 'elevator', charLimit: null },
                            { title: 'Value Prop', content: data.value_proposition, id: 'value', charLimit: null },
                            { title: 'Viral Tweet', content: data.tweet_thread_hook, id: 'tweet', charLimit: 280 },
                            { title: 'Subject Line', content: data.cold_email_subject, id: 'email', charLimit: null }
                        ].map((item) => (
                            <div key={item.id} className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-amber-500/30 transition-all group relative">
                                <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles className="w-3 h-3" /> {item.title}</div>
                                <p className="text-slate-300 leading-relaxed">{item.content}</p>
                                {item.charLimit && (
                                    <div className={`mt-3 text-[10px] font-bold ${item.content.length > item.charLimit ? 'text-red-400' : 'text-slate-600'}`}>
                                        {item.content.length}/{item.charLimit} chars
                                    </div>
                                )}
                                <button onClick={() => copyToClipboard(item.content, item.id)} className="absolute top-6 right-6 text-slate-600 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all">
                                    {copiedField === item.id ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default PitchForgeApp;
