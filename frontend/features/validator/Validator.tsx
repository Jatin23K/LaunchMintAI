import React, { useState, useRef, useMemo } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
    ChevronRight, TrendingUp, Users, Scale, Hammer, 
    Megaphone, Briefcase, Rocket, Search, Clock, 
    ExternalLink, Loader2, ArrowLeft, ShieldCheck, 
    CheckCircle2, AlertTriangle, Link as LinkIcon, 
    Database, Sparkles, Download, Info
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { RealData, Competitor } from '../../types';
import ForensicReport from '../../components/ForensicReport';

// --- SUB-COMPONENTS FOR 10/10 UX ---

const MarketGrowthChart = ({ currentTam, forecastTam, growth, year }: { currentTam: string, forecastTam: string, growth: string, year: string }) => {
    const data = useMemo(() => {
        const parseVal = (s: string) => {
            if (!s) return 0;
            const num = parseFloat(s.replace(/[^0-9.]/g, ''));
            if (s.toLowerCase().includes('b')) return num;
            if (s.toLowerCase().includes('t')) return num * 1000;
            if (s.toLowerCase().includes('m')) return num / 1000;
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
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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

    const generatePDF = async () => {
        if (!reportRef.current) return;
        setLoadingMsg("📄 Generating Document...");
        setLoading(true);

        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 800
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`LaunchMint_Analysis_${input.replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error("PDF Gen Error:", err);
            alert("PDF generation failed. Fallback to Print.");
            window.print();
        } finally {
            setLoading(false);
        }
    };

    const runAnalysis = async (text: string = input) => {
        if (!text.trim()) return;
        setLoading(true); setData(null); setError(null); setIsSaved(false);
        setActiveDepartment('Product'); setSelectedCompetitor(null); setInput(text);
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

        try {
            const apiBase = (import.meta as any).env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
            const response = await axios.post(`${apiBase}/analyze`, { idea: text });
            setData({ ...response.data, idea: text });
            setStatus('active');
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Analysis failed.');
            setStatus('idle');
        } finally {
            clearInterval(logInterval);
            setLoading(false);
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
                                <button onClick={() => runAnalysis(input)} className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 md:px-6 h-10 rounded-full font-bold text-[10px] md:text-xs tracking-wide transition-transform active:scale-95 flex items-center gap-2">
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
                                    <button key={s} onClick={() => { setInput(s); runAnalysis(s); }} className="px-3 md:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[10px] md:text-xs text-gray-400 hover:text-white transition-all whitespace-nowrap">
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
                    <div className="flex flex-col gap-8">
                        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4">
                            <button onClick={() => { setData(null); setStatus('idle'); }} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                                <ArrowLeft className="w-4 h-4" /> New Analysis
                            </button>
                            <div className="flex items-center gap-3 no-print">
                                <button
                                    onClick={() => { onSave(data); setIsSaved(true); }}
                                    disabled={isSaved}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-xl border transition-all text-sm font-black ${isSaved
                                        ? 'bg-green-500/10 border-green-500/50 text-green-400'
                                        : 'bg-purple-600 hover:bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                                        }`}
                                >
                                    {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                    {isSaved ? 'ARCHIVED' : 'SAVE TO BATTLE ROOM'}
                                </button>
                                <button
                                    onClick={generatePDF}
                                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all text-sm font-bold"
                                >
                                    <Download className="w-4 h-4" /> Export PDF
                                </button>
                            </div>
                        </div>
                        <div className="text-center">
                            <h1 className="text-4xl md:text-7xl font-black text-white italic tracking-tighter leading-tight">{input}</h1>
                        </div>
                    </div>

                    {data.god_mode && (
                        <div className="bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-950 border-4 border-emerald-500/50 rounded-[2.5rem] p-6 md:p-12 relative overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.2)]">
                            <div className="md:absolute top-0 right-0 p-4 md:p-8 flex justify-center mb-6 md:mb-0">
                                <div className={`px-4 md:px-6 py-2 md:py-3 rounded-2xl border-2 md:border-4 font-black text-lg md:text-2xl shadow-xl transition-all ${data.god_mode.risk_score.includes("Low") || data.god_mode.risk_score.includes("Safe") ? 'bg-green-500/20 border-green-500 text-green-400' : data.god_mode.risk_score.includes("Medium") ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}>
                                    {data.god_mode.risk_score}
                                </div>
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
                                        <div className="text-2xl md:text-3xl font-black text-slate-400 tracking-tighter">{data.market.current_tam || "N/A"}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-50">TAM ({data.market.forecast_year || "2030"})</div>
                                        <div className="text-4xl md:text-5xl font-black text-white tracking-tighter">{data.market.forecast_tam || data.market.size}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 flex items-center gap-2"><TrendingUp className="w-3 h-3 text-green-400"/> Growth</div>
                                        <div className="text-green-400 font-bold text-sm md:text-base">CAGR {data.market.growth}</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 flex items-center gap-2"><Info className="w-3 h-3 text-blue-400"/> Confidence</div>
                                        <div className="text-blue-400 font-bold text-sm md:text-base">{data.market.confidence}</div>
                                    </div>
                                </div>
                                {data.monetization && (
                                    <div className="p-4 md:p-6 rounded-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20">
                                        <div className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mb-2">Revenue Strategy</div>
                                        <div className="text-white font-bold text-base md:text-lg mb-1">{data.monetization.model}</div>
                                        <div className="text-slate-400 text-[11px] md:text-xs leading-relaxed font-medium">{data.monetization.strategy}</div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="bg-slate-950/50 p-4 md:p-6 rounded-2xl border border-slate-800">
                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">Projected Growth Vector</div>
                                <MarketGrowthChart 
                                    currentTam={data.market.current_tam} 
                                    forecastTam={data.market.forecast_tam || data.market.size} 
                                    growth={data.market.growth}
                                    year={data.market.forecast_year}
                                />
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
                        <h2 className="text-2xl font-black text-white flex items-center gap-3"><Hammer className="w-6 h-6 text-amber-500"/> Execution Strategy</h2>
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
                                    <h3 className="text-cyan-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Market & Finance</h3>
                                    <div className="space-y-4 text-xs md:text-sm">
                                        <div><span className="text-slate-500 block mb-1 uppercase text-[10px] font-bold">Funding:</span> <span className="text-white font-medium">{selectedCompetitor.market_fin.funding}</span></div>
                                        <div><span className="text-slate-500 block mb-1 uppercase text-[10px] font-bold">Investors:</span> <span className="text-white font-medium">{selectedCompetitor.market_fin.investors}</span></div>
                                    </div>
                                </div>
                                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl group hover:border-emerald-500/30 transition-colors">
                                    <h3 className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><Rocket className="w-4 h-4"/> Product Intel</h3>
                                    <div className="space-y-4 text-xs md:text-sm">
                                        <div><span className="text-slate-500 block mb-1 uppercase text-[10px] font-bold">Pricing:</span> <span className="text-white font-medium">{selectedCompetitor.product_intel.pricing}</span></div>
                                        <div><span className="text-slate-500 block mb-1 uppercase text-[10px] font-bold">Features:</span> <span className="text-white font-medium">{selectedCompetitor.product_intel.features}</span></div>
                                    </div>
                                </div>
                                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl group hover:border-blue-500/30 transition-colors">
                                    <h3 className="text-blue-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><Hammer className="w-4 h-4"/> Tech Stack</h3>
                                    <div className="space-y-4 text-xs md:text-sm">
                                        <div><span className="text-slate-500 block mb-1 uppercase text-[10px] font-bold">Stack:</span> <span className="text-white font-mono text-[11px]">{selectedCompetitor.technical_infra.stack}</span></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-2 border-purple-500/50 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Skull className="w-20 h-20 text-white"/></div>
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
