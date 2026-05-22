import React, { useState, useRef, useMemo, useEffect, startTransition } from 'react';
import api from '../../services/api';
import {
    ChevronRight, TrendingUp, Users, Scale, Hammer,
    Megaphone, Briefcase, Rocket, Search, Clock,
    ExternalLink, Loader2, AlertTriangle, Link as LinkIcon,
    Database, Sparkles, Info, DollarSign, Shield, Zap, Lock, Target
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { RealData, Competitor, DSInsightsData, FieldProvenance, CredibilityStatus } from '../../types';
import ForensicReport from '../../components/ForensicReport';
import DSInsights from '../../components/DSInsights';
import AnalysisHeader from '../../components/AnalysisHeader';
import RiskBadge from '../../components/RiskBadge';
import { API_BASE_URL } from '../../config';
import { getCachedResult, setCachedResult } from '../../services/cache';

// --- HONEST DATA HELPERS ---
const NF = "NOT_FOUND";
const isNF = (v: any) => !v || v === NF || String(v).toLowerCase().includes("not_found");
// fmt: renders a value or a styled "—" badge when data wasn't found
const fmt = (v: any, fallback = "—") => isNF(v) ? fallback : v;
const DataBadge = () => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-500 border border-slate-700">
        DATA NOT AVAILABLE
    </span>
);
const FmtValue = ({ v, className = "" }: { v: any; className?: string }) =>
    isNF(v) ? <DataBadge /> : <span className={className}>{v}</span>;

const STATUS_STYLES: Record<CredibilityStatus, string> = {
    verified: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    estimated: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    inferred: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    unsupported: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
};

const CredibilityBadge = ({ status }: { status?: CredibilityStatus }) => {
    const safeStatus: CredibilityStatus = status || 'unsupported';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${STATUS_STYLES[safeStatus]}`}>
            {safeStatus}
        </span>
    );
};

const ProvenanceHint = ({ item }: { item?: FieldProvenance }) => {
    if (!item) return null;
    return (
        <div className="mt-2 space-y-1">
            <CredibilityBadge status={item.status} />
            {item.notes && <p className="text-[10px] text-slate-500 leading-relaxed">{item.notes}</p>}
            {item.source_quote && <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-3">"{item.source_quote}"</p>}
            {item.source_url && (
                <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    {item.source_title || 'Source'}
                </a>
            )}
        </div>
    );
};

// --- SUB-COMPONENTS FOR 10/10 UX ---

const MarketGrowthChart = ({ currentTam, forecastTam, growth, year }: { currentTam: string, forecastTam: string, growth: string, year: string }) => {
    const data = useMemo(() => {
        const parseVal = (s: string) => {
            if (!s || isNF(s)) return 0;
            const cleaned = s.replace(/[^0-9.]/g, '');
            if (!cleaned) return 0;
            const num = parseFloat(cleaned);
            if (isNaN(num)) return 0;

            const lower = s.toLowerCase();
            if (lower.includes('b')) return num;
            if (lower.includes('t')) return num * 1000;
            if (lower.includes('m')) return num / 1000;
            return num;
        };

        const startVal = parseVal(currentTam);
        const endVal = parseVal(forecastTam);
        const steps = 5;
        const chartData = [];
        const startYear = 2025;
        const endYear = parseInt(year) || 2030;

        for (let i = 0; i <= steps; i++) {
            const ratio = i / steps;
            chartData.push({
                year: startYear + Math.round((endYear - startYear) * ratio),
                value: parseFloat((startVal + (endVal - startVal) * ratio).toFixed(2))
            });
        }
        return chartData;
    }, [currentTam, forecastTam, year]);

    return (
        <div className="h-[200px] w-full mt-6 opacity-80 hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                        dataKey="year"
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px' }}
                        itemStyle={{ color: '#10b981' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorVal)"
                        strokeWidth={2}
                        animationDuration={2000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const PitchStrengthMeter = ({ input }: { input: string }) => {
    const strength = useMemo(() => {
        if (!input) return 0;
        let score = 0;
        if (input.length > 20) score += 20;
        if (input.length > 50) score += 20;
        if (input.includes('AI') || input.includes('SaaS') || input.includes('Platform')) score += 20;
        if (/\d/.test(input)) score += 20;
        if (input.split(' ').length > 10) score += 20;
        return score;
    }, [input]);

    const getLabel = () => {
        if (strength < 30) return "Vague Idea";
        if (strength < 60) return "Developing Concept";
        if (strength < 90) return "Solid Pitch";
        return "High-Conviction Vision";
    };

    const getColor = () => {
        if (strength < 30) return "bg-red-500";
        if (strength < 60) return "bg-amber-500";
        return "bg-emerald-500";
    };

    return (
        <div className="mt-4 w-full px-2">
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{getLabel()}</span>
                <span className="text-[10px] font-black text-slate-400">{strength}%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${strength}%` }}
                    className={`h-full ${getColor()} shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-colors duration-500`}
                />
            </div>
        </div>
    );
};

const ForensicDossier = ({ forensics }: { forensics?: any }) => {
    if (!forensics) return null;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full grid md:grid-cols-3 gap-6"
        >
            <div className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Database className="w-24 h-24 text-cyan-500" />
                </div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-cyan-500/10 rounded-lg"><Clock className="w-5 h-5 text-cyan-400" /></div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Agent Reasoning Trace</h3>
                </div>
                <div className="bg-black/40 rounded-xl p-4 font-mono text-[10px] md:text-xs text-slate-400 space-y-2 max-h-48 overflow-y-auto scrollbar-hide border border-white/5">
                    {forensics.reasoning_trace.map((step: string, i: number) => (
                        <div key={i} className="flex gap-3">
                            <span className="text-cyan-600 shrink-0">[{i}]</span>
                            <span className="leading-relaxed">{step}</span>
                        </div>
                    ))}
                    <div className="text-cyan-400 animate-pulse">_ EXECUTION_COMPLETE</div>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center relative group overflow-hidden">
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Veracity Index</div>
                    <div className="text-4xl font-black text-emerald-400 tracking-tighter mb-1">{Math.round(forensics.veracity_index * 100)}%</div>
                    <div className="text-[10px] font-bold text-slate-600 uppercase">Source Authority</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center relative group overflow-hidden">
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Data Confidence</div>
                    <div className="text-4xl font-black text-blue-400 tracking-tighter mb-1">{Math.round(forensics.confidence_score * 100)}%</div>
                    <div className="text-[10px] font-bold text-slate-600 uppercase">Forensic Weight</div>
                </div>
            </div>
        </motion.div>
    );
};

function ValidatorApp({ onSave, data, setData, setStatus }: { onSave: (report: RealData) => void, data: RealData | null, setData: (r: RealData | null) => void, setStatus: (s: 'idle' | 'processing' | 'active') => void }) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState("");
    const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
    const [isSaved, setIsSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeDepartment, setActiveDepartment] = useState<string | null>('Product');
    const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
    const [dsData, setDsData] = useState<DSInsightsData | null>(null);
    const [dsLoading, setDsLoading] = useState(false);
    const [isFromCache, setIsFromCache] = useState(false);
    const [deepIntel, setDeepIntel] = useState<{ fin: any; gtm: any; risk: any } | null>(null);
    const [deepIntelLoading, setDeepIntelLoading] = useState(false);
    const [deepIntelOpen, setDeepIntelOpen] = useState<string | null>(null);
    const [extIntel, setExtIntel] = useState<{ personas: any; redFlags: any; pricing: any; funding: any; legalRisks: any; traction: any; moat: any; exit: any } | null>(null);
    const [extIntelLoading, setExtIntelLoading] = useState(false);
    const [extIntelOpen, setExtIntelOpen] = useState<string | null>(null);
    const [warData, setWarData] = useState<any | null>(null);
    const [warRoomOpen, setWarRoomOpen] = useState<number | null>(null);
    // OPT 8: SSE stage progress state
    const [stage, setStage] = useState<string>('');
    // OPT 5: In-flight request deduplication refs
    const inFlightRef = useRef<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const extPayloadRef = useRef<{ idea: string; market_size: string; growth_rate: string } | null>(null);
    const cleanedTextRef = useRef<string>('');
    const [retryingSection, setRetryingSection] = React.useState<string | null>(null);
    const mkMeta = (r: any) => ({ provenance_level: r?.provenance_level, evidence_used: r?.evidence_used, error_reason: r?.error_reason });

    useEffect(() => {
        console.log("📊 [TRACKING] SCREEN_VIEW: Validator");
    }, []);

    // Fix: Ensure timestamp comparison is robust and doesn't trigger on fresh runs
    const isStale = useMemo(() => {
        if (!data || !data.timestamp) return false;
        const ageInMs = Date.now() - data.timestamp;
        return ageInMs > 24 * 60 * 60 * 1000;
    }, [data]);

    const getFieldProvenance = (fieldPath: string): FieldProvenance | undefined => data?.field_provenance?.[fieldPath];
    const renderPanelMeta = (meta: any) => {
        if (!meta?.provenance_level && !meta?.error_reason) return null;
        return (
            <div className="mt-3 flex flex-wrap gap-2 items-center">
                {meta?.provenance_level && <CredibilityBadge status={meta.provenance_level === 'inferred' ? 'inferred' : meta.provenance_level === 'generated' ? 'unsupported' : 'estimated'} />}
                {Array.isArray(meta?.evidence_used) && meta.evidence_used.length > 0 && (
                    <span className="text-[10px] text-slate-500">Inputs: {meta.evidence_used.join(', ')}</span>
                )}
                {meta?.error_reason && <span className="text-[10px] text-red-400">Issue: {meta.error_reason}</span>}
            </div>
        );
    };

    const renderSource = (market: any, input: string) => {
        let url = market.source_url;
        let name = market.source_name || "Analyst Consensus";

        const isGenericHomepage = (u: string) => {
            if (!u) return true;
            try {
                const path = new URL(u).pathname;
                return path === "/" || path.length < 2 || u.includes("statista.com/");
            } catch { return true; }
        };

        if (isGenericHomepage(url)) {
            const smartQuery = `https://www.google.com/search?q=${encodeURIComponent(input)} market size statistics 2025`;
            return (
                <a
                    href={smartQuery}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/30 border border-cyan-800/50 rounded-lg hover:bg-cyan-900/40 transition-colors group"
                >
                    <Search className="w-3 h-3 text-cyan-400 group-hover:text-cyan-300" />
                    <span className="text-[10px] font-medium text-cyan-300/80 group-hover:text-cyan-200">
                        Verify this Data
                    </span>
                </a>
            );
        }

        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/30 border border-cyan-800/50 rounded-lg hover:bg-cyan-900/40 transition-colors group"
            >
                <ExternalLink className="w-3 h-3 text-cyan-400 group-hover:text-cyan-300" />
                <span className="text-[10px] font-medium text-cyan-300/80 group-hover:text-cyan-200 truncate max-w-[150px]">
                    {name}
                </span>
            </a>
        );
    };

    const suggestions = [
        "AI Supply Chain SaaS",
        "Sustainable Urban Farming",
        "Mental Wellness Platform",
        "Decentralized Identity",
        "Renewable Energy Analytics"
    ];

    const reportRef = useRef<HTMLDivElement>(null);

    const generateHTML = () => {
        if (!data) return;

        // ── HTML helpers ───────────────────────────────────────────────────
        const esc = (s: any): string => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        const nfv = (x: any) => !x || isNF(String(x));
        const KV = (label: string, x: any) => nfv(x) ? '' : `<div class="kv"><span class="kl">${esc(label)}</span><span class="kv-v">${esc(String(x))}</span></div>`;
        const P  = (t: any) => nfv(t) ? '' : `<p>${esc(String(t))}</p>`;
        const H2 = (t: string, color = '') => `<h2${color ? ` style="color:${color}"` : ''}>${esc(t)}</h2>`;
        const H3 = (t: string) => `<h3>${esc(t)}</h3>`;
        const UL = (items: any[], fn?: (i: any) => string) => !items?.length ? '' : `<ul>${items.map(i => `<li>${fn ? fn(i) : esc(String(i))}</li>`).join('')}</ul>`;
        const SEV = (s: string) => { const su = String(s || '').toUpperCase(); const c: Record<string,string> = {HIGH:'#ef4444',CRITICAL:'#dc2626',MEDIUM:'#f59e0b',LOW:'#10b981'}; return `<span class="badge" style="background:${c[su] || '#64748b'}">${su}</span>`; };
        const SEC = (title: string, color: string, content: string) => !content.trim() ? '' : `<section><h1 class="sec-title" style="color:${color};border-left-color:${color}">${esc(title)}</h1>${content}</section>`;
        const LNK = (url: string, label?: string) => url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label || url)}</a>` : '';
        const HR  = () => '<hr>';

        let html = '';

        // ── I. Strategic Verdict ───────────────────────────────────────────
        const gm = data.god_mode as any;
        if (gm) html += SEC('I. Strategic Verdict', '#10b981', `
            ${gm.macro_verdict ? `<blockquote>"${esc(gm.macro_verdict)}"</blockquote>` : ''}
            ${P(gm.swarm_summary)}
            ${KV('Risk Score', gm.risk_score)}
            ${gm.pivot_warning ? H3('Pivot Warning') + P(gm.pivot_warning) : ''}
        `);

        // ── II. Market Intelligence ────────────────────────────────────────
        const mkt = data.market as any;
        if (mkt) html += SEC('II. Market Intelligence', '#0ea5e9', `
            ${KV('Current TAM', mkt.current_tam)}
            ${KV('Forecast TAM', mkt.forecast_tam ? `${mkt.forecast_tam} (${mkt.forecast_year || '2030'})` : null)}
            ${KV('Growth (CAGR)', mkt.growth)}
            ${KV('Revenue Model', mkt.revenue_model)}
            ${KV('Confidence', mkt.confidence)}
            ${KV('Source', mkt.source_name)}
            ${mkt.timing?.label ? H3('Market Timing') + KV('Signal', mkt.timing.label) + P(mkt.timing.rationale) : ''}
        `);

        // ── III. Survival & Risk Analysis ──────────────────────────────────
        if (dsData) {
            const sv  = (dsData as any).survival  as any;
            const fin = (dsData as any).financials as any;
            const cb  = sv?.confidence_band;
            html += SEC('III. Survival & Risk Analysis', '#8b5cf6', `
                ${KV('Survival Probability', sv?.survival_probability != null ? `${Math.round(sv.survival_probability * 100)}%` : null)}
                ${KV('Risk Tier', sv?.risk_tier)}
                ${cb?.length === 2 ? KV('Confidence Band', `${Math.round(cb[0]*100)}% – ${Math.round(cb[1]*100)}%`) : ''}
                ${sv?.top_risk_factors?.length ? H3('Risk Factors') + UL(sv.top_risk_factors) : ''}
                ${sv?.similar_winners?.length ? H3('Similar Winners') + UL(sv.similar_winners) : ''}
                ${sv?.similar_losers?.length  ? H3('Similar Losers')  + UL(sv.similar_losers)  : ''}
                ${fin?.base?.runway_months ? KV('Monte Carlo Runway (Base)', `${fin.base.runway_months} months`) : ''}
                ${fin?.bear?.runway_months ? KV('Monte Carlo Runway (Bear)', `${fin.bear.runway_months} months`) : ''}
                ${fin?.breakeven_probability != null ? KV('Breakeven Probability', `${Math.round(fin.breakeven_probability * 100)}%`) : ''}
            `);
        }

        // ── IV. Competitor Forensic Dossiers ───────────────────────────────
        if (data.competitors?.length) {
            html += SEC('IV. Competitor Forensic Dossiers', '#f87171',
                (data.competitors as any[]).map((c, i) => `
                    <div class="comp-card">
                        <div class="comp-name">${i + 1}. ${esc(c.name)}</div>
                        ${KV('Funding', c.market_fin?.funding)}
                        ${KV('Investors', c.market_fin?.investors)}
                        ${KV('Pricing', c.product_intel?.pricing)}
                        ${KV('Key Features', Array.isArray(c.product_intel?.features) ? c.product_intel.features.join(', ') : c.product_intel?.features)}
                        ${KV('Tech Stack', c.technical_infra?.stack)}
                        ${KV('Fatal Weakness', c.weakness)}
                        ${c.kill_strategy ? `<div class="kill">${esc(c.kill_strategy)}</div>` : ''}
                    </div>
                `).join('')
            );
        }

        // ── V. MVP Blueprint ───────────────────────────────────────────────
        if (data.gen_ui) {
            const g = data.gen_ui as any;
            html += SEC('V. MVP Blueprint', '#fb923c', `
                ${g.feature ? H3('Core Feature') + P(g.feature) : ''}
                ${g.desc ? H3('Description') + P(g.desc) : ''}
            `);
        }

        // ── VI. Execution Playbook ─────────────────────────────────────────
        const depts = [
            { name: 'Legal',     items: (data.dept_legal     || []) as string[] },
            { name: 'Product',   items: (data.dept_product   || []) as string[] },
            { name: 'Marketing', items: (data.dept_marketing || []) as string[] },
            { name: 'Finance',   items: (data.dept_finance   || []) as string[] },
        ].filter(d => d.items.length);
        if (depts.length) {
            html += SEC('VI. Execution Playbook', '#6366f1',
                depts.map(d => `
                    <div class="dept-group">
                        <div class="dept-title">${esc(d.name)}</div>
                        <ol>${d.items.map(item => `<li>${esc(item)}</li>`).join('')}</ol>
                    </div>
                `).join('')
            );
        }

        // ── VII. Competitive Battlefield ───────────────────────────────────
        if (warData) {
            const wr = warData as any;
            let warContent = '';
            if (wr.god_mode?.macro_verdict) warContent += `<blockquote>"${esc(wr.god_mode.macro_verdict)}"</blockquote>`;
            if (wr.god_mode?.swarm_summary) warContent += P(wr.god_mode.swarm_summary);
            if (wr.competitors?.length) {
                warContent += H3('Competitor Kill Strategies');
                warContent += (wr.competitors as any[]).map((c: any) => `
                    <div class="comp-card">
                        <div class="comp-name">${esc(c.name)}</div>
                        ${KV('Funding', c.market_fin?.funding)}
                        ${KV('Pricing', c.product_intel?.pricing)}
                        ${c.kill_strategy ? `<div class="kill">${esc(c.kill_strategy)}</div>` : ''}
                    </div>
                `).join('');
            }
            const swot = wr.god_mode?.swot;
            if (swot) {
                warContent += H3('SWOT Analysis');
                warContent += `<div class="swot-grid">${[
                    { label: 'STRENGTHS',    items: swot.strengths,    color: '#10b981' },
                    { label: 'WEAKNESSES',   items: swot.weaknesses,   color: '#ef4444' },
                    { label: 'OPPORTUNITIES',items: swot.opportunities, color: '#0ea5e9' },
                    { label: 'THREATS',      items: swot.threats,      color: '#f59e0b' },
                ].map(q => !q.items?.length ? '' : `
                    <div class="swot-card">
                        <div class="swot-label" style="color:${q.color}">${q.label}</div>
                        ${UL(q.items)}
                    </div>
                `).join('')}</div>`;
            }
            if (warContent) html += SEC('VII. Competitive Battlefield', '#ec4899', warContent);
        }

        // ── VIII. Deep Intelligence ────────────────────────────────────────
        if (deepIntel) {
            let di = '';
            if (deepIntel.fin) {
                const f = deepIntel.fin as any;
                di += H2('Financial Projection', '#10b981');
                di += KV('Pricing Model', f.assumptions?.pricing_model);
                di += KV('LTV:CAC Ratio', f.assumptions?.ltv_cac_ratio);
                di += KV('Gross Margin', f.assumptions?.gross_margin);
                di += KV('Payback Period', f.assumptions?.payback_period);
                di += KV('Recommended Round', f.fundraising?.recommended_round);
                di += KV('Runway', f.fundraising?.runway_months);
                if (f.projections?.length) {
                    di += H3('Year-by-Year Projections');
                    di += (f.projections as any[]).map((p: any) => `
                        <div class="proj-row">
                            <span class="proj-year">${esc(String(p.year))}</span>
                            <span>Revenue: <strong>${esc(p.revenue || '—')}</strong></span>
                            <span>Users: <strong>${esc(p.users || '—')}</strong></span>
                            <span>Burn: <strong>${esc(p.burn || '—')}</strong></span>
                        </div>
                    `).join('');
                }
                if (f.fundraising?.use_of_funds) { di += H3('Use of Funds'); di += P(f.fundraising.use_of_funds); }
                if (f.verdict) { di += H3('Financial Verdict'); di += P(f.verdict); }
                di += HR();
            }
            if (deepIntel.gtm) {
                const g = deepIntel.gtm as any;
                di += H2('Go-to-Market Strategy', '#0ea5e9');
                di += KV('North Star Metric', g.north_star_metric);
                di += KV('ICP', g.icp);
                if (g.channels?.length) {
                    di += H3('Acquisition Channels');
                    di += (g.channels as any[]).map((ch: any) => `
                        <div class="chan-card">
                            <div style="font-weight:800;color:#f1f5f9;margin-bottom:6px">${esc(ch.name)}${ch.priority ? ` &nbsp;<span class="badge" style="background:#1e293b;color:#94a3b8">${esc(ch.priority)}</span>` : ''}</div>
                            ${(ch.cac || ch.timeline) ? `<div style="font-size:12px">CAC: ${esc(ch.cac || '—')} &nbsp;·&nbsp; Timeline: ${esc(ch.timeline || '—')}</div>` : ''}
                        </div>
                    `).join('');
                }
                if (g.growth_lever) { di += H3('Growth Lever'); di += P(g.growth_lever); }
                if (g.first_100_customers) { di += H3('First 100 Customers'); di += P(g.first_100_customers); }
                di += HR();
            }
            if (deepIntel.risk) {
                const r = deepIntel.risk as any;
                di += H2('Risk Scanner', '#ef4444');
                di += KV('Overall Risk', r.overall_risk);
                if (r.risks?.length) {
                    di += H3('Risk Register');
                    di += (r.risks as any[]).map((ri: any) => `
                        <div class="risk-item">
                            ${SEV(ri.severity)}
                            <div style="font-weight:700;color:#f1f5f9;margin-bottom:8px">${esc(ri.title || '')}</div>
                            ${P(ri.description)}
                            ${ri.mitigation ? `<div class="mitigation">Mitigation: ${esc(ri.mitigation)}</div>` : ''}
                        </div>
                    `).join('');
                }
                if (r.kill_condition) { di += H3('Kill Condition'); di += P(r.kill_condition); }
            }
            if (di) html += SEC('VIII. Deep Intelligence', '#10b981', di);
        }

        // ── IX. Extended Intelligence ──────────────────────────────────────
        if (extIntel) {
            let ex = '';
            if (extIntel.personas?.personas?.length) {
                ex += H2('Buyer Personas', '#fb923c');
                ex += (extIntel.personas.personas as any[]).map((p: any, i: number) => `
                    <div class="persona-card">
                        <div class="comp-name">${i + 1}. ${esc(p.name)}${p.role ? ` — ${esc(p.role)}` : ''}</div>
                        ${KV('Pain Point', p.pain_point)}
                        ${KV('Goal', p.goal)}
                        ${KV('Willingness to Pay', p.willingness_to_pay)}
                        ${KV('Acquisition Channel', p.acquisition_channel)}
                    </div>
                `).join('');
                ex += HR();
            }
            if (extIntel.redFlags) {
                const rf = extIntel.redFlags as any;
                ex += H2('Red Flags', '#ef4444');
                if (rf.red_flags?.length) {
                    ex += (rf.red_flags as any[]).map((f: any) => `
                        <div class="risk-item">
                            ${SEV(f.severity)}
                            <div style="font-weight:700;color:#f1f5f9;margin-bottom:8px">${esc(f.flag || '')}</div>
                            ${P(f.explanation)}
                            ${f.fix ? `<div class="mitigation">Fix: ${esc(f.fix)}</div>` : ''}
                        </div>
                    `).join('');
                }
                if (rf.verdict) { ex += H3('Red Flag Verdict'); ex += P(rf.verdict); }
                ex += HR();
            }
            if (extIntel.pricing) {
                const pr = extIntel.pricing as any;
                ex += H2('Pricing Intelligence', '#6366f1');
                ex += KV('Recommended Model', pr.recommended_model);
                ex += KV('Competitive Position', pr.competitive_comparison);
                ex += KV('LTV Estimate', pr.ltv_estimate);
                if (pr.price_points?.length) {
                    ex += H3('Price Tiers');
                    ex += `<table class="price-table">${(pr.price_points as any[]).map((pp: any) => `<tr><td class="pt-tier">${esc(pp.tier || '—')}</td><td>${esc(pp.price || '—')}</td></tr>`).join('')}</table>`;
                }
                ex += HR();
            }
            if (extIntel.funding) {
                const fu = extIntel.funding as any;
                ex += H2('Funding Readiness', '#10b981');
                ex += KV('Readiness Score', fu.readiness_score);
                ex += KV('Recommended Round', fu.recommended_round);
                ex += KV('Timeline', fu.timeline);
                if (fu.strengths?.length) { ex += H3('Strengths'); ex += UL(fu.strengths); }
                if (fu.gaps?.length) { ex += H3('Gaps to Close'); ex += UL(fu.gaps); }
                ex += HR();
            }
            if (extIntel.legalRisks) {
                const lr = extIntel.legalRisks as any;
                ex += H2('Legal Risk Map', '#ef4444');
                if (lr.risks?.length) {
                    ex += (lr.risks as any[]).map((r: any) => `
                        <div class="risk-item">
                            ${SEV(r.urgency)}
                            ${KV('Area', r.area)}
                            ${P(r.requirement)}
                            ${r.cost_estimate ? `<div style="font-size:12px;color:#64748b;margin-top:6px">Est. Cost: ${esc(r.cost_estimate)}</div>` : ''}
                        </div>
                    `).join('');
                }
                if (lr.biggest_legal_threat) { ex += H3('Biggest Legal Threat'); ex += P(lr.biggest_legal_threat); }
                ex += HR();
            }
            if (extIntel.traction) {
                const tr = extIntel.traction as any;
                ex += H2('Traction Roadmap', '#0ea5e9');
                if (tr.validation_methods?.length) {
                    ex += H3('Validation Methods');
                    ex += (tr.validation_methods as any[]).map((vm: any) => `
                        <div class="chan-card">
                            <div style="font-weight:800;color:#f1f5f9;margin-bottom:6px">${esc(vm.method || '')}</div>
                            ${(vm.timeline || vm.cost) ? `<div style="font-size:12px">Timeline: ${esc(vm.timeline || '—')} &nbsp;·&nbsp; Cost: ${esc(vm.cost || '—')}</div>` : ''}
                            ${vm.success_signal ? `<div style="font-size:12px;color:#10b981;margin-top:4px">Signal: ${esc(vm.success_signal)}</div>` : ''}
                        </div>
                    `).join('');
                }
                if (tr.pre_launch_strategy) { ex += H3('Pre-Launch Strategy'); ex += P(tr.pre_launch_strategy); }
                ex += HR();
            }
            if (extIntel.moat) {
                const mo = extIntel.moat as any;
                ex += H2('Competitive Moat', '#10b981');
                ex += KV('Moat Type', mo.moat_type);
                ex += KV('Durability', mo.durability);
                ex += KV('Defensibility Score', mo.defensibility_score);
                ex += KV('Time to Moat', mo.time_to_moat);
                if (mo.threats?.length) { ex += H3('Moat Threats'); ex += UL(mo.threats); }
                ex += HR();
            }
            if (extIntel.exit) {
                const ei = extIntel.exit as any;
                ex += H2('Exit Scenarios', '#fb923c');
                ex += KV('Most Likely Exit', ei.most_likely_exit);
                ex += KV('Timeline', ei.timeline);
                ex += KV('Valuation Range', ei.valuation_range);
                if (ei.scenarios?.length) {
                    ex += H3('Scenarios');
                    ex += (ei.scenarios as any[]).map((s: any) => `
                        <div class="comp-card">
                            <div style="font-weight:800;color:#f1f5f9;margin-bottom:8px">${esc(s.type || s.name || '—')} — ${esc(s.valuation || '—')} <span class="badge" style="background:#1e293b;color:#94a3b8">${esc(s.probability || '')}</span></div>
                            ${P(s.reasoning || s.description)}
                        </div>
                    `).join('');
                }
                if (ei.likely_acquirers?.length) {
                    ex += H3('Likely Acquirers');
                    ex += UL(ei.likely_acquirers, (a: any) => {
                        if (typeof a === 'string') return esc(a);
                        return esc(a?.name || a?.company || a?.acquirer || Object.values(a as object).filter(v => typeof v === 'string').join(' — '));
                    });
                }
                if (ei.value_drivers) {
                    ex += H3('Value Drivers');
                    const vd = Array.isArray(ei.value_drivers) ? ei.value_drivers : String(ei.value_drivers).split(',').map((s: string) => s.trim()).filter(Boolean);
                    ex += UL(vd);
                }
                if (ei.exit_blockers) {
                    ex += H3('Exit Blockers');
                    const eb = Array.isArray(ei.exit_blockers) ? ei.exit_blockers : String(ei.exit_blockers).split(',').map((s: string) => s.trim()).filter(Boolean);
                    ex += UL(eb);
                }
            }
            if (ex) html += SEC('IX. Extended Intelligence', '#fb923c', ex);
        }

        // ── X. Research Grounding ──────────────────────────────────────────
        const citations = (data as any).citations;
        if (citations?.length) {
            html += SEC('X. Research Grounding', '#64748b', `
                <p>${citations.length} source${citations.length !== 1 ? 's' : ''} cited — click any link to open.</p>
                ${(citations as any[]).map((c: any, i: number) => `
                    <div class="cite-item">
                        <span class="cite-num">${i + 1}.</span>
                        <span class="cite-title">${esc(c.title || c.url || `Source ${i + 1}`)}</span>
                        ${c.url ? `<br><span style="margin-left:20px">${LNK(c.url)}</span>` : ''}
                    </div>
                `).join('')}
            `);
        }

        // ── Assemble & download ────────────────────────────────────────────
        const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{background:#020617;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.7}
.cover{background:linear-gradient(135deg,#020617 0%,#0d1f3c 100%);border-left:6px solid #10b981;padding:64px 56px;min-height:240px}
.brand{font-size:11px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:#10b981;margin-bottom:28px}
.idea-title{font-size:40px;font-weight:900;color:#fff;letter-spacing:-.03em;line-height:1.1;margin-bottom:14px}
.subtitle{font-size:14px;color:#64748b;margin-bottom:5px}
.date-line{font-size:12px;color:#475569}
.conf{margin-top:32px;font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#1e293b}
.report{max-width:900px;margin:0 auto;padding:48px 24px}
section{margin-bottom:36px;background:#0f172a;border:1px solid #1e293b;border-radius:18px;padding:32px;overflow:hidden}
.sec-title{font-size:18px;font-weight:900;margin-bottom:22px;padding-bottom:14px;border-bottom:1px solid #1e293b;text-transform:uppercase;letter-spacing:.06em;border-left:4px solid;padding-left:14px}
h2{font-size:14px;font-weight:800;color:#e2e8f0;margin:22px 0 12px}
h3{font-size:10px;font-weight:900;color:#475569;text-transform:uppercase;letter-spacing:.18em;margin:18px 0 10px}
p{font-size:13px;color:#94a3b8;margin-bottom:12px;line-height:1.65}
blockquote{border-left:3px solid #10b981;padding:14px 18px;background:rgba(16,185,129,.07);border-radius:0 10px 10px 0;font-style:italic;color:#6ee7b7;margin-bottom:18px;font-size:14px;line-height:1.6}
.kv{display:flex;gap:16px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:13px;align-items:flex-start}
.kl{font-weight:700;color:#475569;min-width:160px;flex-shrink:0}
.kv-v{color:#cbd5e1}
ul{margin:8px 0 14px 20px}
ol{margin:8px 0 14px 20px}
li{font-size:13px;color:#94a3b8;margin-bottom:7px;line-height:1.5}
hr{border:none;border-top:1px solid #1e293b;margin:22px 0}
a{color:#22d3ee;text-decoration:none}
a:hover{text-decoration:underline}
.badge{display:inline-block;padding:2px 10px;border-radius:4px;font-size:10px;font-weight:800;color:#fff;letter-spacing:.08em;text-transform:uppercase;margin-right:6px;vertical-align:middle}
.comp-card{background:#0a1628;border:1px solid #1e293b;border-radius:12px;padding:20px;margin-bottom:14px}
.comp-name{font-size:15px;font-weight:800;color:#f1f5f9;margin-bottom:14px}
.kill{background:rgba(16,185,129,.07);border-left:3px solid #10b981;padding:10px 14px;border-radius:0 8px 8px 0;font-size:13px;color:#6ee7b7;margin-top:14px;line-height:1.5}
.dept-group{margin-bottom:20px}
.dept-title{font-size:12px;font-weight:800;color:#f1f5f9;margin-bottom:10px;padding:5px 12px;background:#1e293b;border-radius:6px;display:inline-block;letter-spacing:.05em}
.persona-card{background:#0a1628;border:1px solid #1e293b;border-radius:12px;padding:18px;margin-bottom:12px}
.chan-card{background:#0a1628;border:1px solid #1e293b;border-radius:8px;padding:14px;margin-bottom:10px;font-size:13px;color:#94a3b8}
.risk-item{background:#0a1628;border:1px solid #1e293b;border-radius:10px;padding:16px;margin-bottom:12px}
.mitigation{font-size:12px;color:#10b981;font-style:italic;margin-top:10px;line-height:1.5}
.cite-item{padding:12px 0;border-bottom:1px solid #1e293b;font-size:13px;line-height:1.7}
.cite-num{font-weight:800;color:#334155;margin-right:6px}
.cite-title{color:#94a3b8}
.price-table{width:100%;border-collapse:collapse;font-size:13px;margin:10px 0}
.price-table tr{border-bottom:1px solid #1e293b}
.price-table td{padding:8px 12px;color:#94a3b8}
.pt-tier{font-weight:700;color:#e2e8f0;width:150px}
.swot-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.swot-card{background:#0a1628;border-radius:10px;padding:16px;border:1px solid #1e293b}
.swot-label{font-size:10px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;margin-bottom:10px}
.proj-row{display:flex;flex-wrap:wrap;gap:20px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:13px;color:#94a3b8;align-items:center}
.proj-year{font-weight:800;color:#f1f5f9;min-width:70px}
.proj-row strong{color:#e2e8f0}
@media(max-width:640px){.swot-grid{grid-template-columns:1fr}.kl{min-width:110px}.idea-title{font-size:28px}.cover{padding:40px 24px}}
@media print{body,section{background:#fff!important;color:#1e293b!important}.cover{background:#f8fafc!important}.comp-card,.risk-item,.chan-card,.persona-card,.swot-card{background:#f8fafc!important;border-color:#e2e8f0!important}.kl{color:#374151!important}.kv-v,.cite-title,p,li{color:#4b5563!important}a{color:#0284c7!important}blockquote{background:#f0fdf4!important;color:#166534!important}}
        `.trim();

        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>LaunchMint AI — ${esc(input)}</title>
<style>${css}</style>
</head>
<body>
<div class="cover">
  <div class="brand">LAUNCHMINT AI · INTELLIGENCE BRIEF</div>
  <h1 class="idea-title">${esc(input.toUpperCase())}</h1>
  <p class="subtitle">Full intelligence report — all sections expanded</p>
  <p class="date-line">Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  <p class="conf">CONFIDENTIAL — FOR INTERNAL USE ONLY</p>
</div>
<div class="report">
${html}
</div>
</body>
</html>`;

        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LaunchMint_${input.replace(/\s+/g, '_')}.html`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const runAnalysis = async (text?: string) => {
        const textToAnalyze = text || input;
        const cleanedText = textToAnalyze.trim();

        // OPT 5: Deduplicate in-flight requests
        const dedupeKey = cleanedText.toLowerCase();
        if (inFlightRef.current === dedupeKey) return; // Already processing this idea
        if (loading) return;

        if (cleanedText.length < 5) { // Relaxed to 5 chars
            setError("Analysis requires a slightly longer description for meaningful grounding.");
            setInput('');
            return;
        }
        if (cleanedText.length > 300) {
            setError("Input too large. Please condense your idea to under 300 characters.");
            setInput('');
            return;
        }

        console.log("📊 [TRACKING] ANALYSIS_RUN:", cleanedText);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Check cache
        const cached = getCachedResult(cleanedText);
        if (cached) {
            console.log("🚀 Cache Hit:", cleanedText);
            setData(cached.data);
            setDsData(cached.dsData);
            setWarData(cached.warData);
            setDeepIntel(cached.deepIntel);
            setExtIntel(cached.extData);
            setInput(cleanedText);
            setIsFromCache(true);
            setStatus('active');
            return;
        }

        // OPT 5: Mark this idea as in-flight
        inFlightRef.current = dedupeKey;

        setLoading(true); setDsLoading(true); setData(null); setWarData(null); setDeepIntel(null); setExtIntel(null); setDsData(null); setError(null); setIsSaved(false); setIsFromCache(false);
        setActiveDepartment('Product'); setSelectedCompetitor(null); setInput(cleanedText);
        setTerminalLogs([]); setLoadingMsg("Initializing AI Agents...");
        setStage('');
        setStatus('processing');

        // OPT 8: SSE progress stream — updates stage label in skeleton
        const sseUrl = `${API_BASE_URL}/analyze/stream?idea=${encodeURIComponent(cleanedText)}`;
        let sseSource: EventSource | null = null;
        try {
            sseSource = new EventSource(sseUrl);
            sseSource.onmessage = (ev) => {
                try {
                    const payload = JSON.parse(ev.data);
                    setStage(payload.label || '');
                } catch { /* ignore parse errors */ }
            };
            sseSource.onerror = () => { sseSource?.close(); };
        } catch { /* SSE not critical — main fetch continues regardless */ }

        const logs = [
            "> Deploying market intelligence agent...",
            "> Searching Statista, Grand View Research...",
            "> Analyzing competitor positioning...",
            "> Running SWOT analysis...",
            "> Extracting forecast TAM...",
            "> Validating revenue model...",
            "> Building GTM strategy...",
            "> Synthesizing final verdict..."
        ];

        let logIndex = 0;
        const logInterval = setInterval(() => {
            if (logIndex < logs.length) {
                setTerminalLogs(prev => [...prev, logs[logIndex]]);
                logIndex++;
            }
        }, 600);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);

        try {
            const [response, warResponse] = await Promise.allSettled([
                api.post(`/analyze`, { idea: cleanedText }, { signal: controller.signal, retry: 2 } as any),
                api.post(`/war_room`, { idea: cleanedText }, { signal: controller.signal } as any),
            ]);

            clearTimeout(timeoutId);

            if (response.status === 'fulfilled') {
                if (!response.value.data || !response.value.data.market) {
                    throw new Error('Invalid response from server');
                }
                const resultData = { ...response.value.data, idea: cleanedText, timestamp: Date.now() };
                let resultDsData = null;

                // Fire ds_insights AFTER analyze so we can pass real competitor names
                const competitors = (resultData.competitors || []).map((c: any) => c.name).filter(Boolean);
                const marketData = resultData.market || {};
                try {
                    const dsResponse = await api.post(`/ds_insights`, {
                        idea: cleanedText,
                        market_data: { forecast_tam: marketData.forecast_tam, growth: marketData.growth },
                        competitors
                    });
                    const raw = dsResponse.data?.data;
                    if (raw && raw.survival && !raw.survival.error) {
                        resultDsData = raw;
                    }
                } catch (dsErr) {
                    console.warn('DS insights failed:', dsErr);
                }

                const resultWarData = warResponse.status === 'fulfilled' ? (warResponse.value.data || null) : null;
                if (resultWarData) setWarData(resultWarData);

                setData(resultData);
                setDsData(resultDsData);
                setCachedResult(cleanedText, resultData, resultDsData, resultWarData, null, null);
                setError(null);
                setStatus('active');

                // Fire deep intel in background — non-blocking
                setDeepIntelLoading(true);
                setExtIntelLoading(true);
                const mktSize = resultData.market?.forecast_tam || 'Unknown';
                const growth = resultData.market?.growth || 'Unknown';
                const extPayload = { idea: cleanedText, market_size: mktSize, growth_rate: growth };
                extPayloadRef.current = extPayload;
                cleanedTextRef.current = cleanedText;
                const deepTimeout = { timeout: 180000 };
                const extTimeout = { timeout: 180000 };
                const extTimeout2 = { timeout: 180000 };
                const mkFailed = () => ({ _failed: true });

                Promise.allSettled([
                    api.post('/run', { extension_id: 'financial-projection', payload: extPayload }, deepTimeout),
                    api.post('/run', { extension_id: 'gtm-strategy', payload: extPayload }, deepTimeout),
                    api.post('/run', { extension_id: 'risk-scanner', payload: extPayload }, deepTimeout),
                ]).then(([finRes, gtmRes, riskRes]) => {
                    const deepIntelResult = {
                        fin: finRes.status === 'fulfilled' ? { ...(finRes.value.data?.data || {}), _meta: { provenance_level: finRes.value.data?.provenance_level, evidence_used: finRes.value.data?.evidence_used, error_reason: finRes.value.data?.error_reason } } : { _failed: true },
                        gtm: gtmRes.status === 'fulfilled' ? { ...(gtmRes.value.data?.data || {}), _meta: { provenance_level: gtmRes.value.data?.provenance_level, evidence_used: gtmRes.value.data?.evidence_used, error_reason: gtmRes.value.data?.error_reason } } : { _failed: true },
                        risk: riskRes.status === 'fulfilled' ? { ...(riskRes.value.data?.data || {}), _meta: { provenance_level: riskRes.value.data?.provenance_level, evidence_used: riskRes.value.data?.evidence_used, error_reason: riskRes.value.data?.error_reason } } : { _failed: true },
                    };
                    setDeepIntel(deepIntelResult);
                    setCachedResult(cleanedText, resultData, resultDsData, resultWarData, deepIntelResult, null);
                    setDeepIntelLoading(false);

                    // Batch 1 (4 sections) fires after Deep Intel to prevent Gemini queue saturation
                    return Promise.allSettled([
                        api.post('/run', { extension_id: 'user-persona', payload: { idea: cleanedText } }, extTimeout),
                        api.post('/run', { extension_id: 'people-analysis', payload: { idea: cleanedText } }, extTimeout),
                        api.post('/run', { extension_id: 'pricing-strategy', payload: extPayload }, extTimeout),
                        api.post('/run', { extension_id: 'funding-readiness', payload: extPayload }, extTimeout),
                    ]);
                }).then((batch1Res) => {
                    if (!batch1Res) return;
                    const [personaRes, redFlagRes, pricingRes, fundingRes] = batch1Res;
                    const batch1 = {
                        personas: personaRes.status === 'fulfilled' ? { ...(personaRes.value.data?.data || {}), _meta: mkMeta(personaRes.value.data) } : mkFailed(),
                        redFlags: redFlagRes.status === 'fulfilled' ? { ...(redFlagRes.value.data?.data || {}), _meta: mkMeta(redFlagRes.value.data) } : mkFailed(),
                        pricing: pricingRes.status === 'fulfilled' ? { ...(pricingRes.value.data?.data || {}), _meta: mkMeta(pricingRes.value.data) } : mkFailed(),
                        funding: fundingRes.status === 'fulfilled' ? { ...(fundingRes.value.data?.data || {}), _meta: mkMeta(fundingRes.value.data) } : mkFailed(),
                        legalRisks: null, traction: null, moat: null, exit: null,
                    };
                    setExtIntel(batch1);

                    // Batch 2 (4 sections) fires after Batch 1 is done
                    return Promise.allSettled([
                        api.post('/run', { extension_id: 'legal-risks', payload: { idea: cleanedText } }, extTimeout2),
                        api.post('/run', { extension_id: 'traction-signals', payload: { idea: cleanedText } }, extTimeout2),
                        api.post('/run', { extension_id: 'moat-analysis', payload: { idea: cleanedText } }, extTimeout2),
                        api.post('/run', { extension_id: 'exit-scenarios', payload: extPayload }, extTimeout2),
                    ]).then(([legalRes, tractionRes, moatRes, exitRes]) => {
                        const extIntelResult = {
                            ...batch1,
                            legalRisks: legalRes.status === 'fulfilled' ? { ...(legalRes.value.data?.data || {}), _meta: mkMeta(legalRes.value.data) } : mkFailed(),
                            traction: tractionRes.status === 'fulfilled' ? { ...(tractionRes.value.data?.data || {}), _meta: mkMeta(tractionRes.value.data) } : mkFailed(),
                            moat: moatRes.status === 'fulfilled' ? { ...(moatRes.value.data?.data || {}), _meta: mkMeta(moatRes.value.data) } : mkFailed(),
                            exit: exitRes.status === 'fulfilled' ? { ...(exitRes.value.data?.data || {}), _meta: mkMeta(exitRes.value.data) } : mkFailed(),
                        };
                        setExtIntel(extIntelResult);
                        setCachedResult(cleanedText, resultData, resultDsData, resultWarData, null, extIntelResult);
                    });
                }).finally(() => {
                    setExtIntelLoading(false);
                });
            } else {
                if (response.reason.name === 'CanceledError' || response.reason.name === 'AbortError') {
                    throw new Error('TIMEOUT');
                }
                throw new Error(response.reason?.message || 'Analysis failed');
            }
        } catch (err: any) {
            console.error('Analysis error:', err);
            if (err.message === 'TIMEOUT') {
                setError("Analysis timed out — please try again. This usually resolves on the next attempt.");
            } else {
                const errorMessage = err.response?.data?.detail ||
                    err.message ||
                    'Unable to complete analysis. Please try again.';
                setError(errorMessage);
            }
            setData(null);
            setStatus('idle');
        } finally {
            clearInterval(logInterval);
            setLoading(false);
            setDsLoading(false);
            // OPT 8: Close SSE stream
            sseSource?.close();
            setStage('');
            // OPT 5: Clear in-flight marker
            inFlightRef.current = null;
        }
    };

    // OPT 5: Debounced button click handler (300ms)
    const handleAnalyzeClick = (text?: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            runAnalysis(text);
        }, 300);
    };

    const getDeptList = () => {
        if (!data) return [];
        switch (activeDepartment) {
            case 'Legal': return data.dept_legal || [];
            case 'Product': return data.dept_product || [];
            case 'Marketing': return data.dept_marketing || [];
            case 'Finance': return data.dept_finance || [];
            default: return [];
        }
    };

    return (
        <div className={`w-full flex-1 flex flex-col items-center px-4 md:px-0 ${!data && !loading ? 'justify-center' : ''}`}>
            {!data && !loading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full flex flex-col items-center"
                >
                    <div className="text-center pt-6 relative z-40 max-w-5xl mx-auto mb-10">
                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 leading-tight">
                            <span className="text-white block md:whitespace-nowrap">Validate your startup</span>
                            <span className="text-emerald-400 block md:whitespace-nowrap">in 30 seconds.</span>
                        </h1>
                        <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">Our advanced AI analyzes market trends, competition, and viability instantly.</p>
                    </div>

                    <div className="w-full max-w-3xl space-y-6 relative z-50">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-1000"></div>
                            <div className="relative flex items-center bg-[#0B1221] rounded-full p-2 pl-6 shadow-2xl border border-white/10">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Describe your game-changing idea..."
                                    className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm md:text-base outline-none h-10"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeClick(input)}
                                />
                                <button aria-label="Run startup analysis" onClick={() => handleAnalyzeClick(input)} className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 md:px-6 h-10 rounded-full font-bold text-[10px] md:text-xs tracking-wide transition-transform active:scale-95 flex items-center gap-2">
                                    VALIDATE <ChevronRight className="w-3 h-3 stroke-[3px]" />
                                </button>
                            </div>
                        </div>

                        <PitchStrengthMeter input={input} />

                        <div className="flex flex-col gap-3 items-center w-full">
                            <div className="flex flex-wrap justify-center gap-2 md:gap-3 w-full">
                                {suggestions.slice(0, 3).map((s) => (
                                    <button key={s} onClick={() => { setInput(s); runAnalysis(s); }} className="px-3 md:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[10px] md:text-xs text-gray-400 hover:text-white transition-all whitespace-nowrap">
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-wrap justify-center gap-2 md:gap-3 w-full">
                                {suggestions.slice(3, 5).map((s) => (
                                    <button aria-label={`Use suggestion: ${s}`} key={s} onClick={() => { setInput(s); runAnalysis(s); }} className="px-3 md:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[10px] md:text-xs text-gray-400 hover:text-white transition-all whitespace-nowrap">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {loading && (
                <div className="w-full max-w-4xl mx-auto mt-10 px-4">
                    <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl p-6 md:p-8 font-mono text-xs md:text-sm shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800">
                            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                            <span className="text-emerald-400 font-bold uppercase tracking-widest">
                                {/* OPT 8: Show SSE stage name when available */}
                                {stage || loadingMsg || 'Initializing AI Agents...'}
                            </span>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                            {terminalLogs.map((log, i) => (
                                <div key={i} className="text-slate-400 animate-in fade-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                                    {log}
                                </div>
                            ))}
                            {terminalLogs.length > 0 && (
                                <div className="text-emerald-500 animate-pulse">▮</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="w-full max-w-2xl mx-auto mt-10 animate-in fade-in slide-in-from-top-10 duration-500 px-4">
                    <div className="bg-red-950/20 border-2 border-red-500/50 rounded-2xl p-8 text-center">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Analysis Failed</h3>
                        <p className="text-red-300 mb-6">{error}</p>
                        <button onClick={() => runAnalysis(input)} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold transition-all">Try Again</button>
                    </div>
                </div>
            )}

            {data && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full max-w-5xl mx-auto flex flex-col gap-8 md:gap-10 mt-10 pb-20 px-4"
                >
                    {isFromCache && (
                        <div className="flex justify-center -mb-4">
                            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                Loaded from Cache
                            </div>
                        </div>
                    )}

                    {isStale && (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-amber-500" />
                                <span className="text-amber-200/80 text-xs font-bold uppercase tracking-widest">Stale Data — This analysis is over 1 hour old.</span>
                            </div>
                            <button
                                onClick={() => runAnalysis(data.idea)}
                                className="px-4 py-1.5 bg-amber-500 text-black rounded-lg text-[10px] font-black uppercase hover:bg-amber-400 transition-colors"
                            >
                                Re-run Analysis
                            </button>
                        </div>
                    )}

                    <AnalysisHeader
                        idea={input}
                        isSaved={isSaved}
                        onBack={() => { setData(null); setStatus('idle'); }}
                        onSave={() => { onSave(data); setIsSaved(true); }}
                        onExport={generateHTML}
                    />

                    {data.credibility && (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                <div>
                                    <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.25em] mb-2">Credibility Summary</div>
                                    <h2 className="text-xl md:text-2xl font-black text-white">Report status: {data.report_status?.replace(/_/g, ' ') || 'complete'}</h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {isStale && <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/15 border border-amber-500/30 text-amber-300">Cached report is stale</span>}
                                    {data.credibility.stale_sources.length > 0 && <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/15 border border-amber-500/30 text-amber-300">{data.credibility.stale_sources.length} stale source{data.credibility.stale_sources.length > 1 ? 's' : ''}</span>}
                                    {data.credibility.conflicts_detected?.length > 0 && <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500/15 border border-red-500/30 text-red-300">{data.credibility.conflicts_detected.length} source conflict{data.credibility.conflicts_detected.length > 1 ? 's' : ''}</span>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    ['Verified', data.credibility.grounded_fields, 'verified'],
                                    ['Estimated', data.credibility.estimated_fields, 'estimated'],
                                    ['Inferred', data.credibility.inferred_fields, 'inferred'],
                                    ['Unsupported', data.credibility.unsupported_fields, 'unsupported'],
                                ].map(([label, value, status]) => {
                                    const fields = Array.isArray(value) ? value as string[] : [];
                                    return (
                                    <div key={String(label)} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-[10px] uppercase tracking-widest font-black text-slate-500">{label}</div>
                                            <CredibilityBadge status={status as CredibilityStatus} />
                                        </div>
                                        <div className="text-3xl font-black text-white tracking-tighter">{fields.length}</div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {fields.map((f: string) => (
                                                <span key={f} className="text-[9px] font-mono text-slate-400 bg-slate-800/60 border border-slate-700/50 rounded px-1.5 py-0.5 break-all">
                                                    {f.replace('market.', '').replace('competitor.', '').replace('dept_', '').replace('god_mode', 'verdict')}
                                                </span>
                                            ))}
                                            {fields.length === 0 && <span className="text-[9px] text-slate-600 italic">none</span>}
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {data.god_mode && (
                        <div className="bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-950 border-4 border-emerald-500/50 rounded-[2.5rem] p-6 md:p-12 relative overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.2)]">
                            <div className="md:absolute top-0 right-0 p-4 md:p-8 flex justify-center mb-6 md:mb-0">
                                <RiskBadge riskScore={data.god_mode.risk_score} />
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/20 rounded-lg"><Sparkles className="w-6 md:w-8 h-6 md:h-8 text-emerald-400" /></div>
                                    <span className="text-emerald-400 font-bold uppercase tracking-[0.2em] text-[10px] md:text-sm">Final Strategic Verdict</span>
                                </div>
                                <h2 className="text-lg md:text-2xl font-bold text-white leading-tight md:pr-40 text-center md:text-left">"{data.god_mode.macro_verdict}"</h2>
                                <p className="text-emerald-100/70 text-xs md:text-sm leading-relaxed max-w-5xl">{data.god_mode.swarm_summary}</p>

                                <ForensicDossier forensics={data.forensics} />

                                {data.god_mode.pivot_warning && (
                                    <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/50 rounded-2xl flex items-start gap-3 animate-pulse">
                                        <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-amber-500 shrink-0" />
                                        <div>
                                            <div className="text-amber-500 font-bold text-[10px] md:text-sm uppercase">Strategic Pivot Warning</div>
                                            <div className="text-amber-200/80 text-xs md:text-sm">{data.god_mode.pivot_warning}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {dsData && (
                        <div className="w-full max-w-7xl mx-auto px-4 md:px-0">
                            <DSInsights data={dsData} />
                        </div>
                    )}
                    {/* ── END DS INTELLIGENCE LAYER ── */}

                    <div className="bg-slate-900/50 border border-slate-800 p-6 md:p-8 rounded-3xl relative">
                        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                            <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
                                <div className="flex items-center gap-3 text-emerald-400"><TrendingUp className="w-6 h-6" /><h2 className="text-xl font-bold text-white">Market Intel</h2></div>
                                {data.market.classified_industry && <div className="text-[10px] uppercase font-bold text-emerald-500/80 tracking-widest pl-0 md:pl-9">Sector: {data.market.classified_industry}</div>}
                            </div>
                            {renderSource(data.market, input)}
                        </div>

                        <div className="grid lg:grid-cols-2 gap-10 items-start">
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-50">TAM ({data.market.current_year || "2024/25"})</div>
                                        <FmtValue v={data.market.current_tam} className="text-2xl md:text-3xl font-black text-slate-400 tracking-tighter" />
                                        <ProvenanceHint item={getFieldProvenance('market.current_tam')} />
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-50">TAM ({data.market.forecast_year || "2030"})</div>
                                        <FmtValue v={data.market.forecast_tam || data.market.size} className="text-4xl md:text-5xl font-black text-white tracking-tighter" />
                                        <ProvenanceHint item={getFieldProvenance('market.forecast_tam')} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 flex items-center gap-2"><TrendingUp className="w-3 h-3 text-green-400" /> Growth</div>
                                        <div className="text-green-400 font-bold text-sm md:text-base">{isNF(data.market.growth) ? <DataBadge /> : `CAGR ${data.market.growth}`}</div>
                                        <ProvenanceHint item={getFieldProvenance('market.growth')} />
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 flex items-center gap-2"><Info className="w-3 h-3 text-blue-400" /> Confidence</div>
                                        <div className="text-blue-400 font-bold text-sm md:text-base">{data.market.confidence}</div>
                                    </div>
                                </div>
                                {data.monetization && (
                                    <div className="p-4 md:p-6 rounded-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20">
                                        <div className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mb-2">Revenue Strategy</div>
                                        <div className="text-white font-bold text-base md:text-lg mb-1"><FmtValue v={data.monetization.model} /></div>
                                        <div className="text-slate-400 text-[11px] md:text-xs leading-relaxed font-medium"><FmtValue v={data.monetization.strategy} /></div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-950/50 p-4 md:p-6 rounded-2xl border border-slate-800">
                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">Projected Growth Vector</div>
                                {!isNF(data.market.current_tam) && !isNF(data.market.forecast_tam) ? (
                                    <MarketGrowthChart
                                        currentTam={data.market.current_tam}
                                        forecastTam={data.market.forecast_tam || data.market.size}
                                        growth={data.market.growth}
                                        year={data.market.forecast_year}
                                    />
                                ) : (
                                    <div className="h-[200px] flex items-center justify-center text-slate-600 text-xs font-bold uppercase tracking-widest">
                                        Insufficient data to plot growth vector
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        <div className="bg-slate-900/50 border border-slate-800 p-6 md:p-8 rounded-3xl h-full">
                            <div className="flex items-center gap-3 text-purple-400 mb-6"><Users className="w-6 h-6" /><h2 className="text-xl font-bold text-white">Top Competitors</h2></div>
                            <div className="space-y-4">
                                {data.competitors && data.competitors.length > 0 ? data.competitors.slice(0, 3).map((c, i) => (
                                    <motion.div
                                        whileHover={{ x: 4 }}
                                        key={i}
                                        onClick={() => setSelectedCompetitor(c)}
                                        className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-2"><span className="font-bold text-slate-200 group-hover:text-white">{c.name}</span><ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-purple-400 transition-colors" /></div>
                                        <p className="text-xs text-red-400 leading-relaxed font-medium">Weakness: {c.weakness}</p>
                                        <div className="mt-2"><ProvenanceHint item={getFieldProvenance(`competitors.${i}.weakness`)} /></div>
                                    </motion.div>
                                )) : <div className="text-center py-8 text-slate-500"><Users className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">No competitors identified</p></div>}
                            </div>
                        </div>

                        {data.gen_ui && (
                            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500/30 rounded-3xl p-6 md:p-8 h-full flex flex-col">
                                <div className="flex items-center gap-3 mb-6"><Rocket className="w-6 h-6 text-purple-400" /><h2 className="text-xl md:text-2xl font-black text-white">The MVP Blueprint</h2></div>
                                <div className="space-y-4 flex-1">
                                    <h3 className="text-lg md:text-xl font-bold text-white bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-500/30">🎯 Killer Feature: {data.gen_ui.feature}</h3>
                                    <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-medium">{data.gen_ui.desc}</p>
                                </div>
                                <div className="mt-6 pt-6 border-t border-purple-500/20 text-[10px] text-purple-400 font-bold uppercase tracking-widest italic">Target: 4-Week Validation Cycle</div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-white flex items-center gap-3"><Hammer className="w-6 h-6 text-amber-500" /> Execution Strategy</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                            {[{ id: 'Legal', icon: Scale }, { id: 'Product', icon: Hammer }, { id: 'Marketing', icon: Megaphone }, { id: 'Finance', icon: Briefcase }].map((dept: any) => (
                                <button key={dept.id} onClick={() => setActiveDepartment(dept.id)} className={`p-4 md:p-6 border rounded-2xl transition-all text-center flex flex-col items-center gap-2 md:gap-3 ${activeDepartment === dept.id ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-cyan-500/30'}`}>
                                    <dept.icon className={`w-5 md:w-6 h-5 md:h-6 ${activeDepartment === dept.id ? 'text-emerald-400' : ''}`} />
                                    <span className="font-bold text-[10px] md:text-xs">{dept.id}</span>
                                </button>
                            ))}
                        </div>
                        <div className="bg-slate-900 border border-slate-700 p-6 md:p-8 rounded-2xl shadow-xl">
                            <h3 className="text-lg md:text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4">Top 5 Priorities: <span className="text-emerald-400">{activeDepartment}</span></h3>
                            <div className="space-y-3">
                                {getDeptList().slice(0, 5).map((item, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        key={i}
                                        className="flex items-start gap-3 p-4 rounded-xl bg-black/20 border border-slate-800/50 hover:border-slate-700 transition-colors"
                                    >
                                        <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">{i + 1}</div>
                                        <span className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed">{item}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── WAR ROOM INTEL (merged from War Room tab) ── */}
                    {warData && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Briefcase className="w-6 h-6 text-violet-400" />
                                <h2 className="text-2xl font-black text-white">War Room Intel</h2>
                                <span className="text-[10px] font-black text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">Corporate Spy</span>
                            </div>

                            {/* Cynical verdict */}
                            {warData.god_mode?.macro_verdict && (
                                <div className="bg-violet-950/20 border border-violet-500/30 rounded-2xl p-6">
                                    <div className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-2">Battlefield Verdict</div>
                                    <p className="text-slate-200 font-bold leading-relaxed">"{warData.god_mode.macro_verdict}"</p>
                                    {warData.god_mode.swarm_summary && <p className="text-slate-400 text-sm mt-3 leading-relaxed">{warData.god_mode.swarm_summary}</p>}
                                </div>
                            )}

                            {/* Competitor kill strategies */}
                            {warData.competitors?.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Kill Strategies</h3>
                                    {warData.competitors.slice(0, 3).map((c: any, i: number) => (
                                        <div key={i} className="bg-slate-900 border border-slate-800 hover:border-violet-500/40 transition-colors rounded-2xl p-5">
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div>
                                                    <span className="font-black text-white">{c.name}</span>
                                                    {c.market_fin?.funding && <span className="ml-3 text-[10px] text-violet-400 font-bold border border-violet-500/30 px-2 py-0.5 rounded-full">{c.market_fin.funding}</span>}
                                                </div>
                                                {c.product_intel?.pricing && <span className="text-[10px] text-slate-500 font-bold shrink-0">{c.product_intel.pricing}</span>}
                                            </div>
                                            {c.kill_strategy && (
                                                <div className="bg-black/30 border border-violet-500/10 rounded-xl p-3">
                                                    <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest block mb-1">Kill Strategy</span>
                                                    <p className="text-slate-300 text-xs leading-relaxed">{c.kill_strategy}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* SWOT from War Room */}
                            {warData.god_mode?.swot && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Strengths', key: 'strengths', color: 'text-emerald-400', border: 'border-emerald-500/20' },
                                        { label: 'Weaknesses', key: 'weaknesses', color: 'text-red-400', border: 'border-red-500/20' },
                                        { label: 'Opportunities', key: 'opportunities', color: 'text-blue-400', border: 'border-blue-500/20' },
                                        { label: 'Threats', key: 'threats', color: 'text-amber-400', border: 'border-amber-500/20' },
                                    ].map(({ label, key, color, border }) => (
                                        <div key={key} className={`bg-slate-950/50 border ${border} rounded-2xl p-4`}>
                                            <div className={`text-[10px] font-black ${color} uppercase tracking-widest mb-3`}>{label}</div>
                                            <ul className="space-y-1.5">
                                                {(warData.god_mode.swot[key] || []).map((item: string, i: number) => (
                                                    <li key={i} className="text-[10px] text-slate-400 leading-tight flex gap-2">
                                                        <span className={`${color} opacity-50 shrink-0`}>•</span>{item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── DEEP INTELLIGENCE EXTENSIONS ── */}
                    {(deepIntel || deepIntelLoading) && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Rocket className="w-6 h-6 text-cyan-400" />
                                <h2 className="text-2xl font-black text-white">Deep Intelligence</h2>
                                {deepIntelLoading && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
                            </div>
                            {[
                                { key: 'fin', label: 'Financial Projection', color: 'emerald', icon: Briefcase },
                                { key: 'gtm', label: 'GTM Strategy', color: 'violet', icon: Megaphone },
                                { key: 'risk', label: 'Risk Scanner', color: 'red', icon: AlertTriangle },
                            ].map(({ key, label, color, icon: Icon }) => (
                                <div key={key} className={`bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden`}>
                                    <button
                                        onClick={() => setDeepIntelOpen(deepIntelOpen === key ? null : key)}
                                        className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className={`w-5 h-5 text-${color}-400`} />
                                            <span className="font-black text-white text-sm uppercase tracking-widest">{label}</span>
                                            {!deepIntel?.[key as keyof typeof deepIntel] && deepIntelLoading && (
                                                <span className="text-[10px] text-slate-500 font-bold">LOADING...</span>
                                            )}
                                        </div>
                                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${deepIntelOpen === key ? 'rotate-90' : ''}`} />
                                    </button>
                                    {deepIntelOpen === key && !deepIntel?.[key as keyof typeof deepIntel] && deepIntelLoading && (
                                        <div className="px-5 pb-6 border-t border-slate-800 pt-4 space-y-3">
                                            {key === 'fin' && <>
                                                <div className="animate-pulse grid grid-cols-3 gap-3">
                                                    {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-emerald-900/20 rounded-xl border border-emerald-800/20"></div>)}
                                                </div>
                                                <div className="animate-pulse h-32 bg-slate-800/40 rounded-xl border border-slate-700/20"></div>
                                                <div className="animate-pulse flex gap-3"><div className="h-4 bg-emerald-800/20 rounded w-1/3"></div><div className="h-4 bg-slate-800/30 rounded w-1/4"></div></div>
                                            </>}
                                            {key === 'gtm' && <>
                                                {[...Array(3)].map((_, i) => <div key={i} className="animate-pulse flex gap-3 items-center"><div className="w-8 h-8 bg-violet-900/20 rounded-full shrink-0"></div><div className="flex-1 h-14 bg-slate-800/40 rounded-xl"></div></div>)}
                                                <div className="animate-pulse h-4 bg-violet-800/20 rounded w-2/5"></div>
                                            </>}
                                            {key === 'risk' && <>
                                                <div className="animate-pulse flex items-center gap-2 mb-1"><div className="h-5 w-20 bg-slate-800/40 rounded"></div><div className="h-6 w-16 bg-red-900/20 rounded-full"></div></div>
                                                {[...Array(3)].map((_, i) => <div key={i} className="animate-pulse h-24 bg-slate-800/40 rounded-xl border border-red-900/10"></div>)}
                                                <div className="animate-pulse h-14 bg-red-900/10 rounded-xl border border-red-800/20"></div>
                                            </>}
                                        </div>
                                    )}
                                    {deepIntelOpen === key && deepIntel?.[key as keyof typeof deepIntel] && (
                                        <div className="px-5 pb-6 border-t border-slate-800 pt-4">
                                            {renderPanelMeta((deepIntel[key as keyof typeof deepIntel] as any)?._meta)}
                                            {/* Timeout/network failure — show retry */}
                                            {(deepIntel[key as keyof typeof deepIntel] as any)?._failed && (
                                                <div className="p-5 bg-slate-950 rounded-xl border border-amber-900/40 text-center space-y-3">
                                                    <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
                                                    <p className="text-slate-400 text-sm font-semibold">This section timed out — the LLM took too long to respond.</p>
                                                    <p className="text-slate-500 text-xs">Click retry to load just this section.</p>
                                                    <button
                                                        disabled={retryingSection === `deep-${key}`}
                                                        onClick={async () => {
                                                            const sectionId = `deep-${key}`;
                                                            startTransition(() => {
                                                                setRetryingSection(sectionId);
                                                            });
                                                            const payload = key === 'fin' || key === 'gtm' || key === 'risk'
                                                                ? extPayloadRef.current
                                                                : { idea: cleanedTextRef.current };
                                                            const extId = key === 'fin' ? 'financial-projection' : key === 'gtm' ? 'gtm-strategy' : 'risk-scanner';
                                                            try {
                                                                const res = await api.post('/run', { extension_id: extId, payload }, { timeout: 180000 });
                                                                setDeepIntel((prev: any) => ({
                                                                    ...prev,
                                                                    [key]: { ...(res.data?.data || {}), _failed: false, _meta: { provenance_level: res.data?.provenance_level, evidence_used: res.data?.evidence_used } }
                                                                }));
                                                            } catch (err: any) {
                                                                console.error(`[Retry] deep-${key} failed:`, err?.response?.data?.detail || err?.message);
                                                                // keep _failed=true so button stays visible
                                                                setDeepIntel((prev: any) => ({
                                                                    ...prev,
                                                                    [key]: { ...(prev?.[key] || {}), _failed: true }
                                                                }));
                                                            } finally {
                                                                startTransition(() => {
                                                                    setRetryingSection(null);
                                                                });
                                                            }
                                                        }}
                                                        className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-500/30 rounded-lg text-amber-400 text-xs font-bold transition-colors flex items-center gap-2 mx-auto"
                                                    >
                                                        {retryingSection === `deep-${key}` ? (
                                                            <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Retrying...</>
                                                        ) : <>↻ Retry {label}</>}
                                                    </button>
                                                </div>
                                            )}
                                            {/* LLM returned error response */}
                                            {!(deepIntel[key as keyof typeof deepIntel] as any)?._failed && deepIntel[key as keyof typeof deepIntel]?.error && (
                                                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                                                    <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                                                    <p className="text-slate-400 text-xs mb-3">Analysis unavailable — LLM did not return valid data for this section.</p>
                                                    <button
                                                        disabled={retryingSection === `deep-${key}`}
                                                        onClick={async () => {
                                                            const sectionId = `deep-${key}`;
                                                            startTransition(() => {
                                                                setRetryingSection(sectionId);
                                                            });
                                                            const payload = key === 'fin' || key === 'gtm' || key === 'risk'
                                                                ? extPayloadRef.current
                                                                : { idea: cleanedTextRef.current };
                                                            const extId = key === 'fin' ? 'financial-projection' : key === 'gtm' ? 'gtm-strategy' : 'risk-scanner';
                                                            try {
                                                                const res = await api.post('/run', { extension_id: extId, payload }, { timeout: 180000 });
                                                                setDeepIntel((prev: any) => ({
                                                                    ...prev,
                                                                    [key]: { ...(res.data?.data || {}), _failed: false, _meta: { provenance_level: res.data?.provenance_level, evidence_used: res.data?.evidence_used } }
                                                                }));
                                                            } catch (err: any) {
                                                                console.error(`[Retry] deep-${key} failed:`, err?.response?.data?.detail || err?.message);
                                                                setDeepIntel((prev: any) => ({
                                                                    ...prev,
                                                                    [key]: { ...(prev?.[key] || {}), _failed: true }
                                                                }));
                                                            } finally {
                                                                startTransition(() => {
                                                                    setRetryingSection(null);
                                                                });
                                                            }
                                                        }}
                                                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 rounded-lg text-slate-300 text-xs font-bold transition-colors flex items-center gap-2 mx-auto"
                                                    >
                                                        {retryingSection === `deep-${key}` ? (
                                                            <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Retrying...</>
                                                        ) : <>↻ Try Again</>}
                                                    </button>
                                                </div>
                                            )}
                                            {key === 'fin' && deepIntel.fin && !deepIntel.fin.error && (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                        {[
                                                            ['Pricing Model', deepIntel.fin.assumptions?.pricing_model],
                                                            ['LTV/CAC Ratio', deepIntel.fin.assumptions?.ltv_cac_ratio],
                                                            ['Gross Margin', deepIntel.fin.assumptions?.gross_margin],
                                                            ['Payback Period', deepIntel.fin.assumptions?.payback_period],
                                                            ['Recommended Round', deepIntel.fin.fundraising?.recommended_round],
                                                            ['Runway', deepIntel.fin.fundraising?.runway_months],
                                                        ].map(([k, v]) => (
                                                            <div key={k} className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                                                <div className="text-[10px] text-slate-500 font-black uppercase mb-1">{k}</div>
                                                                <div className="text-emerald-400 font-bold text-sm">{v || '—'}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {(deepIntel.fin.projections || []).map((p: any) => (
                                                            <div key={p.year} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                                                                <div className="text-[10px] text-slate-500 font-black uppercase mb-2">{p.year}</div>
                                                                <div className="text-white font-black text-base">{p.revenue}</div>
                                                                <div className="text-emerald-400 text-[10px] font-bold">{p.users} users</div>
                                                                <div className="text-slate-500 text-[10px]">burn {p.burn}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {deepIntel.fin.fundraising?.use_of_funds && (
                                                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                                            <div className="text-[10px] text-slate-500 font-black uppercase mb-1">Use of Funds</div>
                                                            <div className="text-emerald-300 text-xs">{deepIntel.fin.fundraising.use_of_funds}</div>
                                                        </div>
                                                    )}
                                                    <p className="text-slate-400 text-xs italic">{deepIntel.fin.verdict}</p>
                                                </div>
                                            )}
                                            {key === 'gtm' && deepIntel.gtm && !deepIntel.gtm.error && (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                                                            <div className="text-[10px] text-violet-400 font-black uppercase mb-1">North Star Metric</div>
                                                            <div className="text-white font-bold text-sm">{deepIntel.gtm.north_star_metric}</div>
                                                        </div>
                                                        {deepIntel.gtm.icp && (
                                                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                                                <div className="text-[10px] text-blue-400 font-black uppercase mb-1">Ideal Customer Profile</div>
                                                                <div className="text-white font-bold text-sm">{deepIntel.gtm.icp}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        {(deepIntel.gtm.channels || []).map((c: any, i: number) => (
                                                            <div key={i} className="flex items-start gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                                                                <span className="text-violet-400 font-black text-xs w-6 shrink-0 mt-0.5">{i + 1}</span>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="text-white font-bold text-xs">{c.name}</span>
                                                                        <span className="text-slate-500 text-[10px]">· CAC {c.cac}</span>
                                                                        <span className="text-slate-500 text-[10px]">· {c.timeline}</span>
                                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded ${c.priority === 'High' ? 'bg-violet-500/20 text-violet-400' : 'bg-slate-700 text-slate-400'}`}>{c.priority}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                                            <div className="text-[10px] text-slate-500 font-black uppercase mb-1">Growth Lever</div>
                                                            <div className="text-violet-300 text-xs">{deepIntel.gtm.growth_lever}</div>
                                                        </div>
                                                        {deepIntel.gtm.first_100_customers && (
                                                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                                                <div className="text-[10px] text-slate-500 font-black uppercase mb-1">First 100 Customers</div>
                                                                <div className="text-emerald-300 text-xs">{deepIntel.gtm.first_100_customers}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {key === 'risk' && deepIntel.risk && !deepIntel.risk.error && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-[10px] font-black uppercase text-slate-500">Overall Risk:</span>
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${deepIntel.risk.overall_risk === 'Critical' ? 'bg-red-500/20 text-red-400' : deepIntel.risk.overall_risk === 'High' ? 'bg-orange-500/20 text-orange-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                            {deepIntel.risk.overall_risk}
                                                        </span>
                                                    </div>
                                                    {(deepIntel.risk.risks || []).map((r: any, i: number) => (
                                                        <div key={i} className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-white font-bold text-xs">{r.title}</span>
                                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded ${r.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : r.severity === 'High' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-400'}`}>{r.severity}</span>
                                                            </div>
                                                            <p className="text-slate-400 text-[11px] mb-2">{r.description}</p>
                                                            <p className="text-emerald-400 text-[11px]">Mitigation: {r.mitigation}</p>
                                                        </div>
                                                    ))}
                                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                                        <div className="text-[10px] text-red-400 font-black uppercase mb-1">Kill Condition</div>
                                                        <div className="text-red-300 text-xs">{deepIntel.risk.kill_condition}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── EXTENDED INTELLIGENCE ── */}
                    {(extIntel || extIntelLoading) && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Users className="w-6 h-6 text-pink-400" />
                                <h2 className="text-2xl font-black text-white">Extended Intelligence</h2>
                                {extIntelLoading && <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />}
                            </div>
                            {[
                                { key: 'personas', label: 'User Personas', color: 'pink', icon: Users },
                                { key: 'redFlags', label: 'Red Flags', color: 'rose', icon: AlertTriangle },
                                { key: 'pricing', label: 'Pricing Strategy', color: 'emerald', icon: DollarSign },
                                { key: 'funding', label: 'Funding Readiness', color: 'blue', icon: TrendingUp },
                                { key: 'legalRisks', label: 'Legal & Compliance', color: 'yellow', icon: Shield },
                                { key: 'traction', label: 'Traction Signals', color: 'green', icon: Zap },
                                { key: 'moat', label: 'Moat Analysis', color: 'purple', icon: Lock },
                                { key: 'exit', label: 'Exit Scenarios', color: 'cyan', icon: Target },
                            ].map(({ key, label, color, icon: Icon }) => (
                                <div key={key} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                                    <button
                                        onClick={() => setExtIntelOpen(extIntelOpen === key ? null : key)}
                                        className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className={`w-5 h-5 text-${color}-400`} />
                                            <span className="font-black text-white text-sm uppercase tracking-widest">{label}</span>
                                            {!extIntel?.[key as keyof typeof extIntel] && extIntelLoading && (
                                                <span className="text-[10px] text-slate-500 font-bold">LOADING...</span>
                                            )}
                                        </div>
                                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${extIntelOpen === key ? 'rotate-90' : ''}`} />
                                    </button>
                                    {extIntelOpen === key && !extIntel?.[key as keyof typeof extIntel] && extIntelLoading && (
                                        <div className="px-5 pb-6 border-t border-slate-800 pt-4 space-y-3">
                                            {(key === 'personas' || key === 'redFlags') && <>
                                                {[...Array(3)].map((_, i) => <div key={i} className="animate-pulse p-4 bg-slate-950/60 rounded-xl border border-slate-800/40">
                                                    <div className="flex justify-between mb-2"><div className={`h-4 w-24 ${key === 'personas' ? 'bg-pink-900/20' : 'bg-rose-900/20'} rounded`}></div><div className="h-3 w-16 bg-slate-800/40 rounded"></div></div>
                                                    <div className="h-3 bg-slate-800/30 rounded w-4/5 mb-1"></div><div className="h-3 bg-slate-800/30 rounded w-3/5"></div>
                                                </div>)}
                                            </>}
                                            {key === 'pricing' && <>
                                                <div className="animate-pulse p-4 bg-slate-950/60 rounded-xl border border-slate-800/40">
                                                    <div className="h-4 w-32 bg-emerald-900/20 rounded mb-3"></div>
                                                    {[...Array(3)].map((_, i) => <div key={i} className="flex justify-between py-2 border-b border-slate-800/30"><div className="h-3 w-20 bg-slate-800/30 rounded"></div><div className="h-3 w-16 bg-emerald-900/20 rounded"></div></div>)}
                                                </div>
                                            </>}
                                            {key === 'funding' && <>
                                                <div className="animate-pulse flex items-center gap-4 mb-2"><div className="h-10 w-16 bg-blue-900/20 rounded-lg"></div><div className="h-4 w-32 bg-slate-800/30 rounded"></div></div>
                                                <div className="animate-pulse grid grid-cols-2 gap-3">
                                                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/40"><div className="h-3 w-16 bg-slate-800/30 rounded mb-2"></div><div className="h-3 w-full bg-emerald-900/15 rounded mb-1"></div><div className="h-3 w-3/4 bg-emerald-900/15 rounded"></div></div>
                                                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/40"><div className="h-3 w-12 bg-slate-800/30 rounded mb-2"></div><div className="h-3 w-full bg-red-900/15 rounded mb-1"></div><div className="h-3 w-2/3 bg-red-900/15 rounded"></div></div>
                                                </div>
                                            </>}
                                            {(key === 'legalRisks' || key === 'traction') && <>
                                                {[...Array(3)].map((_, i) => <div key={i} className="animate-pulse p-4 bg-slate-950/60 rounded-xl border border-slate-800/40">
                                                    <div className="flex justify-between mb-1"><div className={`h-4 w-28 ${key === 'legalRisks' ? 'bg-yellow-900/20' : 'bg-green-900/20'} rounded`}></div><div className="h-3 w-14 bg-slate-800/30 rounded"></div></div>
                                                    <div className="h-3 bg-slate-800/25 rounded w-full mt-2"></div>
                                                </div>)}
                                            </>}
                                            {key === 'moat' && <>
                                                <div className="animate-pulse flex items-center gap-4 mb-2"><div className="h-5 w-28 bg-purple-900/20 rounded"></div><div className="h-5 w-16 bg-slate-800/30 rounded-full"></div><div className="h-4 w-20 bg-slate-800/25 rounded"></div></div>
                                                <div className="animate-pulse p-3 bg-slate-950/60 rounded-xl border border-slate-800/40"><div className="h-3 w-14 bg-slate-800/30 rounded mb-2"></div><div className="h-3 w-4/5 bg-red-900/15 rounded mb-1"></div><div className="h-3 w-3/5 bg-red-900/15 rounded"></div></div>
                                            </>}
                                            {key === 'exit' && <>
                                                <div className="animate-pulse flex items-center gap-4 mb-2"><div className="h-5 w-24 bg-cyan-900/20 rounded"></div><div className="h-4 w-16 bg-slate-800/25 rounded"></div><div className="h-4 w-20 bg-emerald-900/15 rounded"></div></div>
                                                {[...Array(2)].map((_, i) => <div key={i} className="animate-pulse p-3 bg-slate-950/60 rounded-xl border border-slate-800/40">
                                                    <div className="flex justify-between mb-1"><div className="h-4 w-20 bg-slate-800/30 rounded"></div><div className="h-3 w-24 bg-cyan-900/15 rounded"></div></div>
                                                    <div className="h-3 bg-slate-800/25 rounded w-full mt-1"></div>
                                                </div>)}
                                            </>}
                                        </div>
                                    )}
                                    {extIntelOpen === key && extIntel?.[key as keyof typeof extIntel] && (
                                        <div className="px-5 pb-6 border-t border-slate-800 pt-4">
                                            {renderPanelMeta((extIntel[key as keyof typeof extIntel] as any)?._meta)}
                                            {/* Timeout/network failure — show retry */}
                                            {(extIntel[key as keyof typeof extIntel] as any)?._failed && (
                                                <div className="p-5 bg-slate-950 rounded-xl border border-amber-900/40 text-center space-y-3">
                                                    <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
                                                    <p className="text-slate-400 text-sm font-semibold">This section timed out — the LLM took too long to respond.</p>
                                                    <p className="text-slate-500 text-xs">Click retry to load just this section.</p>
                                                    <button
                                                        disabled={retryingSection === `ext-${key}`}
                                                        onClick={async () => {
                                                            const sectionId = `ext-${key}`;
                                                            startTransition(() => {
                                                                setRetryingSection(sectionId);
                                                            });
                                                            const extIdMap: Record<string, string> = {
                                                                personas: 'user-persona', redFlags: 'people-analysis',
                                                                pricing: 'pricing-strategy', funding: 'funding-readiness',
                                                                legalRisks: 'legal-risks', traction: 'traction-signals',
                                                                moat: 'moat-analysis', exit: 'exit-scenarios',
                                                            };
                                                            const needsMarket = ['pricing', 'funding', 'exit'];
                                                            const payload = needsMarket.includes(key) ? extPayloadRef.current : { idea: cleanedTextRef.current };
                                                            try {
                                                                const res = await api.post('/run', { extension_id: extIdMap[key], payload }, { timeout: 180000 });
                                                                setExtIntel((prev: any) => ({
                                                                    ...prev,
                                                                    [key]: { ...(res.data?.data || {}), _failed: false, _meta: mkMeta(res.data) }
                                                                }));
                                                            } catch (err: any) {
                                                                console.error(`[Retry] ext-${key} failed:`, err?.response?.data?.detail || err?.message);
                                                                // keep _failed=true so button stays visible for another attempt
                                                                setExtIntel((prev: any) => ({
                                                                    ...prev,
                                                                    [key]: { ...(prev?.[key] || {}), _failed: true }
                                                                }));
                                                            } finally {
                                                                startTransition(() => {
                                                                    setRetryingSection(null);
                                                                });
                                                            }
                                                        }}
                                                        className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-500/30 rounded-lg text-amber-400 text-xs font-bold transition-colors flex items-center gap-2 mx-auto"
                                                    >
                                                        {retryingSection === `ext-${key}` ? (
                                                            <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Retrying...</>
                                                        ) : <>↻ Retry {label}</>}
                                                    </button>
                                                </div>
                                            )}
                                            {/* LLM returned error response */}
                                            {!(extIntel[key as keyof typeof extIntel] as any)?._failed && extIntel[key as keyof typeof extIntel]?.error && (
                                                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                                                    <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                                                    <p className="text-slate-400 text-xs">Analysis unavailable — LLM did not return valid data for this section.</p>
                                                </div>
                                            )}
                                            {key === 'personas' && extIntel.personas && !extIntel.personas.error && (
                                                <div className="space-y-3">
                                                    {(extIntel.personas.personas || []).map((p: any, i: number) => (
                                                        <div key={i} className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-white font-black text-xs">{p.name}</span>
                                                                <span className="text-pink-400 text-[10px] font-bold">{p.role}</span>
                                                            </div>
                                                            <p className="text-slate-400 text-[11px] mb-1"><span className="text-slate-500 font-bold">Pain:</span> {p.pain_point}</p>
                                                            <p className="text-slate-400 text-[11px] mb-1"><span className="text-slate-500 font-bold">Goal:</span> {p.goal}</p>
                                                            <div className="flex gap-4 mt-2">
                                                                <span className="text-emerald-400 text-[10px] font-bold">WTP: {p.willingness_to_pay}</span>
                                                                <span className="text-pink-400 text-[10px]">via {p.acquisition_channel}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {key === 'redFlags' && extIntel.redFlags && !extIntel.redFlags.error && (
                                                <div className="space-y-3">
                                                    {(extIntel.redFlags.red_flags || []).map((r: any, i: number) => (
                                                        <div key={i} className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-white font-bold text-xs">{r.flag}</span>
                                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded ${r.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : r.severity === 'High' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-400'}`}>{r.severity}</span>
                                                            </div>
                                                            <p className="text-slate-400 text-[11px] mb-2">{r.explanation}</p>
                                                            <p className="text-emerald-400 text-[11px]">Fix: {r.fix}</p>
                                                        </div>
                                                    ))}
                                                    {extIntel.redFlags.verdict && (
                                                        <p className="text-slate-400 text-xs italic pt-1">{extIntel.redFlags.verdict}</p>
                                                    )}
                                                </div>
                                            )}
                                            {key === 'pricing' && extIntel.pricing && !extIntel.pricing.error && (
                                                <div className="space-y-3">
                                                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                                        <p className="text-white font-bold text-xs mb-2">Model: {extIntel.pricing.recommended_model}</p>
                                                        {(extIntel.pricing.price_points || []).map((t: any, i: number) => (
                                                            <div key={i} className="flex items-center justify-between py-1 border-b border-slate-800 last:border-0">
                                                                <span className="text-slate-300 text-[11px] font-bold">{t.tier}</span>
                                                                <span className="text-emerald-400 text-[11px] font-black">{t.price}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {extIntel.pricing.competitive_comparison && <p className="text-slate-400 text-[11px]">{extIntel.pricing.competitive_comparison}</p>}
                                                    {extIntel.pricing.ltv_estimate && <p className="text-slate-500 text-[10px]">LTV: {extIntel.pricing.ltv_estimate}</p>}
                                                </div>
                                            )}
                                            {key === 'funding' && extIntel.funding && !extIntel.funding.error && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-4 mb-2">
                                                        <span className="text-blue-400 font-black text-2xl">{extIntel.funding.readiness_score}/10</span>
                                                        <span className="text-slate-400 text-xs">{extIntel.funding.recommended_round}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Strengths</p>
                                                            {(extIntel.funding.strengths || []).map((s: string, i: number) => <p key={i} className="text-emerald-400 text-[11px]">+ {s}</p>)}
                                                        </div>
                                                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Gaps</p>
                                                            {(extIntel.funding.gaps || []).map((g: string, i: number) => <p key={i} className="text-red-400 text-[11px]">- {g}</p>)}
                                                        </div>
                                                    </div>
                                                    {extIntel.funding.timeline && <p className="text-slate-500 text-[10px]">Timeline: {extIntel.funding.timeline}</p>}
                                                </div>
                                            )}
                                            {key === 'legalRisks' && extIntel.legalRisks && !extIntel.legalRisks.error && (
                                                <div className="space-y-3">
                                                    {(extIntel.legalRisks.risks || []).map((r: any, i: number) => (
                                                        <div key={i} className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-white font-bold text-xs">{r.area}</span>
                                                                <span className="text-yellow-400 text-[9px] font-bold">{r.urgency}</span>
                                                            </div>
                                                            <p className="text-slate-400 text-[11px]">{r.requirement}</p>
                                                            {r.cost_estimate && <p className="text-slate-500 text-[10px] mt-1">Cost: {r.cost_estimate}</p>}
                                                        </div>
                                                    ))}
                                                    {extIntel.legalRisks.biggest_legal_threat && <p className="text-red-400 text-[11px] italic">Biggest Threat: {extIntel.legalRisks.biggest_legal_threat}</p>}
                                                </div>
                                            )}
                                            {key === 'traction' && extIntel.traction && !extIntel.traction.error && (
                                                <div className="space-y-3">
                                                    {(extIntel.traction.validation_methods || []).map((v: any, i: number) => (
                                                        <div key={i} className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                                            <span className="text-white font-bold text-xs">{v.method}</span>
                                                            <div className="flex gap-4 mt-1">
                                                                <span className="text-slate-500 text-[10px]">{v.timeline}</span>
                                                                <span className="text-slate-500 text-[10px]">{v.cost}</span>
                                                            </div>
                                                            <p className="text-emerald-400 text-[11px] mt-1">Signal: {v.success_signal}</p>
                                                        </div>
                                                    ))}
                                                    {extIntel.traction.pre_launch_strategy && <p className="text-slate-400 text-[11px]">Pre-launch: {extIntel.traction.pre_launch_strategy}</p>}
                                                </div>
                                            )}
                                            {key === 'moat' && extIntel.moat && !extIntel.moat.error && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-4 mb-2">
                                                        <span className="text-purple-400 font-black text-lg">{extIntel.moat.moat_type}</span>
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded ${extIntel.moat.durability === 'Strong' ? 'bg-emerald-500/20 text-emerald-400' : extIntel.moat.durability === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{extIntel.moat.durability}</span>
                                                        <span className="text-slate-500 text-[10px]">Score: {extIntel.moat.defensibility_score}/10</span>
                                                    </div>
                                                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Threats</p>
                                                        {(extIntel.moat.threats || []).map((t: string, i: number) => <p key={i} className="text-red-400 text-[11px]">• {t}</p>)}
                                                    </div>
                                                    {extIntel.moat.time_to_moat && <p className="text-slate-500 text-[10px]">Time to moat: {extIntel.moat.time_to_moat}</p>}
                                                </div>
                                            )}
                                            {key === 'exit' && extIntel.exit && !extIntel.exit.error && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-4 mb-2">
                                                        <span className="text-cyan-400 font-black text-sm">{extIntel.exit.most_likely_exit || 'Acquisition'}</span>
                                                        <span className="text-slate-400 text-[10px]">{extIntel.exit.timeline || ''}</span>
                                                        <span className="text-emerald-400 text-[10px] font-bold">{extIntel.exit.valuation_range || ''}</span>
                                                    </div>
                                                    {Array.isArray(extIntel.exit.scenarios) && extIntel.exit.scenarios.map((s: any, i: number) => (
                                                        <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-white font-bold text-xs">{s.type || s.name || 'Scenario'}</span>
                                                                <span className="text-cyan-400 text-[10px]">{s.valuation || ''} • {s.probability || ''}</span>
                                                            </div>
                                                            <p className="text-slate-400 text-[11px]">{s.reasoning || s.description || ''}</p>
                                                        </div>
                                                    ))}
                                                    {Array.isArray(extIntel.exit.likely_acquirers) && extIntel.exit.likely_acquirers.length > 0 && (
                                                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Likely Acquirers</p>
                                                            {extIntel.exit.likely_acquirers.map((a: any, i: number) => <p key={i} className="text-slate-300 text-[11px]">• {typeof a === 'string' ? a : a?.name || a?.company || a?.acquirer || Object.values(a as object).filter((v): v is string => typeof v === 'string').join(' — ')}</p>)}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {data.citations && data.citations.length > 0 && (
                        <div className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-emerald-500/20 rounded-lg"><Database className="w-5 h-5 text-emerald-400" /></div><h3 className="text-lg font-bold text-white uppercase tracking-wider">Research Grounding</h3></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {data.citations.map((cite, i) => (
                                    <div key={i} className="p-3 bg-slate-950/50 hover:bg-slate-800/50 border border-slate-800 rounded-2xl transition-all group">
                                        <a href={cite.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors"><LinkIcon className="w-4 h-4" /></div>
                                            <div className="flex-1 min-w-0"><div className="text-xs font-bold text-slate-300 truncate">{cite.title}</div><div className="text-[10px] text-slate-500 truncate group-hover:text-emerald-500/70 transition-colors">{cite.url}</div></div>
                                            <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-white transition-colors" />
                                        </a>
                                        {data.evidence?.claims?.find((claim) => claim.source_url === cite.url)?.quote && (
                                            <p className="mt-3 text-[10px] text-slate-400 leading-relaxed line-clamp-4">
                                                "{data.evidence.claims.find((claim) => claim.source_url === cite.url)?.quote}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            <AnimatePresence>
                {selectedCompetitor && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-6"
                        onClick={() => setSelectedCompetitor(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-slate-950 border-2 border-purple-500/30 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-10 shadow-[0_0_100px_rgba(168,85,247,0.1)] scrollbar-hide"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <div className="text-purple-400 font-mono text-[10px] md:text-sm mb-2 font-bold uppercase tracking-[0.3em]">Forensic Dossier</div>
                                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">{selectedCompetitor.name}</h1>
                                </div>
                                <button onClick={() => setSelectedCompetitor(null)} className="text-slate-500 hover:text-white text-3xl md:text-4xl transition-colors">&times;</button>
                            </div>
                            <div className="grid md:grid-cols-3 gap-6 mb-10">
                                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl group hover:border-cyan-500/30 transition-colors">
                                    <h3 className="text-cyan-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Market & Finance</h3>
                                    <div className="space-y-4 text-xs md:text-sm">
                                        <div><span className="text-slate-500 block mb-1 uppercase text-[10px] font-bold">Funding:</span> <span className="text-white font-medium">{selectedCompetitor.market_fin?.funding || '—'}</span></div>
                                        <div><span className="text-slate-500 block mb-1 uppercase text-[10px] font-bold">Investors:</span> <span className="text-white font-medium">{selectedCompetitor.market_fin?.investors || '—'}</span></div>
                                    </div>
                                </div>
                                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl group hover:border-emerald-500/30 transition-colors">
                                    <h3 className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><Rocket className="w-4 h-4" /> Product Intel</h3>
                                    <div className="space-y-4 text-xs md:text-sm">
                                        <div><span className="text-slate-500 block mb-1 uppercase text-[10px] font-bold">Pricing:</span> <span className="text-white font-medium">{selectedCompetitor.product_intel?.pricing || '—'}</span></div>
                                        <div><span className="text-slate-500 block mb-1 uppercase text-[10px] font-bold">Features:</span> <span className="text-white font-medium">{selectedCompetitor.product_intel?.features || '—'}</span></div>
                                    </div>
                                </div>
                                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl group hover:border-blue-500/30 transition-colors">
                                    <h3 className="text-blue-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><Hammer className="w-4 h-4" /> Tech Stack</h3>
                                    <div className="space-y-4 text-xs md:text-sm">
                                        <div><span className="text-slate-500 block mb-1 uppercase text-[10px] font-bold">Stack:</span> <span className="text-white font-mono text-[11px]">{selectedCompetitor.technical_infra?.stack || '—'}</span></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-2 border-purple-500/50 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Skull className="w-20 h-20 text-white" /></div>
                                <h3 className="text-xl md:text-2xl font-black text-white mb-4 italic tracking-tight">The Kill Strategy</h3>
                                <p className="text-white/90 text-sm md:text-lg leading-relaxed font-medium">{selectedCompetitor.kill_strategy}</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {data && <ForensicReport ref={reportRef} data={data} input={input} />}
        </div>
    );
}

const Skull = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 2a5 5 0 0 0-5 5v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7a5 5 0 0 0-5-5zM9 13a3 3 0 0 0-3 3v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2a3 3 0 0 0-3-3M12 22v-4M8 22v-2M16 22v-2" />
        <circle cx="9" cy="7" r="1" />
        <circle cx="15" cy="7" r="1" />
    </svg>
);

export default ValidatorApp;
