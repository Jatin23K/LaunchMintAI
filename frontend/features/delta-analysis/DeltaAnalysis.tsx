import React, { useState } from 'react';
import { Activity, ShieldCheck, X, CheckCircle2, Swords, Loader2, Trophy, ArrowLeft } from 'lucide-react';
import { RealData } from '../../types';
import api from '../../services/api';

function DeltaAnalysisApp({ archive, setArchive }: { archive: RealData[], setArchive: (a: RealData[]) => void }) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [battleResult, setBattleResult] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleSelect = (idea: string) => {
        if (selectedIds.includes(idea)) {
            setSelectedIds(prev => prev.filter(id => id !== idea));
            setBattleResult(null);
        } else if (selectedIds.length < 2) {
            setSelectedIds(prev => [...prev, idea]);
            setBattleResult(null);
        }
    };

    const getReport = (idea: string) => archive.find(r => r.idea === idea);

    const removeReport = (idea: string) => {
        setArchive(archive.filter(r => r.idea !== idea));
        setSelectedIds(selectedIds.filter(id => id !== idea));
        setBattleResult(null);
    };

    const runBattle = async () => {
        if (selectedIds.length !== 2) return;
        const a = getReport(selectedIds[0]);
        const b = getReport(selectedIds[1]);
        if (!a || !b) return;
        setLoading(true); setBattleResult(null); setError(null);
        try {
            const res = await api.post('/compare', {
                idea_a: a.idea,
                market_a: {
                    forecast_tam: a.market?.forecast_tam,
                    growth: a.market?.growth,
                    risk_score: a.god_mode?.risk_score,
                },
                idea_b: b.idea,
                market_b: {
                    forecast_tam: b.market?.forecast_tam,
                    growth: b.market?.growth,
                    risk_score: b.god_mode?.risk_score,
                },
            });
            setBattleResult(res.data);
        } catch (e) {
            setError('Battle failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const winnerIdea = battleResult
        ? (battleResult.winner === 'A' ? getReport(selectedIds[0]) : getReport(selectedIds[1]))
        : null;

    const scoreKeys = ['market_size', 'growth_rate', 'competition', 'execution', 'investor_appeal'];
    const scoreLabels: Record<string, string> = {
        market_size: 'Market Size',
        growth_rate: 'Growth Rate',
        competition: 'Competition',
        execution: 'Execution',
        investor_appeal: 'Investor Appeal',
    };

    return (
        <div className="w-full max-w-5xl mx-auto px-4 md:px-6 pb-20 pt-4">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-tight">
                    <span className="text-white block">Battle</span>
                    <span className="text-cyan-400 block italic">Room.</span>
                </h1>
                <p className="text-gray-400 text-sm max-w-xl mx-auto">
                    Pick 2 ideas you've validated. Hit BATTLE. AI declares the winner — no ties, no fluff.
                    <br /><span className="text-cyan-500 font-bold">Run ideas through Validator first to save them here.</span>
                </p>
            </div>

            {archive.length < 2 ? (
                <div className="max-w-lg mx-auto bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center">
                    <Activity className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-slate-500 uppercase tracking-tight">Not Enough Data</h3>
                    <p className="text-slate-600 mt-2 text-sm">Go to Validator, analyze 2 ideas, click Save on each. Then come back.</p>
                </div>
            ) : (
                <>
                    {/* Saved reports grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {archive.map((report, i) => {
                            const isSelected = selectedIds.includes(report.idea!);
                            const slot = isSelected ? selectedIds.indexOf(report.idea!) + 1 : null;
                            return (
                                <div
                                    key={i}
                                    onClick={() => toggleSelect(report.idea!)}
                                    className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer group ${isSelected
                                        ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.15)]'
                                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-600'}`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-3 right-3 bg-cyan-500 text-black text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center">
                                            {slot}
                                        </div>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeReport(report.idea!); }}
                                        className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-500 transition-all"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                    <ShieldCheck className={`w-5 h-5 mb-3 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
                                    <h3 className="text-sm font-black text-white mb-3 line-clamp-2">"{report.idea}"</h3>
                                    <div className="flex gap-3 text-[10px] font-black uppercase text-slate-500">
                                        <span>TAM: <span className="text-cyan-400">{report.market?.forecast_tam || '—'}</span></span>
                                        <span>Risk: <span className="text-amber-400">{report.god_mode?.risk_score || '—'}</span></span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Selection status + Battle button */}
                    <div className="flex flex-col items-center gap-4 mb-10">
                        {selectedIds.length < 2 && (
                            <p className="text-slate-500 text-sm font-bold">
                                {selectedIds.length === 0 ? 'Select 2 ideas to battle' : 'Select 1 more idea'}
                            </p>
                        )}
                        {selectedIds.length === 2 && (
                            <button
                                onClick={runBattle}
                                disabled={loading}
                                className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black px-10 py-4 rounded-full font-black text-lg flex items-center gap-3 shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all active:scale-95"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Swords className="w-5 h-5" />}
                                {loading ? 'BATTLING...' : 'BATTLE'}
                            </button>
                        )}
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                    </div>

                    {/* Battle Result */}
                    {battleResult && !battleResult.error && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Winner banner */}
                            <div className="bg-gradient-to-r from-cyan-950/60 to-emerald-950/60 border-2 border-cyan-500/50 rounded-3xl p-8 text-center">
                                <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                                <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2">Winner</div>
                                <h2 className="text-3xl font-black text-white mb-4">"{winnerIdea?.idea}"</h2>
                                <p className="text-slate-300 text-sm leading-relaxed max-w-2xl mx-auto">{battleResult.verdict}</p>
                            </div>

                            {/* Scorecard */}
                            {battleResult.scorecard && (
                                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Head-to-Head Scorecard</h3>
                                    <div className="space-y-0">
                                        {/* Column headers */}
                                        <div className="grid grid-cols-3 gap-4 mb-3">
                                            <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest text-center truncate">{getReport(selectedIds[0])?.idea?.slice(0, 20)}...</div>
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Category</div>
                                            <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest text-center truncate">{getReport(selectedIds[1])?.idea?.slice(0, 20)}...</div>
                                        </div>
                                        {scoreKeys.map((key) => {
                                            const row = battleResult.scorecard[key];
                                            if (!row) return null;
                                            return (
                                                <div key={key} className="grid grid-cols-3 gap-4 py-3 border-t border-slate-800 items-start">
                                                    <div className={`text-xs text-right pr-2 ${row.winner === 'A' ? 'text-white font-bold' : 'text-slate-500'}`}>
                                                        {row.a}
                                                        {row.winner === 'A' && <span className="ml-1 text-emerald-400">✓</span>}
                                                    </div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{scoreLabels[key]}</div>
                                                    <div className={`text-xs text-left pl-2 ${row.winner === 'B' ? 'text-white font-bold' : 'text-slate-500'}`}>
                                                        {row.b}
                                                        {row.winner === 'B' && <span className="ml-1 text-emerald-400">✓</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => { setBattleResult(null); setSelectedIds([]); }}
                                className="flex items-center gap-2 text-slate-500 hover:text-white text-sm transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> New Battle
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default DeltaAnalysisApp;
