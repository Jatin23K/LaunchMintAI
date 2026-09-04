import React, { useState } from 'react';
import axios from 'axios';
import { 
    ChevronRight, Loader2, ArrowLeft 
} from 'lucide-react';
import { RealData } from '../../types';

function WarRoomApp({ onBack, onSave, setStatus }: { onBack: () => void, onSave: (report: RealData) => void, setStatus: (s: 'idle' | 'processing' | 'active') => void }) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<RealData | null>(null);

    const suggestions = [
        "Enterprise SaaS Platform",
        "Climate Tech Infrastructure",
        "MedTech Diagnostic Tool",
        "AI Cybersecurity Solution",
        "Retail Data Analytics"
    ];

    const runSim = async (text: string = input) => {
        if (!text) return;
        setLoading(true); setData(null);
        setStatus('processing');
        try {
            const apiBase = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8000';
            const response = await axios.post(`${apiBase}/war_room`, { idea: text });
            setData({ ...response.data, idea: text });
            setStatus('active');
        } catch (err) {
            console.error(err);
            setStatus('idle');
        }
        finally { setLoading(false); }
    };

    return (
        <div className={`w-full flex-1 flex flex-col items-center ${!data && !loading ? 'justify-center' : ''}`}>
            {!data && !loading && (
                <>
                    <div className="text-center pt-10 relative z-40 max-w-5xl mx-auto mb-10">
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-tight">
                            <span className="text-white block md:whitespace-nowrap">Battle-test your pitch</span>
                            <span className="text-violet-500 block md:whitespace-nowrap">against AI.</span>
                        </h1>
                        <p className="text-gray-400 text-base max-w-2xl mx-auto">Simulate a high-stakes investor meeting. Can you answer the tough questions?</p>
                    </div>

                    <div className="w-full max-w-3xl space-y-8 relative z-50">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-1000"></div>
                            <div className="relative flex items-center bg-[#0B1221] rounded-full p-2 pl-6 shadow-2xl border border-white/10">
                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="Give your 30-second elevator pitch..."
                                    className="flex-1 bg-transparent text-white placeholder-gray-500 text-base outline-none h-10"
                                    onKeyDown={e => e.key === 'Enter' && runSim()}
                                />
                                <button onClick={() => runSim()} className="bg-violet-600 hover:bg-violet-500 text-white px-6 h-10 rounded-full font-bold text-xs tracking-wide transition-transform active:scale-95 flex items-center gap-2">
                                    START PITCH <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 items-center w-full">
                            <div className="flex flex-nowrap justify-center gap-3 w-full">
                                {suggestions.slice(0, 3).map((s) => (
                                    <button key={s} onClick={() => { setInput(s); runSim(s); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-xs text-gray-400 hover:text-white transition-all whitespace-nowrap">
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-nowrap justify-center gap-3 w-full">
                                {suggestions.slice(3, 5).map((s) => (
                                    <button key={s} onClick={() => { setInput(s); runSim(s); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-xs text-gray-400 hover:text-white transition-all whitespace-nowrap">
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
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
                    <div className="text-violet-500 font-bold mt-4 tracking-widest animate-pulse">DEPLOYING AGENTS...</div>
                </div>
            )}

            {data && (
                <div className="animate-in slide-in-from-bottom-20 fade-in duration-700 w-full max-w-5xl px-6 pb-20 mt-10">
                    <button onClick={() => { setData(null); setStatus('idle'); }} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4" /> Return to HQ</button>
                    <div className="bg-violet-950/20 border border-violet-500/30 p-10 rounded-3xl relative overflow-hidden">
                        <h2 className="text-3xl font-black text-white mb-6">VC Verdict: <span className="text-violet-400">"{data.god_mode?.macro_verdict}"</span></h2>
                        <p className="text-slate-300 text-lg leading-relaxed">{data.god_mode?.swarm_summary}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WarRoomApp;
