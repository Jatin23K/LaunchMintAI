import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
    Rocket, ChevronRight, TrendingUp, Users, Scale, Hammer,
    Megaphone, Briefcase, Sparkles, Link as LinkIcon,
    CheckCircle2, AlertTriangle, ExternalLink, Loader2,
    ArrowLeft, Flame, Presentation, Skull, Copy, Download, Clock, Search, Database
} from 'lucide-react';

// --- GLOBAL STYLES ---
const globalStyles = `
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  @media print {
    .no-print { display: none !important; }
    body { background: white !important; color: black !important; }
    div, section, p, span { color: black !important; }
    .bg-slate-900, .bg-slate-950, .bg-slate-900\/50, .bg-slate-950\/50 { 
        background: #f8fafc !important; 
        border: 1px solid #cbd5e1 !important; 
        box-shadow: none !important;
    }
    .text-white, .text-slate-100, .text-slate-200, .text-slate-300 { color: #0f172a !important; }
    .text-slate-400, .text-slate-500, .text-slate-600 { color: #475569 !important; }
    .border-slate-800, .border-slate-700, .border-cyan-500\/50, .border-purple-500\/30 { border-color: #e2e8f0 !important; }
    h1, h2, h3, h4 { color: #0f172a !important; font-weight: 800 !important; }
    .bg-gradient-to-br, .bg-gradient-to-r { background: #f1f5f9 !important; border: 2px solid #94a3b8 !important; }
    .shadow-\[0_0_100px_rgba\(6\,182\,212\,0\.2\)\], .shadow-2xl { box-shadow: none !important; }
  }
`;

// --- 1. NEURAL BACKGROUND COMPONENT (CONSTELLATION EDITION) ---

const NeuralBackground = ({ color }: { color: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const getRGB = (c: string) => {
        switch (c) {
            case 'cyan': return '6, 182, 212';
            case 'red': return '239, 68, 68';
            case 'amber': return '245, 158, 11';
            case 'green': return '34, 197, 94';
            default: return '6, 182, 212';
        }
    };

    const rgb = getRGB(color);

    // Canvas Particle Logic
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;
        let particles: Particle[] = [];

        // Density: increased slightly since there is no central brain object
        const particleCount = Math.min(Math.floor(window.innerWidth * window.innerHeight / 10000), 180);
        const connectionDistance = 160;

        class Particle {
            x: number; y: number; vx: number; vy: number; radius: number;
            constructor() {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.vx = Math.random() * 0.2 - 0.1;
                this.vy = Math.random() * 0.2 - 0.1;
                this.radius = Math.random() * 1.5 + 0.5;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges
                if (this.x < 0 || this.x > w) this.vx *= -1;
                if (this.y < 0 || this.y > h) this.vy *= -1;
            }
            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${rgb}, 0.8)`;
                ctx.fill();
            }
        }

        function init() {
            particles = [];
            for (let i = 0; i < particleCount; i++) particles.push(new Particle());
        }

        function animate() {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, w, h);

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectionDistance) {
                        const opacity = 1 - (dist / connectionDistance);
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${rgb}, ${opacity * 0.4})`; // Subtle lines
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(animate);
        }

        init();
        animate();

        const handleResize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
            init();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [rgb]);

    return (
        <div className="fixed inset-0 z-[-10] overflow-hidden pointer-events-none bg-[#020617]">
            {/* Deep Background Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,15,30,0)_0%,rgba(2,6,23,1)_100%)]" />

            {/* Ambient Glows to give depth without obstructing text */}
            <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-10 transition-colors duration-1000 bg-[rgb(${rgb})]`}></div>
            <div className={`absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-10 transition-colors duration-1000 bg-[rgb(${rgb})]`}></div>

            {/* The Constellations (Canvas) */}
            <canvas ref={canvasRef} className="absolute inset-0 opacity-80" />
        </div>
    );
};

// --- 2. DATA INTERFACES ---
interface Competitor {
    name: string; weakness: string; url: string;
    market_fin: { funding: string; investors: string; management: string };
    product_intel: { pricing: string; features: string; swot: string };
    technical_infra: { stack: string; velocity: string; platform: string };
    sentiment: { complaints: string; trust_score: string; churn_drivers: string };
    marketing: { acquisition: string; seo_keywords: string; social_status: string };
    kill_strategy: string;
}

interface RealData {
    idea?: string;
    market: {
        size: string;
        growth: string;
        confidence: string;
        source_url: string;
        source_name: string;
        timing?: { label: string; rationale: string; };
    };
    monetization?: { model: string; strategy: string; };
    competitors: Competitor[];
    dept_legal: string[]; dept_product: string[]; dept_marketing: string[]; dept_finance: string[];
    strategy_log?: { legal: string[]; product: string[]; marketing: string[]; finance: string[]; };
    god_mode?: { macro_verdict: string; swarm_summary: string; risk_score: string; };
    gen_ui?: { title: string; desc: string; feature: string; };
    pivot_suggestion?: { idea: string; potential: string; rationale: string; };
}

interface PitchForgeData { tagline: string; elevator_pitch: string; tweet_thread_hook: string; cold_email_subject: string; value_proposition: string; }
interface VCRoastData { kill_shot: string; brutal_feedback: string[]; competitor_alert: string; investment_verdict: string; survival_chance: number; }

// --- 3. SUB-APPLICATIONS ---

// --- PITCH FORGE ---
function PitchForgeApp({ onBack }: { onBack: () => void }) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<PitchForgeData | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const suggestions = [
        "Fintech for Gen Z",
        "Vertical SaaS for Dentists",
        "AI Supply Chain",
        "No-Code App Builder",
        "Mental Health Platform",
        "Sustainable Fashion"
    ];

    const runForge = async (text: string = input) => {
        if (!text) return;
        setLoading(true); setData(null);
        try {
            const response = await axios.post('http://127.0.0.1:8000/pitch_forge', { user_idea: text });
            setData(response.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    return (
        <div className="w-full flex flex-col items-center">
            {!data && !loading && (
                <>
                    <div className="text-center h-[200px] flex flex-col justify-end pb-6 relative z-40 max-w-4xl mx-auto mb-2">
                        {/* FORCED 2-LINE LAYOUT */}
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 leading-tight">
                            <span className="text-white block">Generate a winning</span>
                            <span className="text-amber-500 block">pitch deck.</span>
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">Turn a simple prompt into a structured, investor-ready presentation.</p>
                    </div>

                    <div className="w-full max-w-3xl space-y-8 relative z-50">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-1000"></div>
                            <div className="relative flex items-center bg-[#0B1221] rounded-full p-2 pl-6 shadow-2xl border border-white/10">
                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="What is your startup about?"
                                    className="flex-1 bg-transparent text-white placeholder-gray-500 text-lg outline-none h-12"
                                    onKeyDown={e => e.key === 'Enter' && runForge()}
                                />
                                <button onClick={() => runForge()} className="bg-amber-500 hover:bg-amber-400 text-white px-8 h-12 rounded-full font-bold text-sm tracking-wide transition-transform active:scale-95 flex items-center gap-2">
                                    GENERATE <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        {/* Fixed min-height to prevent layout shift */}
                        <div className="flex flex-wrap justify-center gap-3 min-h-[88px] content-start">
                            {suggestions.map((s) => (
                                <button key={s} onClick={() => { setInput(s); runForge(s); }} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-sm text-gray-400 hover:text-white transition-all">
                                    {s}
                                </button>
                            ))}
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
                    <button onClick={() => setData(null)} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4" /> New Deck</button>
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

// --- VALIDATOR APP ---
function ValidatorApp() {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState("");
    const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
    const [data, setData] = useState<RealData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeDepartment, setActiveDepartment] = useState<string | null>('Product'); // Show Product by default
    const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);

    // SMART SEARCH WITH "NO HOMEPAGE" RULE
    const renderSource = (market: any, input: string) => {
        // 1. Prioritize VERIFIED deep link if available
        let url = market.source_url;
        let name = market.source_name || "Analyst Consensus";

        // 🛡️ LINK QUALITY GUARD Check
        // Reject homepages, generic domains, or known "dumb" links
        const isGenericHomepage = (u: string) => {
            if (!u) return true;
            try {
                const path = new URL(u).pathname;
                return path === "/" || path.length < 2 || u.includes("statista.com/"); // Statista often blocks deep links
            } catch { return true; }
        };

        // If link is bad, fallback to Smart Search
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

        // 2. If valid deep link exists
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
        'AI Legal Assistant',
        'Uber for Dog Walking',
        'SaaS CRM for Plumbers',
        'Eco-Friendly Marketplace',
        'Netflix for Education',
        'On-Demand Health Tech'
    ];

    const runAnalysis = async (text: string = input) => {
        if (!text.trim()) return;

        setLoading(true);
        setData(null);
        setError(null);
        setActiveDepartment('Product'); // Reset to Product
        setSelectedCompetitor(null);
        setInput(text);
        setTerminalLogs([]);
        setLoadingMsg("🚀 Initializing AI Agents...");

        // Terminal log simulation - HONEST ABOUT WHAT WE DO
        const logs = [
            "> Deploying market intelligence agent...",
            "> Searching Statista, Grand View Research, Markets&Markets...",
            "> Analyzing competitor positioning...",
            "> Running SWOT analysis on top 5 players...",
            "> Extracting forecast TAM from market reports...",
            "> Validating revenue model assumptions...",
            "> Building go-to-market strategy...",
            "> Generating departmental execution priorities...",
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
            const response = await axios.post('http://127.0.0.1:8000/analyze', { idea: text });

            if (!response.data || !response.data.market) {
                throw new Error('Invalid response from server');
            }

            setData(response.data);
            setError(null);
        } catch (err: any) {
            console.error('Analysis error:', err);
            const errorMessage = err.response?.data?.detail ||
                err.message ||
                'Unable to complete analysis. Please try again.';
            setError(errorMessage);
            setData(null);
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
        <div className="w-full flex flex-col items-center">
            {!data && !loading && (
                <>
                    <div className="text-center h-[200px] flex flex-col justify-end pb-6 relative z-40 max-w-5xl mx-auto mb-2">
                        {/* 2-LINE LAYOUT */}
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 leading-tight">
                            <span className="text-white block">Validate your startup</span>
                            <span className="text-cyan-400 block">in 30 seconds.</span>
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">Our advanced AI analyzes market trends, competition, and viability instantly.</p>
                    </div>

                    <div className="w-full max-w-3xl space-y-8 relative z-50">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-1000"></div>
                            <div className="relative flex items-center bg-[#0B1221] rounded-full p-2 pl-6 shadow-2xl border border-white/10">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Describe your game-changing idea..."
                                    className="flex-1 bg-transparent text-white placeholder-gray-500 text-lg outline-none h-12"
                                    onKeyDown={(e) => e.key === 'Enter' && runAnalysis(input)}
                                />
                                <button onClick={() => runAnalysis(input)} className="bg-cyan-500 hover:bg-cyan-400 text-black px-8 h-12 rounded-full font-bold text-sm tracking-wide transition-transform active:scale-95 flex items-center gap-2">
                                    VALIDATE <ChevronRight className="w-4 h-4 stroke-[3px]" />
                                </button>
                            </div>
                        </div>
                        {/* Fixed min-height to prevent layout shift */}
                        <div className="flex flex-wrap justify-center gap-3 min-h-[88px] content-start">
                            {suggestions.map((s) => (
                                <button key={s} onClick={() => { setInput(s); runAnalysis(s); }} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-sm text-gray-400 hover:text-white transition-all">
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {loading && (
                <div className="max-w-4xl mx-auto mt-10">
                    <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl p-8 font-mono text-sm">
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800">
                            <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
                            <span className="text-cyan-400 font-bold uppercase tracking-widest">{loadingMsg}</span>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {terminalLogs.map((log, i) => (
                                <div key={i} className="text-slate-400 animate-in fade-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                                    {log}
                                </div>
                            ))}
                            {terminalLogs.length > 0 && (
                                <div className="text-cyan-500 animate-pulse">▮</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="max-w-2xl mx-auto mt-10 animate-in fade-in slide-in-from-top-10 duration-500">
                    <div className="bg-red-950/20 border-2 border-red-500/50 rounded-2xl p-8 text-center">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Analysis Failed</h3>
                        <p className="text-red-300 mb-6">{error}</p>
                        <button
                            onClick={() => runAnalysis(input)}
                            className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold transition-all"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            )}

            {data && (
                <>
                    <div className="max-w-6xl mx-auto pb-32 px-6 space-y-12 pt-10 animate-in slide-in-from-bottom-20 fade-in duration-700">
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-full flex justify-between items-center">
                                <button onClick={() => setData(null)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                                    <ArrowLeft className="w-4 h-4" /> New Analysis
                                </button>
                                <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all text-sm font-bold no-print">
                                    <Download className="w-4 h-4" /> Export PDF
                                </button>
                            </div>

                            <div className="text-center">
                                <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tight">
                                    {input}
                                </h1>
                            </div>
                        </div>

                        {/* 1. GOD MODE VERDICT - MASSIVE & HIGH CONTRAST */}
                        {data.god_mode && (
                            <div className="bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 border-4 border-cyan-500/50 rounded-[2.5rem] p-12 relative overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.2)]">
                                <div className="absolute top-0 right-0 p-8">
                                    <div className={`px-6 py-3 rounded-2xl border-4 font-black text-2xl shadow-xl transition-all ${parseFloat(data.god_mode.risk_score) >= 70 ? 'bg-green-500/20 border-green-500 text-green-400' : parseFloat(data.god_mode.risk_score) >= 40 ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}>
                                        {data.god_mode.risk_score}/100
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                                            <Sparkles className="w-8 h-8 text-cyan-400" />
                                        </div>
                                        <span className="text-cyan-400 font-bold uppercase tracking-[0.2em] text-sm">God Mode Verdict</span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-bold text-white leading-tight pr-40">
                                        "{data.god_mode.macro_verdict}"
                                    </h2>
                                    <p className="text-cyan-100/70 text-sm leading-relaxed max-w-5xl">
                                        {data.god_mode.swarm_summary}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 2. Market Intel - SINGLE COLUMN WITH ALL DATA */}
                        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl overflow-hidden relative">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3 text-cyan-400">
                                        <TrendingUp className="w-6 h-6" />
                                        <h2 className="text-xl font-bold text-white">Market Intel</h2>
                                    </div>
                                    {data.market.classified_industry && (
                                        <div className="text-[10px] uppercase font-bold text-cyan-500/80 tracking-widest pl-9">
                                            Sector: {data.market.classified_industry}
                                        </div>
                                    )}
                                </div>
                                {renderSource(data.market, data.idea || input)}
                            </div>

                            <div className="space-y-6">
                                {/* Dual TAM Display: Current vs Forecast */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Current Year TAM */}
                                    <div>
                                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-50">
                                            TAM ({data.market.current_year || "2024/25"})
                                        </div>
                                        <div className="text-3xl font-black text-slate-400 tracking-tighter">
                                            {data.market.current_tam && data.market.current_tam !== "Data unavailable"
                                                ? data.market.current_tam
                                                : "N/A"}
                                        </div>
                                    </div>

                                    {/* Forecast Year TAM */}
                                    <div>
                                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-50">
                                            TAM ({data.market.forecast_year || "2030 Forecast"})
                                        </div>
                                        <div className="text-5xl font-black text-white tracking-tighter">
                                            {data.market.forecast_tam || data.market.size || "Analyzing..."}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Growth</div>
                                        <div className="text-green-400 font-bold">CAGR {data.market.growth}</div>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Confidence</div>
                                        <div className="text-blue-400 font-bold">{data.market.confidence}</div>
                                    </div>
                                </div>

                                {data.market.timing && (
                                    <div className="pt-4 border-t border-slate-800/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4 text-amber-500" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Timing</span>
                                            <div className="ml-auto flex items-center gap-2">
                                                <div className="flex gap-1">
                                                    {['Early', 'Peak', 'Late'].map((phase) => (
                                                        <div key={phase} className={`w-2 h-2 rounded-full ${data.market.timing?.label.includes(phase)
                                                            ? (phase === 'Early' ? 'bg-blue-500' : phase === 'Peak' ? 'bg-green-500' : 'bg-red-500')
                                                            : 'bg-slate-800'
                                                            }`} />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider font-bold">
                                                    Current: {data.market.timing.label}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-sm font-bold text-white">{data.market.timing.label}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed italic">
                                            {data.market.timing.rationale}
                                        </p>
                                    </div>
                                )}

                                {data.monetization && (
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20">
                                        <div className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mb-2">Revenue Model Suggestion</div>
                                        <div className="text-white font-bold text-lg mb-1">{data.monetization.model}</div>
                                        <div className="text-slate-400 text-xs leading-relaxed font-medium">{data.monetization.strategy}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Competitors Card - CLICKABLE, NO TRUNCATION */}
                        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl">
                            <div className="flex items-center gap-3 text-purple-400 mb-6"><Users className="w-6 h-6" /><h2 className="text-xl font-bold text-white">Top Competitors</h2></div>
                            <div className="space-y-3">
                                {data.competitors && data.competitors.length > 0 ? (
                                    data.competitors.slice(0, 3).map((c, i) => (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedCompetitor(c)}
                                            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-slate-200 group-hover:text-white">{c.name}</span>
                                                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-purple-400 transition-colors" />
                                            </div>
                                            <p className="text-xs text-red-400 leading-relaxed whitespace-pre-wrap">
                                                Weakness: {c.weakness}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-500">
                                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">No competitors identified</p>
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* MVP Blueprint - The Killer Feature */}
                        {data.gen_ui && (
                            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500/30 rounded-3xl p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <Rocket className="w-6 h-6 text-purple-400" />
                                    <h2 className="text-2xl font-black text-white">The MVP Blueprint</h2>
                                    <div className="ml-auto px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase">
                                        Build This First
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-white">🎯 Killer Feature: {data.gen_ui.feature}</h3>
                                    <p className="text-slate-300 leading-relaxed">{data.gen_ui.desc}</p>
                                    <div className="pt-4 border-t border-purple-500/20">
                                        <div className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-2">Why Start Here?</div>
                                        <p className="text-slate-400 text-sm italic">This single feature validates your core value proposition and can be built in 2-4 weeks with minimal infrastructure.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Execution Suite - AUTO-SELECT PRODUCT & SHOW TOP 3 */}
                        <div>
                            <h2 className="text-2xl font-bold mb-6">Execution Plan</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                {[{ id: 'Legal', icon: Scale }, { id: 'Product', icon: Hammer }, { id: 'Marketing', icon: Megaphone }, { id: 'Finance', icon: Briefcase }].map((dept: any) => (
                                    <button key={dept.id} onClick={() => setActiveDepartment(dept.id)} className={`p-6 border rounded-2xl transition-all text-center flex flex-col items-center gap-3 ${activeDepartment === dept.id ? 'bg-cyan-500/10 border-cyan-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-cyan-500/30'}`}>
                                        <dept.icon className={`w-6 h-6 ${activeDepartment === dept.id ? 'text-cyan-400' : ''}`} />
                                        <span className="font-bold">{dept.id}</span>
                                    </button>
                                ))}
                            </div>

                            {/* ALWAYS SHOW PRIORITIES (No Hidden Data) */}
                            <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    Top 5 Priorities: {activeDepartment}
                                    <span className="text-cyan-500 text-xs px-2 py-0.5 bg-cyan-950 rounded border border-cyan-900">AI AGENT</span>
                                </h3>
                                <div className="space-y-3">
                                    {getDeptList().length > 0 ? (
                                        getDeptList().slice(0, 5).map((item, i) => (
                                            <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-black/20 border border-slate-800">
                                                <div className="shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                                                <span className="text-slate-300 leading-relaxed">{item}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-slate-500">
                                            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p className="text-sm">No action items available for this department</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 4. Pivot Intelligence - DON'T KILL THE DREAM */}
                        {data.pivot_suggestion && (
                            <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/40 border-2 border-purple-500/30 rounded-[2rem] p-10 shadow-[0_0_50px_rgba(168,85,247,0.15)]">
                                <div className="flex flex-col md:flex-row gap-10 items-center">
                                    <div className="shrink-0">
                                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                            <Rocket className="w-12 h-12 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-2 text-purple-400 font-bold uppercase tracking-widest text-sm">
                                            <TrendingUp className="w-4 h-4" /> Pivot Recommendation
                                        </div>
                                        <h3 className="text-4xl font-black text-white">
                                            {data.pivot_suggestion.idea}
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <div className="text-slate-500 text-xs font-bold uppercase tracking-tighter">Market Potential</div>
                                                <div className="text-emerald-400 font-bold text-xl">{data.pivot_suggestion.potential}</div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="text-slate-500 text-xs font-bold uppercase tracking-tighter">Strategic Rationale</div>
                                                <div className="text-slate-300 leading-relaxed font-medium">{data.pivot_suggestion.rationale}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* 5. Strategic Audit Guardrails - Transparency & Professionalism */}
                        <div className="border-t border-slate-800 pt-12 mt-8 animate-in fade-in duration-1000 delay-500">
                            <div className="flex items-center gap-2 text-slate-500 mb-8 font-mono text-[10px] font-black uppercase tracking-[0.3em] opacity-50">
                                <AlertTriangle className="w-3 h-3 text-amber-500" /> Strategic Audit Guardrails
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {[
                                    { title: 'Snapshot Analysis', desc: 'Verdict is static and based on real-time public data at the moment of generation.' },
                                    { title: 'Public Signal Only', desc: 'Analyzes market trends and public competitor moves, excluding private VC data.' },
                                    { title: 'Idea Centric', desc: 'Ratings assess the market potential of the idea, not the founder\'s internal capabilities.' },
                                    { title: 'Soft Logic Risk', desc: 'Strategic theories presented are probabilistic insights, not absolute physical laws.' }
                                ].map((item, i) => (
                                    <div key={i} className="space-y-3 p-4 rounded-2xl bg-slate-900/20 border border-slate-800/50 hover:border-slate-700 transition-colors">
                                        <div className="text-slate-300 font-bold text-xs uppercase tracking-wider">{item.title}</div>
                                        <p className="text-slate-500 text-[11px] leading-relaxed font-medium">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* COMPETITOR FORENSIC DOSSIER MODAL */}
                    {selectedCompetitor && (
                        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setSelectedCompetitor(null)}>
                            <div className="bg-slate-950 border-2 border-purple-500/30 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-10" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <div className="text-purple-400 font-mono text-sm mb-2 font-bold uppercase tracking-widest">Forensic Dossier</div>
                                        <div className="flex items-center gap-4">
                                            <h1 className="text-6xl font-black text-white">{selectedCompetitor.name}</h1>
                                            {selectedCompetitor.url && (
                                                <a
                                                    href={selectedCompetitor.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700 no-print"
                                                    title="Visit Website"
                                                >
                                                    <ExternalLink className="w-5 h-5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedCompetitor(null)} className="text-slate-500 hover:text-white text-4xl">&times;</button>
                                </div>

                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                                    {/* Market & Finance */}
                                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                                        <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5" /> Market & Finance
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div><span className="text-slate-500">Funding:</span> <span className="text-white">{selectedCompetitor.market_fin.funding}</span></div>
                                            <div><span className="text-slate-500">Investors:</span> <span className="text-white">{selectedCompetitor.market_fin.investors}</span></div>
                                            <div><span className="text-slate-500">Management:</span> <span className="text-white">{selectedCompetitor.market_fin.management}</span></div>
                                        </div>
                                    </div>

                                    {/* Product Intel */}
                                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                                        <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2">
                                            <Briefcase className="w-5 h-5" /> Product Intel
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div><span className="text-slate-500">Pricing:</span> <span className="text-white">{selectedCompetitor.product_intel.pricing}</span></div>
                                            <div><span className="text-slate-500">Features:</span> <span className="text-white">{selectedCompetitor.product_intel.features}</span></div>
                                            <div><span className="text-slate-500">SWOT:</span> <span className="text-white">{selectedCompetitor.product_intel.swot}</span></div>
                                        </div>
                                    </div>

                                    {/* Tech Stack */}
                                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                                        <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2">
                                            <Hammer className="w-5 h-5" /> Tech Stack
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div><span className="text-slate-500">Stack:</span> <span className="text-white font-mono text-xs">{selectedCompetitor.technical_infra.stack}</span></div>
                                            <div><span className="text-slate-500">Velocity:</span> <span className="text-white">{selectedCompetitor.technical_infra.velocity}</span></div>
                                            <div><span className="text-slate-500">Platform:</span> <span className="text-white">{selectedCompetitor.technical_infra.platform}</span></div>
                                        </div>
                                    </div>
                                </div>

                                {/* The Kill Strategy */}
                                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-2 border-purple-500/50 rounded-2xl p-8">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Rocket className="w-6 h-6 text-purple-400" />
                                        <h3 className="text-2xl font-black text-white italic">The Kill Strategy</h3>
                                    </div>
                                    <p className="text-white/90 text-lg leading-relaxed">
                                        {selectedCompetitor.kill_strategy}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// --- VC ROAST APP ---
function VCRoastApp({ onBack }: { onBack: () => void }) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<VCRoastData | null>(null);

    const suggestions = [
        "Tinder for Cats",
        "Blockchain for Toasters",
        "Social Network for Introverts",
        "Airbnb for Tents",
        "Uber for Helicopters",
        "AI-Powered To-Do List"
    ];

    const runRoast = async (text: string = input) => {
        if (!text) return;
        setLoading(true); setData(null);
        try {
            const response = await axios.post('http://127.0.0.1:8000/vc_roast', { user_idea: text });
            setData(response.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    return (
        <div className="w-full flex flex-col items-center">
            {!data && !loading && (
                <>
                    <div className="text-center h-[200px] flex flex-col justify-end pb-6 relative z-40 max-w-4xl mx-auto mb-2">
                        {/* 2-LINE LAYOUT */}
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 leading-tight">
                            <span className="text-white block">Get your startup</span>
                            <span className="text-red-500 block">idea roasted.</span>
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">Brutal, honest feedback. We find the flaws before the VCs do.</p>
                    </div>

                    <div className="w-full max-w-3xl space-y-8 relative z-50">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-1000"></div>
                            <div className="relative flex items-center bg-[#0B1221] rounded-full p-2 pl-6 shadow-2xl border border-white/10">
                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="Pitch us your idea (if you dare)..."
                                    className="flex-1 bg-transparent text-white placeholder-gray-500 text-lg outline-none h-12"
                                    onKeyDown={e => e.key === 'Enter' && runRoast()}
                                />
                                <button onClick={() => runRoast()} className="bg-red-600 hover:bg-red-500 text-white px-8 h-12 rounded-full font-bold text-sm tracking-wide transition-transform active:scale-95 flex items-center gap-2">
                                    ROAST IT <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        {/* Fixed min-height to prevent layout shift */}
                        <div className="flex flex-wrap justify-center gap-3 min-h-[88px] content-start">
                            {suggestions.map((s) => (
                                <button key={s} onClick={() => { setInput(s); runRoast(s); }} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-sm text-gray-400 hover:text-white transition-all">
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
                    <div className="text-red-500 font-bold mt-4 tracking-widest animate-pulse">ANALYZING FLAWS...</div>
                </div>
            )}

            {data && (
                <div className="animate-in slide-in-from-bottom-20 fade-in duration-700 w-full max-w-4xl px-6 pb-20 mt-10 text-center">
                    <button onClick={() => setData(null)} className="mb-10 mx-auto flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4" /> Roast Another</button>
                    <div className="bg-red-950/20 border-2 border-red-600 p-10 rounded-2xl relative mb-12">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#030711] px-6 text-red-500 font-black uppercase tracking-widest text-sm border-x border-red-600">The Kill Shot</div>
                        <h2 className="text-3xl font-bold text-white leading-tight">"{data.kill_shot}"</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6 text-left">
                        {data.brutal_feedback.map((f, i) => (
                            <div key={i} className="bg-slate-900/50 border border-red-900/30 p-6 rounded-xl flex items-start gap-4">
                                <Skull className="w-6 h-6 text-red-600 shrink-0" />
                                <p className="text-slate-300 text-sm">{f}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// --- VC SIMULATOR (GOD MODE) ---
function GodModeApp({ onBack }: { onBack: () => void }) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<RealData | null>(null);

    const suggestions = [
        "Pre-Seed B2B SaaS",
        "D2C Consumer Brand",
        "Deep Tech Robotics",
        "Web3 Gaming Studio",
        "EdTech Platform",
        "Biotech Research Lab"
    ];

    const runSim = async (text: string = input) => {
        if (!text) return;
        setLoading(true); setData(null);
        try {
            const response = await axios.post('http://127.0.0.1:8000/war_room', { idea: text });
            setData(response.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    return (
        <div className="w-full flex flex-col items-center">
            {!data && !loading && (
                <>
                    <div className="text-center h-[200px] flex flex-col justify-end pb-6 relative z-40 max-w-4xl mx-auto mb-2">
                        {/* FORCED 2-LINE LAYOUT with UPDATED HEADLINE */}
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 leading-tight">
                            <span className="text-white block">Battle-test your pitch</span>
                            <span className="text-green-500 block">against AI.</span>
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">Simulate a high-stakes investor meeting. Can you answer the tough questions?</p>
                    </div>

                    <div className="w-full max-w-3xl space-y-8 relative z-50">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-1000"></div>
                            <div className="relative flex items-center bg-[#0B1221] rounded-full p-2 pl-6 shadow-2xl border border-white/10">
                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="Give your 30-second elevator pitch..."
                                    className="flex-1 bg-transparent text-white placeholder-gray-500 text-lg outline-none h-12"
                                    onKeyDown={e => e.key === 'Enter' && runSim()}
                                />
                                <button onClick={() => runSim()} className="bg-green-600 hover:bg-green-500 text-white px-8 h-12 rounded-full font-bold text-sm tracking-wide transition-transform active:scale-95 flex items-center gap-2">
                                    START PITCH <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        {/* Fixed min-height to prevent layout shift */}
                        <div className="flex flex-wrap justify-center gap-3 min-h-[88px] content-start">
                            {suggestions.map((s) => (
                                <button key={s} onClick={() => { setInput(s); runSim(s); }} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-sm text-gray-400 hover:text-white transition-all">
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
                    <div className="text-green-500 font-bold mt-4 tracking-widest animate-pulse">DEPLOYING AGENTS...</div>
                </div>
            )}

            {data && (
                <div className="animate-in slide-in-from-bottom-20 fade-in duration-700 w-full max-w-5xl px-6 pb-20 mt-10">
                    <button onClick={() => setData(null)} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4" /> Return to HQ</button>
                    <div className="bg-green-950/20 border border-green-500/30 p-10 rounded-3xl relative overflow-hidden">
                        <h2 className="text-3xl font-black text-white mb-6">VC Verdict: <span className="text-green-400">"{data.god_mode?.macro_verdict}"</span></h2>
                        <p className="text-slate-300 text-lg leading-relaxed">{data.god_mode?.swarm_summary}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- MAIN HUB ---
export default function App() {
    const [screen, setScreen] = useState<'VALIDATOR' | 'VC_ROAST' | 'PITCH_FORGE' | 'WAR_ROOM'>('VALIDATOR');

    const getThemeColor = () => {
        switch (screen) {
            case 'VALIDATOR': return 'cyan';
            case 'VC_ROAST': return 'red';
            case 'PITCH_FORGE': return 'amber';
            case 'WAR_ROOM': return 'green';
            default: return 'cyan';
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-transparent text-white font-sans selection:bg-cyan-500/30">
            <style>{globalStyles}</style>

            {/* Integrated Neural Background */}
            <NeuralBackground color={getThemeColor()} />

            {/* Top Navigation / Logo Area */}
            <div className="relative z-50 w-full max-w-7xl mx-auto px-6 pt-6 flex justify-between items-center">
                <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    {/* Fixed Purple Rocket (Stays purple across all tabs) */}
                    <Rocket className="w-6 h-6 text-purple-500" />
                    {/* LaunchMint = White, AI = Light Grey */}
                    <span>LaunchMint<span className="text-slate-400">AI</span></span>
                </div>
            </div>

            <main className="flex-1 flex flex-col items-center w-full relative z-10 pt-8">
                {/* Feature Switcher Pills */}
                <div className="flex flex-wrap justify-center gap-2 mb-12 p-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                    {[
                        { id: 'VALIDATOR', icon: Sparkles, label: 'Idea Validator', color: 'text-cyan-400' },
                        { id: 'VC_ROAST', icon: Flame, label: 'VC Roast', color: 'text-red-400' },
                        { id: 'PITCH_FORGE', icon: Presentation, label: 'Pitch Forge', color: 'text-amber-400' },
                        { id: 'WAR_ROOM', icon: Briefcase, label: 'War Room', color: 'text-green-400' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setScreen(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${screen === tab.id
                                ? 'bg-white/10 text-white shadow-lg border border-white/10'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <tab.icon className={`w-4 h-4 ${screen === tab.id ? tab.color : ''}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Render Active Screen */}
                <div className="w-full">
                    {screen === 'VALIDATOR' && <ValidatorApp />}
                    {screen === 'VC_ROAST' && <VCRoastApp onBack={() => setScreen('VALIDATOR')} />}
                    {screen === 'PITCH_FORGE' && <PitchForgeApp onBack={() => setScreen('VALIDATOR')} />}
                    {screen === 'WAR_ROOM' && <GodModeApp onBack={() => setScreen('VALIDATOR')} />}
                </div>

                {/* Footer - Pushed to bottom with consistent spacing */}
                <div className="mt-auto mb-5 w-full flex flex-col items-center opacity-40 hover:opacity-80 transition-opacity">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-6">Trusted by 50,000+ Founders</p>
                    <div className="flex flex-wrap justify-center gap-12 grayscale">
                        <div className="flex items-center gap-2 text-lg font-bold text-white"><span className="bg-white text-black px-1 font-serif">Y</span> Combinator</div>
                        <div className="flex items-center gap-2 text-lg font-bold text-white">★ techstars</div>
                        <div className="flex items-center gap-2 text-lg font-bold text-white">Google for Startups</div>
                        <div className="flex items-center gap-2 text-lg font-bold text-white"><span className="bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center text-[10px] p-1">P</span> Product Hunt</div>
                    </div>
                </div>
            </main>
        </div>
    );
}