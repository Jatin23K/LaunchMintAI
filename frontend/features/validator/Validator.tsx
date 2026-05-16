import React, { useState, useRef, useMemo, useEffect } from 'react';
import api from '../../services/api';
import { jsPDF } from 'jspdf';
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
import { RealData, Competitor, DSInsightsData } from '../../types';
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

    useEffect(() => {
        console.log("📊 [TRACKING] SCREEN_VIEW: Validator");
    }, []);

    // Fix: Ensure timestamp comparison is robust and doesn't trigger on fresh runs
    const isStale = useMemo(() => {
        if (!data || !data.timestamp) return false;
        const ageInMs = Date.now() - data.timestamp;
        return ageInMs > 24 * 60 * 60 * 1000;
    }, [data]);

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

    const generatePDF = () => {
        if (!data) return;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const W = 210; const M = 14; const TW = W - M * 2;
        let y = 0;

        const addPage = () => { pdf.addPage(); y = 16; };
        const checkY = (needed = 10) => { if (y + needed > 280) addPage(); };

        const h1 = (txt: string, color: [number, number, number] = [15, 23, 42]) => {
            checkY(12);
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.setTextColor(...color);
            pdf.text(txt, M, y); y += 10;
        };
        const h2 = (txt: string) => {
            checkY(9);
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.setTextColor(30, 41, 59);
            pdf.text(txt, M, y); y += 7;
        };
        const body = (txt: string, indent = 0) => {
            checkY(6);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(71, 85, 105);
            const lines = pdf.splitTextToSize(txt, TW - indent);
            pdf.text(lines, M + indent, y);
            y += lines.length * 5 + 1;
        };
        const kv = (label: string, val: string) => {
            checkY(6);
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(30, 41, 59);
            pdf.text(`${label}:`, M, y);
            pdf.setFont('helvetica', 'normal'); pdf.setTextColor(71, 85, 105);
            pdf.text(isNF(val) ? '—' : val, M + 30, y);
            y += 6;
        };
        const divider = () => {
            checkY(4);
            pdf.setDrawColor(226, 232, 240); pdf.line(M, y, W - M, y); y += 5;
        };
        const badge = (txt: string, r: number, g: number, b: number) => {
            checkY(8);
            pdf.setFillColor(r, g, b); pdf.roundedRect(M, y - 4, 40, 7, 2, 2, 'F');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(255, 255, 255);
            pdf.text(txt, M + 2, y); y += 8;
        };

        // ── COVER ──────────────────────────────────────────────────────────
        pdf.setFillColor(2, 6, 23); pdf.rect(0, 0, 210, 297, 'F');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(100, 200, 140);
        pdf.text('LAUNCHMINT INTELLIGENCE BRIEF', M, 30);
        pdf.setFontSize(26); pdf.setTextColor(255, 255, 255);
        const titleLines = pdf.splitTextToSize(input.toUpperCase(), TW);
        pdf.text(titleLines, M, 50);
        pdf.setFontSize(9); pdf.setTextColor(100, 116, 139);
        pdf.text(`Generated: ${new Date().toLocaleDateString()}  |  Classification: CONFIDENTIAL`, M, 280);
        addPage();

        // ── 1. VERDICT ─────────────────────────────────────────────────────
        h1('I. FINAL STRATEGIC VERDICT', [16, 185, 129]);
        divider();
        if (data.god_mode) {
            body(`"${data.god_mode.macro_verdict}"`);
            y += 2;
            body(data.god_mode.swarm_summary || '');
            y += 3;
            kv('Risk Level', data.god_mode.risk_score || '—');
        }
        y += 6; divider();

        // ── 2. MARKET INTEL ────────────────────────────────────────────────
        h1('II. MARKET INTEL');
        kv('Current TAM', isNF(data.market.current_tam) ? 'Data unavailable' : data.market.current_tam);
        kv('Forecast TAM', isNF(data.market.forecast_tam) ? 'Data unavailable' : `${data.market.forecast_tam} (${data.market.forecast_year || '2030'})`);
        kv('Growth (CAGR)', isNF(data.market.growth) ? 'Data unavailable' : data.market.growth);
        kv('Confidence', data.market.confidence || '—');
        kv('Source', data.market.source_name || '—');
        if (data.market.timing?.label) kv('Market Timing', `${data.market.timing.label} — ${data.market.timing.rationale || ''}`);
        y += 6; divider();

        // ── 3. COMPETITORS ─────────────────────────────────────────────────
        h1('III. COMPETITOR FORENSIC DOSSIERS');
        (data.competitors || []).slice(0, 3).forEach((c, i) => {
            checkY(40);
            h2(`${i + 1}. ${c.name}`);
            kv('Funding', c.market_fin?.funding || '—');
            kv('Pricing', c.product_intel?.pricing || '—');
            kv('Stack', c.technical_infra?.stack || '—');
            kv('Fatal Weakness', c.weakness || '—');
            body(`Kill Strategy: ${c.kill_strategy || '—'}`, 4);
            y += 4;
        });
        divider();

        // ── 4. EXECUTION PLAN ──────────────────────────────────────────────
        checkY(20); h1('IV. EXECUTION PLAN');
        const depts = [
            { name: 'Legal', items: data.dept_legal || [] },
            { name: 'Product', items: data.dept_product || [] },
            { name: 'Marketing', items: data.dept_marketing || [] },
            { name: 'Finance', items: data.dept_finance || [] },
        ];
        depts.forEach(dept => {
            h2(`${dept.name} Department`);
            dept.items.slice(0, 5).forEach((item, i) => body(`${i + 1}. ${item}`, 4));
            y += 3;
        });

        pdf.save(`LaunchMint_${input.replace(/\s+/g, '_')}.pdf`);
    };

    const runAnalysis = async (text?: string) => {
        const textToAnalyze = text || input;
        const cleanedText = textToAnalyze.trim();

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
            setInput(cleanedText);
            setIsFromCache(true);
            setStatus('active');
            return;
        }

        setLoading(true); setDsLoading(true); setData(null); setWarData(null); setDeepIntel(null); setExtIntel(null); setDsData(null); setError(null); setIsSaved(false); setIsFromCache(false);
        setActiveDepartment('Product'); setSelectedCompetitor(null); setInput(cleanedText);
        setTerminalLogs([]); setLoadingMsg("🚀 Initializing AI Agents...");
        setStatus('processing');

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

                if (warResponse.status === 'fulfilled') {
                    setWarData(warResponse.value.data || null);
                }

                setData(resultData);
                setDsData(resultDsData);
                setCachedResult(cleanedText, resultData, resultDsData);
                setError(null);
                setStatus('active');

                // Fire deep intel in background — non-blocking
                setDeepIntelLoading(true);
                const mktSize = resultData.market?.forecast_tam || 'Unknown';
                const growth = resultData.market?.growth || 'Unknown';
                const extPayload = { idea: cleanedText, market_size: mktSize, growth_rate: growth };
                const deepTimeout = { timeout: 90000 };
                Promise.allSettled([
                    api.post('/run', { extension_id: 'financial-projection', payload: extPayload }, deepTimeout),
                    api.post('/run', { extension_id: 'gtm-strategy', payload: extPayload }, deepTimeout),
                    api.post('/run', { extension_id: 'risk-scanner', payload: extPayload }, deepTimeout),
                ]).then(([finRes, gtmRes, riskRes]) => {
                    setDeepIntel({
                        fin: finRes.status === 'fulfilled' ? finRes.value.data?.data : null,
                        gtm: gtmRes.status === 'fulfilled' ? gtmRes.value.data?.data : null,
                        risk: riskRes.status === 'fulfilled' ? riskRes.value.data?.data : null,
                    });
                }).finally(() => setDeepIntelLoading(false));

                // Fire extended intel in background — non-blocking (8 sections)
                setExtIntelLoading(true);
                const extTimeout = { timeout: 90000 };
                Promise.allSettled([
                    api.post('/run', { extension_id: 'user-persona', payload: { idea: cleanedText } }, extTimeout),
                    api.post('/run', { extension_id: 'people-analysis', payload: { idea: cleanedText } }, extTimeout),
                    api.post('/run', { extension_id: 'pricing-strategy', payload: extPayload }, extTimeout),
                    api.post('/run', { extension_id: 'funding-readiness', payload: extPayload }, extTimeout),
                    api.post('/run', { extension_id: 'legal-risks', payload: { idea: cleanedText } }, extTimeout),
                    api.post('/run', { extension_id: 'traction-signals', payload: { idea: cleanedText } }, extTimeout),
                    api.post('/run', { extension_id: 'moat-analysis', payload: { idea: cleanedText } }, extTimeout),
                    api.post('/run', { extension_id: 'exit-scenarios', payload: extPayload }, extTimeout),
                ]).then(([personaRes, redFlagRes, pricingRes, fundingRes, legalRes, tractionRes, moatRes, exitRes]) => {
                    setExtIntel({
                        personas: personaRes.status === 'fulfilled' ? personaRes.value.data?.data : null,
                        redFlags: redFlagRes.status === 'fulfilled' ? redFlagRes.value.data?.data : null,
                        pricing: pricingRes.status === 'fulfilled' ? pricingRes.value.data?.data : null,
                        funding: fundingRes.status === 'fulfilled' ? fundingRes.value.data?.data : null,
                        legalRisks: legalRes.status === 'fulfilled' ? legalRes.value.data?.data : null,
                        traction: tractionRes.status === 'fulfilled' ? tractionRes.value.data?.data : null,
                        moat: moatRes.status === 'fulfilled' ? moatRes.value.data?.data : null,
                        exit: exitRes.status === 'fulfilled' ? exitRes.value.data?.data : null,
                    });
                }).finally(() => setExtIntelLoading(false));
            } else {
                if (response.reason.name === 'CanceledError' || response.reason.name === 'AbortError') {
                    throw new Error('TIMEOUT');
                }
                throw new Error(response.reason?.message || 'Analysis failed');
            }
        } catch (err: any) {
            console.error('Analysis error:', err);
            if (err.message === 'TIMEOUT') {
                setError("Analysis timed out. The backend may be waking up (cold start). Please try again.");
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
        }
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
                                    onKeyDown={(e) => e.key === 'Enter' && runAnalysis(input)}
                                />
                                <button aria-label="Run startup analysis" onClick={() => runAnalysis(input)} className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 md:px-6 h-10 rounded-full font-bold text-[10px] md:text-xs tracking-wide transition-transform active:scale-95 flex items-center gap-2">
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
                            <span className="text-emerald-400 font-bold uppercase tracking-widest">{loadingMsg}</span>
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
                        onExport={generatePDF}
                    />

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
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-50">TAM ({data.market.forecast_year || "2030"})</div>
                                        <FmtValue v={data.market.forecast_tam || data.market.size} className="text-4xl md:text-5xl font-black text-white tracking-tighter" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 flex items-center gap-2"><TrendingUp className="w-3 h-3 text-green-400" /> Growth</div>
                                        <div className="text-green-400 font-bold text-sm md:text-base">{isNF(data.market.growth) ? <DataBadge /> : `CAGR ${data.market.growth}`}</div>
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
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className="animate-pulse">
                                                    <div className="h-20 bg-slate-800/60 rounded-xl border border-slate-700/30"></div>
                                                </div>
                                            ))}
                                            <div className="animate-pulse flex gap-3">
                                                <div className="h-4 bg-slate-800/40 rounded w-1/3"></div>
                                                <div className="h-4 bg-slate-800/40 rounded w-1/4"></div>
                                            </div>
                                        </div>
                                    )}
                                    {deepIntelOpen === key && deepIntel?.[key as keyof typeof deepIntel] && (
                                        <div className="px-5 pb-6 border-t border-slate-800 pt-4">
                                            {/* Error fallback for deep intel sections */}
                                            {deepIntel[key as keyof typeof deepIntel]?.error && (
                                                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                                                    <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                                                    <p className="text-slate-400 text-xs">Analysis unavailable — LLM did not return valid data for this section.</p>
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
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className="animate-pulse">
                                                    <div className="h-16 bg-slate-800/60 rounded-xl border border-slate-700/30"></div>
                                                </div>
                                            ))}
                                            <div className="animate-pulse flex gap-3">
                                                <div className="h-4 bg-slate-800/40 rounded w-2/5"></div>
                                                <div className="h-4 bg-slate-800/40 rounded w-1/4"></div>
                                            </div>
                                        </div>
                                    )}
                                    {extIntelOpen === key && !extIntel?.[key as keyof typeof extIntel] && !extIntelLoading && (
                                        <div className="px-5 pb-6 border-t border-slate-800 pt-4">
                                            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                                                <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                                                <p className="text-slate-400 text-xs">Extension timed out or failed to generate data.</p>
                                            </div>
                                        </div>
                                    )}
                                    {extIntelOpen === key && extIntel?.[key as keyof typeof extIntel] && (
                                        <div className="px-5 pb-6 border-t border-slate-800 pt-4">
                                            {/* Error fallback for any section */}
                                            {extIntel[key as keyof typeof extIntel]?.error && (
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
                                                            {extIntel.exit.likely_acquirers.map((a: any, i: number) => <p key={i} className="text-slate-300 text-[11px]">• {typeof a === 'string' ? a : a?.name || JSON.stringify(a)}</p>)}
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
                                    <a key={i} href={cite.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-950/50 hover:bg-slate-800/50 border border-slate-800 rounded-2xl transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors"><LinkIcon className="w-4 h-4" /></div>
                                        <div className="flex-1 min-w-0"><div className="text-xs font-bold text-slate-300 truncate">{cite.title}</div><div className="text-[10px] text-slate-500 truncate group-hover:text-emerald-500/70 transition-colors">{cite.url}</div></div>
                                        <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-white transition-colors" />
                                    </a>
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
