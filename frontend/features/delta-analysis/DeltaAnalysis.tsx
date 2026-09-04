import React, { useState } from 'react';
import { 
    Activity, ShieldCheck, X, CheckCircle2, ArrowLeft 
} from 'lucide-react';
import { RealData } from '../../types';

function DeltaAnalysisApp({ archive, setArchive }: { archive: RealData[], setArchive: (a: RealData[]) => void }) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [comparing, setComparing] = useState(false);

    const toggleSelect = (idea: string) => {
        if (selectedIds.includes(idea)) {
            setSelectedIds(prev => prev.filter(id => id !== idea));
        } else if (selectedIds.length < 2) {
            setSelectedIds(prev => [...prev, idea]);
        }
    };

    const getReport = (idea: string) => archive.find(r => r.idea === idea);

    const removeReport = (idea: string) => {
        setArchive(archive.filter(r => r.idea !== idea));
        setSelectedIds(selectedIds.filter(id => id !== idea));
    };

    return (
        <div className="w-full max-w-5xl mx-auto px-6 pb-20">
            {!comparing ? (
                <div className="animate-in fade-in duration-700">
                    <div className="text-center pt-10 mb-10">
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-tight">
                            <span className="text-white block">Strategic</span>
                            <span className="text-cyan-500 block italic">Delta Analysis.</span>
                        </h1>
                        <p className="text-gray-400 text-base max-w-2xl mx-auto">Select two archived reports to run a deep-dive comparative market analysis.</p>
                    </div>

                    {archive.length === 0 ? (
                        <div className="max-w-3xl mx-auto bg-[#0B1221]/30 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-12 text-center relative group opacity-50">
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600/10 to-transparent blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                            <div className="relative">
                                <Activity className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-30 animate-pulse" />
                                <h3 className="text-2xl font-black text-slate-500 italic tracking-tight uppercase">NOT ENOUGH DATA</h3>
                                <p className="text-slate-500 mt-2 font-medium text-sm">Capture intelligence from the Validator or War Room to build your war chest.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {archive.map((report, i) => (
                                <div
                                    key={i}
                                    onClick={() => toggleSelect(report.idea!)}
                                    className={`relative p-8 rounded-[2rem] border-2 transition-all cursor-pointer group overflow-hidden ${selectedIds.includes(report.idea!)
                                        ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_50px_rgba(6,182,212,0.15)] scale-[1.02]'
                                        : 'bg-[#0B1221]/80 backdrop-blur-md border-white/5 hover:border-white/20'
                                        }`}
                                >
                                    {selectedIds.includes(report.idea!) && (
                                        <div className="absolute top-0 right-0 p-4">
                                            <div className="bg-cyan-500 text-white rounded-full p-1 shadow-lg shadow-cyan-500/40">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-3 rounded-2xl border ${selectedIds.includes(report.idea!) ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-slate-800/50 border-white/5 text-slate-500 group-hover:text-slate-300'}`}>
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeReport(report.idea!); }}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-500 transition-all font-bold text-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-3 line-clamp-2 italic tracking-tight">"{report.idea}"</h3>
                                    <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-white/5">
                                        <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                            RISK: <span className={report.god_mode?.risk_score.includes('Low') ? 'text-emerald-400' : 'text-amber-500'}>{report.god_mode?.risk_score}</span>
                                        </div>
                                        <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                            TAM: <span className="text-cyan-400">{report.market.size || report.market.forecast_tam}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedIds.length === 2 && (
                        <button
                            onClick={() => setComparing(true)}
                            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-cyan-600 hover:bg-cyan-500 text-white px-12 py-5 rounded-full font-black text-xl shadow-[0_20px_50px_rgba(6,182,212,0.3)] transition-all active:scale-95 z-50 animate-in slide-in-from-bottom-20"
                        >
                            RUN DELTA ANALYSIS
                        </button>
                    )}
                </div>
            ) : (
                <div className="animate-in slide-in-from-bottom-10 fade-in duration-700">
                    <button onClick={() => setComparing(false)} className="mb-12 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Exit War Room
                    </button>

                    <div className="grid lg:grid-cols-2 gap-8 items-start relative">
                        <div className="hidden lg:flex absolute left-1/2 top-48 -translate-x-1/2 w-20 h-20 rounded-full bg-slate-950 border-4 border-cyan-500/50 items-center justify-center z-20 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                            <span className="text-2xl font-black italic text-cyan-400">VS</span>
                        </div>

                        {[getReport(selectedIds[0]), getReport(selectedIds[1])].map((report, idx) => (
                            <div key={idx} className={`bg-slate-950/50 border-2 rounded-[2.5rem] p-10 relative overflow-hidden ${idx === 0 ? 'border-emerald-500/30' : 'border-cyan-500/30'}`}>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Subject {idx + 1}</div>
                                <h2 className={`text-3xl font-black mb-8 italic ${idx === 0 ? 'text-emerald-400' : 'text-cyan-400'}`}>"{report?.idea}"</h2>

                                <div className="space-y-8">
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Macro Verdict</div>
                                        <p className="text-sm text-slate-300 leading-relaxed italic">"{report?.god_mode?.macro_verdict}"</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                                            <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Market Size</div>
                                            <div className="text-2xl font-black text-white">{report?.market.forecast_tam || report?.market.size}</div>
                                        </div>
                                        <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                                            <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Risk Rating</div>
                                            <div className={`text-2xl font-black ${report?.god_mode?.risk_score.includes('Low') ? 'text-green-400' : 'text-red-400'}`}>
                                                {report?.god_mode?.risk_score}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Core Competitors</div>
                                        <div className="space-y-2">
                                            {report?.competitors.slice(0, 3).map((c, i) => (
                                                <div key={i} className="text-xs text-slate-400 flex items-center gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-slate-700" /> {c.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 bg-gradient-to-r from-emerald-900/20 via-cyan-900/20 to-emerald-900/20 border-2 border-white/5 rounded-[2rem] p-12 text-center">
                        <div className="text-cyan-400 font-black uppercase tracking-[0.4em] text-[10px] mb-6">Strategic Delta Analysis</div>
                        <p className="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed italic">
                            Comparative analysis mapped. Dominance established across dual vectors.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DeltaAnalysisApp;
