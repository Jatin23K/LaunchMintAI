
import React, { useState, useEffect } from 'react';
import { StartupReport } from '../types';
import { Icons } from './Icons';

interface DashboardProps {
    report: StartupReport;
    mode: 'report' | 'tool';
}

export const Dashboard: React.FC<DashboardProps> = ({ report, mode }) => {
    const [activeTab, setActiveTab] = useState('Overview');

    // Determine available tabs based on data presence
    const getTabs = () => {
        const tabs = [];

        // Core Report Tabs
        if (report.market) tabs.push({ id: 'Market', icon: Icons.Market });
        if (report.competitors) tabs.push({ id: 'Competitors', icon: Icons.Competitors });
        if (report.strategy) tabs.push({ id: 'Strategy', icon: Icons.Strategy });
        if (report.pricing) tabs.push({ id: 'Pricing', icon: Icons.Pricing });
        if (report.riskManagement) tabs.push({ id: 'Risks', icon: Icons.RiskManagement });
        if (report.engineering) tabs.push({ id: 'Engineering', icon: Icons.Engineering });
        if (report.design) tabs.push({ id: 'Design', icon: Icons.Design });
        if (report.marketing) tabs.push({ id: 'Marketing', icon: Icons.Marketing });
        if (report.pitchDeck) tabs.push({ id: 'Pitch', icon: Icons.PitchDeck });

        // Phase 4 Advanced Tabs
        if (report.benchmark) tabs.push({ id: 'Benchmark', icon: Icons.Benchmark });
        if (report.financialForecast) tabs.push({ id: 'Finance', icon: Icons.Finance });
        if (report.techFeasibility) tabs.push({ id: 'Tech & Risk', icon: Icons.TechRisk });

        // Specialized Tool Tabs
        if (report.people) tabs.push({ id: 'People', icon: Icons.People });
        if (report.operations) tabs.push({ id: 'Operations', icon: Icons.Operations });
        if (report.legal) tabs.push({ id: 'Legal', icon: Icons.Legal });
        if (report.stressTest) tabs.push({ id: 'Stress Test', icon: Icons.StressTest });

        // Phase 4 New Tabs
        if (report.viability) tabs.push({ id: 'Viability', icon: Icons.Target });
        if (report.audit) tabs.push({ id: 'Audit', icon: Icons.Audit });
        if (report.decision) tabs.push({ id: 'Decision', icon: Icons.CheckCircle });

        if (mode === 'report' || tabs.length === 0) {
            tabs.unshift({ id: 'Overview', icon: Icons.File });
        }

        return tabs;
    };

    const tabs = getTabs();

    useEffect(() => {
        if (!tabs.find(t => t.id === activeTab)) {
            setActiveTab(tabs[0]?.id || 'Overview');
        }
    }, [report, tabs]);

    // Helper for rendering lists
    const ListSection: React.FC<{ title: string, items: string[] }> = ({ title, items }) => (
        <div className="bg-[#14171C] p-6 rounded-xl border border-white/10 hover:border-indigo-500/20 transition-all shadow-lg h-full">
            <h3 className="text-xs font-bold text-zinc-500 mb-4 uppercase tracking-widest">{title}</h3>
            <ul className="space-y-3">
                {items?.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                        <span className="text-indigo-400 mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] flex-shrink-0"></span>
                        <span className="leading-relaxed">{item}</span>
                    </li>
                ))}
                {(!items || items.length === 0) && <li className="text-zinc-600 text-sm italic">No data available</li>}
            </ul>
        </div>
    );

    const ConfidenceBadge: React.FC<{ score?: string; reason?: string }> = ({ score, reason }) => {
        if (!score) return null;
        let color = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
        if (score.toLowerCase() === 'high') color = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        if (score.toLowerCase() === 'medium') color = "bg-amber-500/10 text-amber-400 border-amber-500/20";
        if (score.toLowerCase() === 'low') color = "bg-red-500/10 text-red-400 border-red-500/20";

        return (
            <div className="flex flex-col gap-1 items-end">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${color}`}>
                    {score} Confidence
                </span>
                {reason && <span className="text-[10px] text-zinc-500 italic max-w-[200px] text-right leading-tight">{reason}</span>}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-[#0D0F12] text-zinc-200 overflow-hidden font-sans">

            {/* Dashboard Header */}
            <header className="border-b border-white/5 bg-[#0D0F12]/95 backdrop-blur-xl sticky top-0 z-30 px-6 py-4 flex justify-between items-center">
                <div className="flex flex-col gap-2">
                    {/* Prompt Context Bar */}
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                        <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20">Input</span>
                        <span className="text-zinc-400">"{report.idea}"</span>
                        <Icons.ArrowRight className="w-3 h-3 text-zinc-600" />
                        <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20">AI Output</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg">
                            <Icons.Brain className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-white tracking-tight leading-none mb-1">
                                    LaunchMintAI Output
                                </h1>
                                {report.market?.industryCategory && (
                                    <span className="text-[10px] font-mono uppercase bg-white/5 px-2 py-0.5 rounded text-zinc-400 border border-white/5">
                                        {report.market.industryCategory}
                                    </span>
                                )}
                            </div>
                            <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider line-clamp-1 max-w-md">
                                Analysis for: <span className="text-zinc-300 font-bold">{report.branding?.nameIdeas?.[0] || report.idea}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 transition-colors border border-white/5">
                        <Icons.LayoutTemplate className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-medium text-indigo-400 transition-colors border border-indigo-500/20">
                        <Icons.Refresh className="w-3.5 h-3.5" /> Regenerate
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 transition-colors border border-white/5">
                        <Icons.Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all flex items-center gap-2"
                    >
                        <Icons.Plus className="w-4 h-4" /> New Mission
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <nav className="w-20 md:w-64 bg-[#0F1115] border-r border-white/5 overflow-y-auto hidden md:block">
                    <div className="p-4">
                        <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-4 px-2">Sections</p>
                        <ul className="space-y-1">
                            {tabs.map((tab) => (
                                <li key={tab.id}>
                                    <button
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === tab.id
                                            ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                                            : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                                            }`}
                                    >
                                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-400' : 'text-zinc-500'}`} />
                                        <span>{tab.id}</span>
                                        {activeTab === tab.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>

                {/* Mobile Nav (Bottom) */}
                <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0F1115] border-t border-white/10 z-50 flex overflow-x-auto p-2 gap-2 no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 flex flex-col items-center justify-center p-2 min-w-[60px] rounded-lg ${activeTab === tab.id ? 'text-indigo-400 bg-white/5' : 'text-zinc-500'
                                }`}
                        >
                            <tab.icon className="w-5 h-5 mb-1" />
                            <span className="text-[10px] font-medium">{tab.id}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto bg-[#0D0F12] relative">
                    <div className="w-full max-w-5xl mx-auto px-8 py-12 space-y-20 pb-32">

                        {/* Overview Tab */}
                        {activeTab === 'Overview' && (
                            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Executive Summary */}
                                <section className="space-y-8">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h1 className="text-4xl font-semibold tracking-tight text-white">LaunchMint AI Analysis Output</h1>
                                            <span className="px-3 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono border border-indigo-500/30 uppercase tracking-widest">
                                                Generated in 0.4s
                                            </span>
                                        </div>
                                        <p className="text-white/60 text-lg max-w-3xl">
                                            {report.market?.opportunitySummary || "Overview pending..."}
                                        </p>
                                    </div>

                                    {report.market?.coreProblem && (
                                        <div className="bg-[#14171C] p-6 rounded-xl border border-white/10 flex flex-col md:flex-row gap-6 items-center shadow-lg">
                                            <div className="flex-1">
                                                <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <Icons.AlertTriangle className="w-3 h-3" /> The Core Problem
                                                </h3>
                                                <p className="text-white text-lg font-medium leading-relaxed">
                                                    "{report.market.coreProblem}"
                                                </p>
                                            </div>
                                            <div className="w-full md:w-auto flex flex-col items-center md:items-end border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                                                <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-1">Pain Severity</span>
                                                <div className="text-3xl font-bold text-white">
                                                    {report.market.painSeverityScore}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-6 rounded-xl border border-white/10 bg-[#14171C] shadow-lg relative overflow-hidden group">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-400"></div>
                                            <p className="text-xs uppercase text-white/40 tracking-wider font-semibold">Timing Score (Scraper Engine)</p>
                                            <h2 className="text-3xl font-semibold text-green-300 mt-3">{report.market?.timingScore || 'N/A'}</h2>
                                        </div>
                                        <div className="p-6 rounded-xl border border-white/10 bg-[#14171C] shadow-lg relative overflow-hidden group">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400"></div>
                                            <p className="text-xs uppercase text-white/40 tracking-wider font-semibold">Growth Rate</p>
                                            <h2 className="text-3xl font-semibold text-blue-300 mt-3">{report.market?.growthRate || 'Unknown'}</h2>
                                        </div>
                                        <div className="p-6 rounded-xl border border-white/10 bg-[#14171C] shadow-lg relative overflow-hidden group">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-400"></div>
                                            <p className="text-xs uppercase text-white/40 tracking-wider font-semibold">Success Probability</p>
                                            <h2 className="text-3xl font-semibold text-purple-300 mt-3">{report.strategy?.successProbability ? `${report.strategy.successProbability}%` : 'N/A'}</h2>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* Market Tab - ENHANCED VISUALS (Restored) */}
                        {activeTab === 'Market' && report.market && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white">Market Analysis</h2>
                                    <div className="flex gap-2">
                                        {/* New Timing Badge */}
                                        {report.market.timingScore && (
                                            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${parseInt(report.market.timingScore) > 70 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                                                Timing: {report.market.timingScore}/100
                                            </div>
                                        )}
                                        <ConfidenceBadge score={report.market.confidenceScore} reason={report.market.confidenceReason} />
                                    </div>
                                </div>

                                {/* Key Metrics Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-[#1A1D24] p-4 rounded-xl border border-white/5">
                                        <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Total Market (TAM)</p>
                                        <p className="text-2xl font-bold text-white">{report.market.tam}</p>
                                    </div>
                                    <div className="bg-[#1A1D24] p-4 rounded-xl border border-white/5">
                                        <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Serviceable (SAM)</p>
                                        <p className="text-2xl font-bold text-indigo-400">{report.market.sam}</p>
                                    </div>
                                    <div className="bg-[#1A1D24] p-4 rounded-xl border border-white/5">
                                        <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Growth Rate</p>
                                        <p className="text-2xl font-bold text-emerald-400">{report.market.growthRate}</p>
                                    </div>
                                    <div className="bg-[#1A1D24] p-4 rounded-xl border border-white/5">
                                        <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Pain Score</p>
                                        <p className="text-2xl font-bold text-rose-400">{report.market.painSeverityScore}</p>
                                    </div>
                                </div>

                                <div className="bg-[#1A1D24] p-6 rounded-xl border border-white/5">
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Summary</h3>
                                    <p className="text-zinc-300 leading-relaxed">{report.market.opportunitySummary}</p>
                                    {/* New Window of Opportunity Text */}
                                    {report.market.windowOfOpportunity && (
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <p className="text-xs uppercase font-bold text-indigo-400 mb-1">Window of Opportunity</p>
                                            <p className="text-sm text-zinc-400 italic">"{report.market.windowOfOpportunity}"</p>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Opportunities - Styled with Blue/Purple */}
                                    <div className="bg-[#1A1D24] rounded-xl border border-white/5 overflow-hidden group hover:border-indigo-500/30 transition-colors">
                                        <div className="bg-indigo-500/10 p-3 border-b border-indigo-500/10">
                                            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">🚀 Opportunities</h3>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            {report.market.opportunities?.map((opp, i) => (
                                                <div key={i} className="flex gap-3 text-sm text-zinc-300">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                                    {opp}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Risks - Styled with Amber/Orange */}
                                    <div className="bg-[#1A1D24] rounded-xl border border-white/5 overflow-hidden group hover:border-amber-500/30 transition-colors">
                                        <div className="bg-amber-500/10 p-3 border-b border-amber-500/10">
                                            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest">⚠️ Market Risks</h3>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            {report.market.risks?.map((risk, i) => (
                                                <div key={i} className="flex gap-3 text-sm text-zinc-300">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                                                    {risk}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Citations Footer */}
                                {report.market.citations && report.market.citations.length > 0 && (
                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-xs text-zinc-500 font-mono mb-2">Sources:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {report.market.citations.map((cite, i) => (
                                                <span key={i} className="text-[10px] text-zinc-400 bg-white/5 px-2 py-1 rounded hover:bg-white/10 cursor-default">
                                                    🔗 {cite}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Benchmark Tab */}
                        {activeTab === 'Benchmark' && report.benchmark && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white">Competitor Intelligence</h2>
                                    <div className="text-3xl font-bold text-white">{report.benchmark.differentiationScore}/100</div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-[#14171C] p-6 rounded-xl border border-white/10">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Positioning Strategy</h3>
                                        <div className="text-xl font-bold text-white mb-2">{report.benchmark.positioning}</div>
                                        <p className="text-sm text-zinc-400">VS Market Leader: <span className="text-white font-semibold">{report.benchmark.leader}</span></p>
                                    </div>
                                    <ListSection title="Feature Gaps (Your Edge)" items={report.benchmark.featureGaps} />
                                </div>

                                <div className="bg-[#14171C] p-6 rounded-xl border border-white/10">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Risk Zones</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {report.benchmark.riskZones.map((risk, i) => (
                                            <span key={i} className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                                                {risk}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Finance Tab */}
                        {activeTab === 'Finance' && report.financialForecast && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white">Financial Projections & Investor Fit</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-[#14171C] p-6 rounded-xl border border-white/10 text-center">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Year 1 ARR</h3>
                                        <div className="text-3xl font-bold text-emerald-400">{report.financialForecast.arrYear1}</div>
                                    </div>
                                    <div className="bg-[#14171C] p-6 rounded-xl border border-white/10 text-center">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Monthly Burn</h3>
                                        <div className="text-3xl font-bold text-red-400">{report.financialForecast.burnRate}</div>
                                    </div>
                                    <div className="bg-[#14171C] p-6 rounded-xl border border-white/10 text-center">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Runway</h3>
                                        <div className="text-3xl font-bold text-amber-400">{report.financialForecast.runwayMonths} Months</div>
                                    </div>
                                </div>

                                {report.investorFit && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-[#14171C] p-6 rounded-xl border border-white/10">
                                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Ideal Investor Profile</h3>
                                            <div className="text-lg font-bold text-white mb-2">{report.investorFit.bestFor}</div>
                                            <div className="text-sm text-zinc-400 mb-4">Fit Score: <span className="text-white">{report.investorFit.fitScore}/100</span></div>
                                            <div className="p-3 bg-white/5 rounded border border-white/5 text-sm text-zinc-300">
                                                <strong className="text-indigo-400">Pitch Angle:</strong> {report.investorFit.pitchAngle}
                                            </div>
                                        </div>
                                        <ListSection title="Investors to Avoid" items={report.investorFit.avoid} />
                                    </div>
                                )}

                                <ListSection title="Growth Levers" items={report.financialForecast.growthLevers} />
                            </div>
                        )}

                        {/* Tech & Risk Tab */}
                        {activeTab === 'Tech & Risk' && report.techFeasibility && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white">Technical Audit & Regulatory Risk</h2>
                                    <div className="flex gap-4">
                                        <div className="text-right">
                                            <span className="block text-[10px] text-zinc-500 uppercase">Feasibility</span>
                                            <span className="text-xl font-bold text-white">{report.techFeasibility.score}/100</span>
                                        </div>
                                        {report.regulatoryRisk && (
                                            <div className="text-right">
                                                <span className="block text-[10px] text-zinc-500 uppercase">Reg Risk</span>
                                                <span className={`text-xl font-bold ${report.regulatoryRisk.riskLevel === 'High' ? 'text-red-400' :
                                                    report.regulatoryRisk.riskLevel === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                                                    }`}>{report.regulatoryRisk.riskLevel}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-[#14171C] p-6 rounded-xl border border-white/10">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Tech Complexity: {report.techFeasibility.complexityLevel}</h3>
                                        <ul className="space-y-2 mb-6">
                                            {report.techFeasibility.requirements.map((req, i) => (
                                                <li key={i} className="text-sm text-zinc-300 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> {req}
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="p-3 bg-white/5 rounded border border-white/5">
                                            <span className="text-xs text-zinc-500 block mb-1">Recommended Stack</span>
                                            <div className="flex flex-wrap gap-2">
                                                {report.techFeasibility.recommendedStack.map((stack, i) => (
                                                    <span key={i} className="text-xs bg-black/40 px-2 py-1 rounded text-zinc-300 border border-white/5">{stack}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {report.regulatoryRisk && (
                                            <div className="bg-[#14171C] p-6 rounded-xl border border-white/10">
                                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Global Compliance Map</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {Object.entries(report.regulatoryRisk.regions).map(([region, risk]) => (
                                                        <div key={region} className="flex justify-between items-center p-2 rounded bg-white/5">
                                                            <span className="text-sm font-bold text-white">{region}</span>
                                                            <span className="text-xs text-zinc-400">{risk}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-white/5">
                                                    <span className="text-xs text-zinc-500 block mb-2">Compliance Needed:</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {report.regulatoryRisk.complianceNeeded.map((c, i) => (
                                                            <span key={i} className="text-xs text-amber-300 bg-amber-900/20 px-2 py-1 rounded border border-amber-500/20">{c}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {report.failureSimulation && (
                                            <div className="bg-[#14171C] p-6 rounded-xl border border-white/10">
                                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Failure Simulation</h3>
                                                <div className="space-y-3">
                                                    {report.failureSimulation.scenarios.map((scen, i) => (
                                                        <div key={i} className="flex justify-between items-center">
                                                            <span className="text-sm text-zinc-300">{scen.name}</span>
                                                            <div className="flex items-center gap-3">
                                                                <span className={`text-[10px] uppercase font-bold ${scen.impact === 'High' ? 'text-red-400' : 'text-amber-400'
                                                                    }`}>{scen.impact} Impact</span>
                                                                <span className="text-xs font-mono text-zinc-500">{scen.survivalChance} Survival</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Decision Tab - Phase 4 New (Updated with Pivot Options) */}
                        {activeTab === 'Decision' && report.decision && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white">Founder Decision</h2>
                                </div>

                                <div className="bg-gradient-to-br from-[#14171C] to-black p-10 rounded-2xl border border-white/10 text-center relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-full h-2 ${report.decision.finalVerdict === 'Proceed' ? 'bg-emerald-500' :
                                        report.decision.finalVerdict === 'Pivot' ? 'bg-amber-500' :
                                            report.decision.finalVerdict === 'Abandon' ? 'bg-red-500' : 'bg-blue-500'
                                        }`}></div>

                                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">FINAL VERDICT</h3>
                                    <h1 className={`text-6xl font-extrabold mb-8 tracking-tight ${report.decision.finalVerdict === 'Proceed' ? 'text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.3)]' :
                                        report.decision.finalVerdict === 'Pivot' ? 'text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]' :
                                            report.decision.finalVerdict === 'Abandon' ? 'text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.3)]' : 'text-blue-400'
                                        }`}>
                                        {report.decision.finalVerdict.toUpperCase()}
                                    </h1>

                                    <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                                        <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                                            <h4 className="font-bold text-red-400 mb-2 flex items-center gap-2">
                                                <Icons.AlertTriangle className="w-4 h-4" /> Biggest Risk
                                            </h4>
                                            <p className="text-zinc-300">{report.decision.biggestRisk}</p>
                                        </div>
                                        {report.decision.hiddenOpportunity && (
                                            <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                                                <h4 className="font-bold text-indigo-400 mb-2 flex items-center gap-2">
                                                    <Icons.Zap className="w-4 h-4" /> Hidden Opportunity
                                                </h4>
                                                <p className="text-zinc-300">{report.decision.hiddenOpportunity}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <ListSection title="Immediate Next Steps" items={report.decision.nextSteps} />

                                {report.pivotOptions && report.pivotOptions.length > 0 && (
                                    <div className="mt-12">
                                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                            <Icons.Pivot className="w-5 h-5 text-amber-400" /> Recommended Pivots
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {report.pivotOptions.map((pivot, i) => (
                                                <div key={i} className="bg-[#14171C] p-6 rounded-xl border border-white/10 hover:border-amber-500/30 transition-all group">
                                                    <h4 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">{pivot.name}</h4>
                                                    <p className="text-zinc-400 text-sm mb-4">{pivot.reason}</p>
                                                    <div className="flex flex-col gap-2 text-xs">
                                                        <div className="flex justify-between p-2 bg-white/5 rounded">
                                                            <span className="text-zinc-500">New Target</span>
                                                            <span className="text-zinc-200">{pivot.newTargetAudience}</span>
                                                        </div>
                                                        <div className="flex justify-between p-2 bg-white/5 rounded">
                                                            <span className="text-zinc-500">Core Change</span>
                                                            <span className="text-zinc-200">{pivot.coreFeatureChange}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Competitors Tab - REFINED & SUBTLE */}
                        {activeTab === 'Competitors' && report.competitors && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                        Competitive Landscape
                                        <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                                            Mapped by Graph Engine
                                        </span>
                                    </h2>
                                    <ConfidenceBadge score={report.competitors.confidenceScore} reason={report.competitors.confidenceReason} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {report.competitors.topCompetitors?.map((comp, i) => (
                                        <div key={i} className="bg-[#14171C] p-6 rounded-xl border border-white/10 hover:border-zinc-500/30 transition-all group flex flex-col h-full">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-lg text-white">{comp.name}</h3>
                                                    <div className="text-xs text-zinc-400 mt-1 font-mono bg-white/5 inline-block px-2 py-0.5 rounded">{comp.pricing}</div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 font-bold text-xs font-mono">
                                                    #{i + 1}
                                                </div>
                                            </div>
                                            <p className="text-zinc-400 text-sm mb-6 leading-relaxed border-b border-white/5 pb-4 flex-grow">
                                                {comp.description}
                                            </p>

                                            <div className="space-y-4 mb-6">
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2 block flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Strengths
                                                    </span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {comp.strengths?.map((s, j) => (
                                                            <span key={j} className="text-xs text-zinc-300 bg-white/5 px-2 py-1 rounded border border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2 block flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Weaknesses
                                                    </span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {comp.weaknesses?.map((w, j) => (
                                                            <span key={j} className="text-xs text-zinc-300 bg-white/5 px-2 py-1 rounded border border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                                {w}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <button className="w-full mt-auto py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider transition-colors border border-indigo-500/20 flex items-center justify-center gap-2">
                                                <Icons.Search className="w-3.5 h-3.5" /> Deep Dive Analysis
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Citations Footer */}
                                {report.competitors.citations && report.competitors.citations.length > 0 && (
                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-xs text-zinc-500 font-mono mb-2">Sources:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {report.competitors.citations.map((cite, i) => (
                                                <span key={i} className="text-[10px] text-zinc-400 bg-white/5 px-2 py-1 rounded hover:bg-white/10 cursor-default">
                                                    🔗 {cite}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Risks Tab - NEW IMPLEMENTATION */}
                        {activeTab === 'Risks' && report.riskManagement && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white">Risk Assessment</h2>
                                    <ConfidenceBadge score={report.riskManagement.confidenceScore} reason={report.riskManagement.confidenceReason} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Market Risks */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                            <Icons.Market className="w-4 h-4" /> Market Risks
                                        </h3>
                                        {/* Error Handling UI */}
                                        {(report.riskManagement as any).error ? (
                                            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg">
                                                <p className="text-red-400 font-bold mb-1">⚠️ Analysis Failed</p>
                                                <p className="text-red-300 text-xs">{(report.riskManagement as any).error}</p>
                                            </div>
                                        ) : report.riskManagement.marketRisks?.length ? (
                                            report.riskManagement.marketRisks.map((item, i) => (
                                                <div key={i} className="bg-[#14171C] p-4 rounded-lg border border-white/5 border-l-2 border-l-amber-500/50 hover:border-l-amber-500 transition-colors">
                                                    <p className="text-white font-medium text-sm mb-2">{item.risk}</p>
                                                    <p className="text-zinc-500 text-xs italic">🛡️ {item.mitigation}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 border border-white/5 rounded-lg text-zinc-500 text-sm">
                                                No risks detected (or API failed).
                                            </div>
                                        )}
                                    </div>

                                    {/* Operational Risks */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                            <Icons.Operations className="w-4 h-4" /> Operational Risks
                                        </h3>
                                        {report.riskManagement.operationalRisks?.map((item, i) => (
                                            <div key={i} className="bg-[#14171C] p-4 rounded-lg border border-white/5 border-l-2 border-l-rose-500/50 hover:border-l-rose-500 transition-colors">
                                                <p className="text-white font-medium text-sm mb-2">{item.risk}</p>
                                                <p className="text-zinc-500 text-xs italic">🛡️ {item.mitigation}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Financial Risks */}
                                    <div className="space-y-4 md:col-span-2">
                                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                            <Icons.Finance className="w-4 h-4" /> Financial Risks
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {report.riskManagement.financialRisks?.map((item, i) => (
                                                <div key={i} className="bg-[#14171C] p-4 rounded-lg border border-white/5 border-l-2 border-l-blue-500/50 hover:border-l-blue-500 transition-colors">
                                                    <p className="text-white font-medium text-sm mb-2">{item.risk}</p>
                                                    <p className="text-zinc-500 text-xs italic">🛡️ {item.mitigationPlan || item.mitigation}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Strategy Tab (Detailed) - Existing logic maintained */}
                        {activeTab === 'Strategy' && report.strategy && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* ... Existing Strategy content ... */}
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                        Strategic Execution Plan
                                        <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                                            Prioritized by Max-Heap
                                        </span>
                                    </h2>
                                    <ConfidenceBadge score={report.strategy.confidenceScore} reason={report.strategy.confidenceReason} />
                                </div>
                                {/* ... (rest of Strategy tab logic from previous step, ensuring it's not lost) ... */}
                                <div className="grid grid-cols-4 gap-6">
                                    {Object.entries(report.strategy.kpis).map(([k, v]) => (
                                        <div key={k} className="bg-[#14171C] p-6 rounded-xl border border-white/10 text-center">
                                            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">{k}</p>
                                            <p className="text-3xl font-bold text-white">{v}</p>
                                        </div>
                                    ))}
                                    <div className="bg-[#14171C] p-6 rounded-xl border border-white/10 text-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent"></div>
                                        <p className="text-xs text-purple-400 uppercase tracking-widest mb-2 font-bold">Success Prob</p>
                                        <p className="text-3xl font-bold text-white">{report.strategy.successProbability}%</p>
                                    </div>
                                </div>

                                {/* New Churn Analysis Block */}
                                {report.strategy.churnAnalysis && (
                                    <div className="bg-[#14171C] p-6 rounded-xl border border-white/10 border-l-4 border-l-rose-500">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">📉 Logic Check: Retention vs Churn</h3>
                                        <p className="text-zinc-400 leading-relaxed italic">"{report.strategy.churnAnalysis}"</p>
                                    </div>
                                )}

                                {/* New Retention Strategy Block */}
                                {report.strategy.retentionStrategy && (
                                    <div className="bg-[#14171C] p-6 rounded-xl border border-white/10 border-l-4 border-l-emerald-500">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Icons.Users className="w-4 h-4" /> Walker Retention Strategy
                                        </h3>
                                        <p className="text-zinc-300 leading-relaxed">"{report.strategy.retentionStrategy}"</p>
                                    </div>
                                )}
                                {/* ... etc ... */}
                                {/* ... etc ... */}
                                {report.strategy.goToMarket && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <ListSection title="Go-to-Market Channels" items={report.strategy.goToMarket.channels} />
                                        <ListSection title="First 10 Users Plan" items={report.strategy.first10UsersPlan} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Fallback for tabs without custom UI yet */}
                        {['Pricing', 'Marketing'].includes(activeTab) && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {activeTab === 'Pricing' && report.pricing && (
                                    <div className="space-y-8">
                                        <div className="bg-[#14171C] p-6 rounded-xl border border-white/10">
                                            <h3 className="font-bold text-white mb-2">{report.pricing.strategyType}</h3>
                                            <p className="text-zinc-400">{report.pricing.reasoning}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {report.pricing.tiers.map((tier, i) => (
                                                <div key={i} className="bg-[#14171C] p-6 rounded-xl border border-white/10">
                                                    <h4 className="font-bold text-white text-lg">{tier.name}</h4>
                                                    <div className="text-2xl font-bold text-indigo-400 my-2">{tier.price}</div>
                                                    <ul className="text-sm text-zinc-400 space-y-1">
                                                        {tier.features.map((f, j) => <li key={j}>• {f}</li>)}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!['Pricing'].includes(activeTab) && (
                                    <div className="text-zinc-500 italic text-center mt-20">
                                        Detailed view for {activeTab} coming in next update.
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </main>
            </div >
        </div >
    );
};
