import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, MessageSquare, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
import { DSInsightsData } from '../types';

interface DSInsightsProps {
    data: DSInsightsData;
}

// ── Colour helpers ──────────────────────────────────────────────────────────
const getRiskColor = (tier: string) => {
    const t = tier?.toLowerCase() || '';
    if (t.includes('low')) return { text: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-500/10' };
    if (t.includes('medium') || t.includes('moderate')) return { text: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/10' };
    return { text: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-500/10' };
};

const getSurvivalColor = (prob: number) => {
    if (prob >= 0.65) return 'text-emerald-400';
    if (prob >= 0.45) return 'text-amber-400';
    return 'text-red-400';
};

const getPainColor = (score: number) => {
    if (score >= 3.5) return 'text-emerald-400'; // high pain = good opportunity
    if (score >= 2.0) return 'text-amber-400';
    return 'text-slate-400';
};

// ── Card 1: ML Survival Prediction ─────────────────────────────────────────
const SurvivalCard = ({ survival }: { survival: DSInsightsData['survival'] }) => {
    const pct = Math.round((survival.survival_probability ?? 0) * 100);
    const riskColors = getRiskColor(survival.risk_tier ?? '');
    const scoreColor = getSurvivalColor(survival.survival_probability ?? 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden group"
        >
            {/* bg glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />

            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">ML Survival Prediction</h3>
                    <p className="text-[10px] text-amber-500/70 font-mono mt-0.5">⚠ Heuristic model · indicative only</p>
                </div>
            </div>

            {/* Score + tier */}
            <div className="flex items-end gap-4 mb-6">
                <div className={`text-6xl md:text-7xl font-black tracking-tighter ${scoreColor}`}>
                    {pct}%
                </div>
                <div className={`mb-2 px-3 py-1 rounded-xl border text-xs font-black uppercase tracking-widest ${riskColors.text} ${riskColors.border} ${riskColors.bg}`}>
                    {survival.risk_tier ?? 'N/A'}
                </div>
            </div>

            {/* Confidence band */}
            {survival.confidence_band && (
                <div className="mb-6">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">95% Confidence Band</div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-xs">
                            {Math.round(survival.confidence_band[0] * 100)}% – {Math.round(survival.confidence_band[1] * 100)}%
                        </span>
                        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${pct >= 65 ? 'bg-emerald-500' : pct >= 45 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Risk factors */}
            {survival.top_risk_factors && survival.top_risk_factors.length > 0 && (
                <div className="mb-4">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-400" /> Top Risk Signals
                    </div>
                    <div className="space-y-1">
                        {survival.top_risk_factors.slice(0, 3).map((f, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                                <span className="text-amber-500 font-bold shrink-0">{i + 1}.</span>
                                <span>{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Winners / losers */}
            <div className="grid grid-cols-2 gap-3 mt-4">
                {survival.similar_winners && survival.similar_winners.length > 0 && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                        <div className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Similar Winners
                        </div>
                        <div className="space-y-1">
                            {survival.similar_winners.slice(0, 2).map((w, i) => (
                                <div key={i} className="text-[10px] text-slate-300 font-medium">{w}</div>
                            ))}
                        </div>
                    </div>
                )}
                {survival.similar_losers && survival.similar_losers.length > 0 && (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                        <div className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-1.5 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Similar Failures
                        </div>
                        <div className="space-y-1">
                            {survival.similar_losers.slice(0, 2).map((l, i) => (
                                <div key={i} className="text-[10px] text-slate-300 font-medium">{l}</div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// ── Card 2: Monte Carlo Financial Scenarios ─────────────────────────────────
const MonteCarloCard = ({ financials }: { financials: DSInsightsData['financials'] }) => {
    const scenarios = [
        { key: 'bear', label: 'Bear (P10)', months: financials.bear?.runway_months ?? 0, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
        { key: 'base', label: 'Base (P50)', months: financials.base?.runway_months ?? 0, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
        { key: 'bull', label: 'Bull (P90)', months: financials.bull?.runway_months ?? 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    ];
    const maxMonths = Math.max(...scenarios.map(s => s.months), 1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />

            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Financial Scenarios</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Monte Carlo · {(financials.simulations_run ?? 10000).toLocaleString()} runs
                    </p>
                </div>
            </div>

            {/* Scenario bars */}
            <div className="space-y-4 mb-6">
                {scenarios.map((s) => (
                    <div key={s.key}>
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</span>
                            <span className={`text-sm font-black ${s.color}`}>{s.months} mo runway</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(s.months / maxMonths) * 100}%` }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className={`h-full rounded-full ${s.key === 'bear' ? 'bg-red-500' : s.key === 'base' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Breakeven Prob</div>
                    <div className={`text-xl font-black ${(financials.breakeven_probability ?? 0) >= 0.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {Math.round((financials.breakeven_probability ?? 0) * 100)}%
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">LTV:CAC Ratio</div>
                    <div className={`text-xl font-black ${(financials.ltv_cac_ratio ?? 0) >= 3 ? 'text-emerald-400' : (financials.ltv_cac_ratio ?? 0) >= 1.5 ? 'text-amber-400' : 'text-red-400'}`}>
                        {(financials.ltv_cac_ratio ?? 0).toFixed(1)}x
                    </div>
                </div>
            </div>

            <div className="mt-3 text-[9px] text-slate-600 font-mono text-center">
                Burn rate $65K/mo · {financials.assumption_source === 'sector_benchmark' ? 'Sector benchmark assumptions' : 'Idea-linked assumptions'}
            </div>
        </motion.div>
    );
};

// ── Card 3: Competitor Pain Analysis ───────────────────────────────────────
const SentimentCard = ({ sentiment }: { sentiment: DSInsightsData['sentiment'] }) => {
    const competitors = sentiment?.competitors ?? [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />

            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Competitor Pain Analysis</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">VADER NLP · curated KB</p>
                </div>
            </div>

            <div className="mb-4 text-[9px] text-slate-600 font-mono">
                Source: {sentiment?.signal_source === 'named_competitors' ? 'Named competitor signals' : 'Sector fallback signals'}
            </div>
            {competitors.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No competitor pain data available</div>
            ) : (
                <div className="space-y-4">
                    {competitors.slice(0, 4).map((c, i) => (
                        <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-slate-200 text-sm">{c.name}</span>
                                <div className="flex items-center gap-1.5">
                                    <Activity className="w-3 h-3 text-orange-400" />
                                    <span className={`text-xs font-black ${getPainColor(c.pain_score)}`}>
                                        {(c.pain_score ?? 0).toFixed(1)}/5.0 pain
                                    </span>
                                </div>
                            </div>

                            {/* Pain bar */}
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((c.pain_score ?? 0) / 5) * 100}%` }}
                                    transition={{ delay: 0.4 + i * 0.1, duration: 0.6 }}
                                    className={`h-full rounded-full ${c.pain_score >= 3.5 ? 'bg-emerald-500' : c.pain_score >= 2 ? 'bg-amber-500' : 'bg-slate-500'}`}
                                />
                            </div>

                            {/* Top complaints */}
                            {c.top_complaints && c.top_complaints.length > 0 && (
                                <div className="mb-2 space-y-1">
                                    {c.top_complaints.slice(0, 2).map((complaint, j) => (
                                        <div key={j} className="text-[10px] text-slate-400 flex items-start gap-1.5">
                                            <span className="text-red-400 shrink-0">›</span>
                                            {complaint}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Kill strategy */}
                            {c.kill_strategy && (
                                <div className="mt-2 pt-2 border-t border-slate-800">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-orange-400 mb-1">Kill Strategy</div>
                                    <div className="text-[10px] text-slate-300 leading-relaxed">{c.kill_strategy}</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

// ── Main export ─────────────────────────────────────────────────────────────
export default function DSInsights({ data }: DSInsightsProps) {
    if (!data) return null;

    return (
        <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
        >
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
                <div className="flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full">
                    <Brain className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-300">
                        DS Intelligence Layer
                    </span>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
            </div>

            {/* Three cards in responsive grid */}
            <div className="grid md:grid-cols-3 gap-6">
                {data.survival && <SurvivalCard survival={data.survival} />}
                {data.financials && <MonteCarloCard financials={data.financials} />}
                {data.sentiment && <SentimentCard sentiment={data.sentiment} />}
            </div>

            {/* Latency badge */}
            {data.meta?.pipeline_latency_ms !== undefined && (
                <div className="mt-4 text-center">
                    <span className="text-[9px] font-mono text-slate-600">
                        DS pipeline completed in {data.meta.pipeline_latency_ms.toFixed(0)} ms · {data.meta.evidence_policy || 'heuristic_support_only'}
                    </span>
                </div>
            )}
        </motion.section>
    );
}
