import React, { useState } from 'react';
import api from '../../services/api';
import { ChevronRight, ArrowLeft, AlertTriangle, Skull, Flame } from 'lucide-react';
import { VCRoastData } from '../../types';
import { API_BASE_URL } from '../../config';

function getRiskLabel(chance: number): { label: string; color: string; bg: string; border: string } {
    if (chance <= 15) return { label: 'Critical Risk', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
    if (chance <= 35) return { label: 'High Risk', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
    if (chance <= 55) return { label: 'Moderate Risk', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    if (chance <= 75) return { label: 'Viable', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
    return { label: 'Strong Potential', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
}

function VCRoastApp({ onBack, setStatus }: { onBack: () => void, setStatus: (s: 'idle' | 'processing' | 'active') => void }) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<VCRoastData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastText, setLastText] = useState('');

    const suggestions = [
        "Creator Economy FinTech",
        "D2C Wellness Brand",
        "Generative AI for Legal",
        "Supply Chain Automation",
        "Sustainable AgriTech"
    ];

    const runRoast = async (text: string = lastText || input) => {
        if (!text) return;
        setLoading(true); setData(null); setError(null);
        setLastText(text);
        setStatus('processing');
        try {
            const response = await api.post(`/vc_roast`, { user_idea: text }, { retry: 2 } as any);
            setData(response.data);
            setStatus('active');
        } catch (err) {
            console.error(err);
            setError('Roast failed. The servers chickened out. Try again.');
            setStatus('idle');
        }
        finally { setLoading(false); }
    };

    return (
        <div className={`w-full flex-1 flex flex-col items-center ${!data && !loading ? 'justify-center' : ''}`}>
            {!data && !loading && (
                <>
                    <div className="text-center pt-10 relative z-40 max-w-4xl mx-auto mb-10">
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-tight">
                            <span className="text-white block">Get your startup</span>
                            <span className="text-red-500 block">idea roasted.</span>
                        </h1>
                        <p className="text-gray-400 text-base max-w-2xl mx-auto">Brutal, honest feedback. We find the flaws before the VCs do.</p>
                    </div>

                    <div className="w-full max-w-3xl space-y-8 relative z-50">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-1000"></div>
                            <div className="relative flex items-center bg-[#0B1221] rounded-full p-2 pl-6 shadow-2xl border border-white/10">
                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="Pitch us your idea (if you dare)..."
                                    className="flex-1 bg-transparent text-white placeholder-gray-500 text-base outline-none h-10"
                                    onKeyDown={e => e.key === 'Enter' && runRoast()}
                                />
                                <button onClick={() => runRoast()} className="bg-red-600 hover:bg-red-500 text-white px-6 h-10 rounded-full font-bold text-xs tracking-wide transition-transform active:scale-95 flex items-center gap-2">
                                    ROAST IT <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 items-center w-full">
                            <div className="flex flex-nowrap justify-center gap-3 w-full">
                                {suggestions.slice(0, 3).map((s) => (
                                    <button key={s} onClick={() => { setInput(s); runRoast(s); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-xs text-gray-400 hover:text-white transition-all whitespace-nowrap">
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-nowrap justify-center gap-3 w-full">
                                {suggestions.slice(3, 5).map((s) => (
                                    <button key={s} onClick={() => { setInput(s); runRoast(s); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-xs text-gray-400 hover:text-white transition-all whitespace-nowrap">
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
                    {/* kill_shot banner skeleton */}
                    <div className="bg-gradient-to-br from-red-600/40 to-orange-600/40 p-0.5 rounded-3xl mb-12">
                        <div className="bg-[#050914] rounded-[22px] p-10 text-center space-y-3">
                            <div className="h-6 bg-slate-800 rounded-full w-3/4 mx-auto"></div>
                            <div className="h-6 bg-slate-800 rounded-full w-1/2 mx-auto"></div>
                        </div>
                    </div>

                    {/* feedback + survival grid skeleton */}
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl md:col-span-2 space-y-4">
                            <div className="h-3 bg-slate-800 rounded-full w-32 mb-6"></div>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-xl bg-black/20 border border-slate-800">
                                    <div className="h-4 w-8 bg-red-900/50 rounded shrink-0"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-slate-800 rounded-full w-full"></div>
                                        <div className="h-3 bg-slate-800 rounded-full w-4/5"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl flex flex-col items-center justify-center gap-4">
                            <div className="h-3 bg-slate-800 rounded-full w-24"></div>
                            <div className="h-24 w-32 bg-slate-800 rounded-xl"></div>
                            <div className="h-5 w-28 bg-slate-800 rounded-full"></div>
                            <div className="h-3 bg-slate-800 rounded-full w-full"></div>
                            <div className="h-3 bg-slate-800 rounded-full w-4/5"></div>
                        </div>
                    </div>

                    {/* verdict + competitor skeleton */}
                    <div className="bg-red-950/20 border-2 border-red-500/20 p-10 rounded-[2.5rem] space-y-4">
                        <div className="h-3 bg-slate-800 rounded-full w-32"></div>
                        <div className="h-8 bg-slate-800 rounded-full w-48"></div>
                        <div className="flex gap-3 p-4 rounded-2xl bg-black/40 border border-red-500/10 mt-6">
                            <div className="h-6 w-6 bg-red-900/50 rounded shrink-0"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-slate-800 rounded-full w-32"></div>
                                <div className="h-3 bg-slate-800 rounded-full w-full"></div>
                                <div className="h-3 bg-slate-800 rounded-full w-3/4"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {error && !loading && (
                <div className="flex flex-col items-center gap-3 py-10">
                    <p className="text-red-400 text-sm font-bold">{error}</p>
                    <button
                        onClick={() => runRoast()}
                        className="text-red-400 hover:text-red-300 text-sm font-black tracking-wide border border-red-500/30 px-4 py-1.5 rounded-full hover:border-red-400/60 transition-all"
                    >
                        ↻ Retry Roast
                    </button>
                </div>
            )}

            {data && (
                <div className="animate-in slide-in-from-bottom-20 fade-in duration-700 w-full max-w-5xl px-6 pb-20 mt-10">
                    <button onClick={() => { setData(null); setError(null); setLastText(''); setStatus('idle'); }} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4" /> New Roast</button>
                    <div className="bg-gradient-to-br from-red-600 to-orange-600 p-0.5 rounded-3xl mb-12 shadow-[0_0_60px_rgba(220,38,38,0.2)]">
                        <div className="bg-[#050914] rounded-[22px] p-10 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>
                            <h2 className="text-3xl md:text-5xl font-black text-white italic">"{data.kill_shot}"</h2>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl md:col-span-2">
                            <div className="text-xs font-bold text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Flame className="w-4 h-4" /> The Brutal Truth</div>
                            <div className="space-y-4">
                                {data.brutal_feedback.map((point, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-black/20 border border-slate-800">
                                        <span className="text-red-500 font-black shrink-0">#{String(i + 1).padStart(2, '0')}</span>
                                        <p className="text-slate-300">{point}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl flex flex-col items-center justify-center text-center">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Survival Probability</div>
                            <div className={`text-8xl font-black tracking-tighter mb-4 ${getRiskLabel(data.survival_chance).color}`}>{data.survival_chance}%</div>
                            <div className={`px-4 py-1 rounded-full ${getRiskLabel(data.survival_chance).bg} border ${getRiskLabel(data.survival_chance).border} ${getRiskLabel(data.survival_chance).color} text-[10px] font-black uppercase mb-3`}>
                                {getRiskLabel(data.survival_chance).label}
                            </div>
                            {data.survival_benchmark && (
                                <p className="text-slate-500 text-[10px] leading-relaxed">{data.survival_benchmark}</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-red-950/20 border-2 border-red-500/30 p-10 rounded-[2.5rem] relative overflow-hidden">
                        <div className="absolute -right-20 -bottom-20 opacity-10">
                            <Skull className="w-80 h-80 text-red-500" />
                        </div>
                        <div className="relative z-10">
                            <div className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4">Investment Verdict</div>
                            <h3 className="text-4xl font-black text-white italic mb-6">"{data.investment_verdict}"</h3>
                            <div className="flex items-start gap-3 p-4 rounded-2xl bg-black/40 border border-red-500/20">
                                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                                <div>
                                    <div className="text-red-400 font-bold text-sm uppercase">Competitor Death Trap</div>
                                    <p className="text-red-100/70 text-sm">{data.competitor_alert}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VCRoastApp;
