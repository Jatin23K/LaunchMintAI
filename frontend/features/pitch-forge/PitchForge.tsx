import React, { useState } from 'react';
import axios from 'axios';
import { 
    ChevronRight, Sparkles, Loader2, ArrowLeft, Copy, CheckCircle2 
} from 'lucide-react';
import { PitchForgeData } from '../../types';

function PitchForgeApp({ onBack, setStatus }: { onBack: () => void, setStatus: (s: 'idle' | 'processing' | 'active') => void }) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<PitchForgeData | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const suggestions = [
        "AI Logistics Optimization",
        "Bio-Synthetic Materials",
        "Renewable Energy Grids",
        "Autonomous Construction",
        "Quantum Computing SaaS"
    ];

    const runForge = async (text: string = input) => {
        if (!text) return;
        setLoading(true); setData(null);
        setStatus('processing');
        try {
            const apiBase = (import.meta as any).env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
            const response = await axios.post(`${apiBase}/pitch_forge`, { user_idea: text });
            setData(response.data);
            setStatus('active');
        } catch (err) {
            console.error(err);
            setStatus('idle');
        }
        finally { setLoading(false); }
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
                                    onKeyDown={e => e.key === 'Enter' && runForge()}
                                />
                                <button onClick={() => runForge()} className="bg-amber-500 hover:bg-amber-400 text-white px-6 h-10 rounded-full font-bold text-xs tracking-wide transition-transform active:scale-95 flex items-center gap-2">
                                    GENERATE <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 items-center w-full">
                            <div className="flex flex-nowrap justify-center gap-3 w-full">
                                {suggestions.slice(0, 3).map((s) => (
                                    <button key={s} onClick={() => { setInput(s); runForge(s); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-xs text-gray-400 hover:text-white transition-all whitespace-nowrap">
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-nowrap justify-center gap-3 w-full">
                                {suggestions.slice(3, 5).map((s) => (
                                    <button key={s} onClick={() => { setInput(s); runForge(s); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-xs text-gray-400 hover:text-white transition-all whitespace-nowrap">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                    <div className="text-amber-500 font-bold mt-4 tracking-widest animate-pulse">CRAFTING NARRATIVE...</div>
                </div>
            )}

            {data && (
                <div className="animate-in slide-in-from-bottom-20 fade-in duration-700 w-full max-w-5xl px-6 pb-20 mt-10">
                    <button onClick={() => { setData(null); setStatus('idle'); }} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4" /> New Deck</button>
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 rounded-3xl mb-12 shadow-[0_0_60px_rgba(245,158,11,0.2)]">
                        <div className="bg-[#050914] rounded-[22px] p-10 text-center relative">
                            <h2 className="text-3xl md:text-5xl font-black text-white italic">"{data.tagline}"</h2>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { title: 'Elevator Pitch', content: data.elevator_pitch, id: 'elevator' },
                            { title: 'Value Prop', content: data.value_proposition, id: 'value' },
                            { title: 'Viral Tweet', content: data.tweet_thread_hook, id: 'tweet' },
                            { title: 'Subject Line', content: data.cold_email_subject, id: 'email' }
                        ].map((item) => (
                            <div key={item.id} className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-amber-500/30 transition-all group relative">
                                <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles className="w-3 h-3" /> {item.title}</div>
                                <p className="text-slate-300 leading-relaxed">{item.content}</p>
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
