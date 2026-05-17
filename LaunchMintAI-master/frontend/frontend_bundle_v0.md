# Frontend Bundle for v0.dev

Use this code to rebuild the LaunchMint AI Frontend.

## package.json
```json
{
  "name": "launchmint-ai-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.294.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "framer-motion": "^10.16.4"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@typescript-eslint/eslint-plugin": "^6.10.0",
    "@typescript-eslint/parser": "^6.10.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.53.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.4",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2",
    "vite": "^5.0.0"
  }
}
```

## types.ts
```typescript
export interface StartupReport {
    idea: string;
    branding?: {
        nameIdeas: string[];
        tagline: string;
        colorPalette: string[];
    };
    market?: {
        tam: string;
        sam: string;
        som: string;
        growthRate: string;
        marketSize: string;
        trends: string[];
        painSeverityScore: string;
        coreProblem: string;
        opportunitySummary: string;
        timingScore?: string;
        windowOfOpportunity?: string;
        opportunities?: string[];
        risks?: string[];
        citations?: string[];
        industryCategory?: string;
        subCategory?: string;
    };
    competitors?: {
        topCompetitors: {
            name: string;
            description: string;
            pricing: string;
            strengths?: string[];
            weaknesses?: string[];
        }[];
        marketGap: string;
        differentiation: string;
        confidenceScore?: string;
        confidenceReason?: string;
        citations?: string[];
    };
    strategy?: {
        successProbability: string;
        kpis: Record<string, string>;
        roadmap: string[];
        churnAnalysis?: string;
        retentionStrategy?: string;
        confidenceScore?: string;
        confidenceReason?: string;
        goToMarket?: {
            channels: string[];
        };
        first10UsersPlan?: string[];
    };
    pricing?: {
        strategyType: string;
        reasoning: string;
        tiers: {
            name: string;
            price: string;
            features: string[];
        }[];
    };
    riskManagement?: {
        confidenceScore?: string;
        confidenceReason?: string;
        marketRisks?: { risk: string; mitigation: string }[];
        operationalRisks?: { risk: string; mitigation: string }[];
        financialRisks?: { risk: string; mitigationPlan: string }[];
    };
    engineering?: {
        stack: string[];
        complexity: string;
    };
    design?: {
        vibe: string;
    };
    marketing?: {
        channels: string[];
    };
    pitchDeck?: any;

    // Phase 4 additions
    benchmark?: {
        differentiationScore: string;
        positioning: string;
        leader: string;
        featureGaps: string[];
        riskZones: string[];
    };
    financialForecast?: {
        arrYear1: string;
        burnRate: string;
        runwayMonths: string;
        growthLevers: string[];
    };
    techFeasibility?: {
        score: string;
        complexityLevel: string;
        recommendedStack: string[];
        requirements: string[];
    };
    regulatoryRisk?: {
        riskLevel: string;
        regions: Record<string, string>;
        complianceNeeded: string[];
    };
    failureSimulation?: {
        scenarios: { name: string; impact: string; survivalChance: string }[];
    };
    investorFit?: {
        fitScore: string;
        bestFor: string;
        avoid: string[];
        pitchAngle: string;
    };
    people?: any;
    operations?: any;
    legal?: any;
    stressTest?: any;

    viability?: any;
    audit?: any;
    decision?: {
        finalVerdict: 'Proceed' | 'Pivot' | 'Abandon';
        biggestRisk: string;
        hiddenOpportunity?: string;
        nextSteps: string[];
    };
    pivotOptions?: {
        name: string;
        reason: string;
        newTargetAudience: string;
        coreFeatureChange: string;
    }[];
}

export interface AgentEvent {
    event: 'agent_start' | 'agent_complete' | 'agent_error' | 'data_update' | 'complete';
    agent?: string;
    section?: keyof StartupReport;
    data?: any;
    error?: string;
    report?: Partial<StartupReport>;
}
```

## constants.ts
```typescript
import { Icons } from "./components/Icons";

export const AGENT_LIST = [
    'Market Research',
    'Competitor Analyst',
    'Technical Architect',
    'Risk Officer',
    'Consumer Psychologist', // New
    'Financial Analyst',     // New
    'UX Strategist',        // New
    'Regulatory Specialist' // New
];

export const TOOLS = [
    { id: 'market', name: 'Market Sizing', icon: Icons.Market },
    { id: 'competitor', name: 'Competitor Spy', icon: Icons.Competitors },
    { id: 'pricing', name: 'Pricing Optimizer', icon: Icons.Pricing }, // Fixed (was DollarSign)
    { id: 'risk', name: 'Risk Simulator', icon: Icons.RiskManagement }, // Fixed (was ShieldAlert)
    { id: 'pitch', name: 'Deck Generator', icon: Icons.PitchDeck },  // Fixed
    { id: 'audit', name: 'Smart Audit', icon: Icons.Audit }
];
```

## components/Icons.tsx
```typescript
import React from 'react';
import {
  Activity,
  AlertTriangle,
  Anchor,
  BarChart,
  Brain,
  Briefcase,
  CheckCircle,
  Code,
  Cpu,
  DollarSign,
  Download,
  Eye,
  FileText,
  Globe,
  Layout,
  LayoutTemplate,
  Megaphone,
  PenTool,
  Search,
  Shield,
  Target,
  Terminal,
  Zap,
  Users,
  MessageSquare,
  TrendingUp,
  Mic,
  ArrowRight,
  Image,
  Layers,
  Box,
  ChevronRight,
  Play,
  History,
  ShieldAlert,
  Tag,
  PieChart,
  GlobeLock
} from 'lucide-react';

export const Icons = {
  // Existing components (Lucide refs)
  Market: BarChart,
  Competitors: Target,
  Signals: Activity,
  People: Briefcase,
  Critic: AlertTriangle,
  Strategy: Anchor,
  Pricing: Tag,
  RiskManagement: ShieldAlert,
  Design: Layout,
  Branding: PenTool,
  Engineering: Code,
  Operations: DollarSign,
  Legal: Shield,
  StressTest: Zap,
  Marketing: Megaphone,
  Website: Globe,
  Technology: Cpu,
  AITools: Brain,
  PitchDeck: LayoutTemplate,
  Audit: CheckCircle,
  Terminal: Terminal,
  Search: Search,
  Eye: Eye,
  File: FileText,
  Activity,
  Code,
  Brain,
  Zap,
  Target,
  LayoutTemplate,
  DollarSign,
  Sales: TrendingUp,
  Support: MessageSquare,
  Users: Users,
  Mic: Mic,
  ArrowRight: ArrowRight,
  Image: Image,
  Layers: Layers,
  Box: Box,
  ChevronRight: ChevronRight,
  Play: Play,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Shield,
  Download,

  // New Header Icons
  zap: Zap,
  history: History,
  pulse: Activity,

  // Phase 4 Advanced Icons
  Benchmark: BarChart,
  Finance: PieChart,
  Plus: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Edit: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Refresh: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>,
  TechRisk: GlobeLock,
  Pivot: ArrowRight,

  // Version B Glowing Icons
  market: (props: any) => (
    <TrendingUp
      {...props}
      className={`h-10 w-10 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)] ${props.className || ''}`}
    />
  ),
  competitor: (props: any) => (
    <Target
      {...props}
      className={`h-10 w-10 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.4)] ${props.className || ''}`}
    />
  ),
  revenue: (props: any) => (
    <Users
      {...props}
      className={`h-10 w-10 text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.4)] ${props.className || ''}`}
    />
  ),
  genui: (props: any) => (
    <Image
      {...props}
      className={`h-10 w-10 text-pink-400 drop-shadow-[0_0_12px_rgba(244,114,182,0.4)] ${props.className || ''}`}
    />
  ),
};

// Helper for string-based lookup used by new UI components
export const Icon = ({ name, className = 'w-5 h-5' }: { name: string, className?: string }) => {
  switch (name) {
    case 'microphone': return <Mic className={className} />;
    case 'arrow': return <ArrowRight className={className} />;
    case 'market': return <BarChart className={className} />;
    case 'target': return <Target className={className} />;
    case 'revenue': return <Users className={className} />;
    case 'prototype': return <Image className={className} />;
    case 'design': return <Layout className={className} />;
    case 'people': return <Briefcase className={className} />;
    case 'zap': return <Zap className={className} />;
    case 'history': return <History className={className} />;
    case 'check-circle': return <CheckCircle className={className} />;
    case 'alert-triangle': return <AlertTriangle className={className} />;
    default: return <Brain className={className} />;
  }
};
```

## components/Hero.tsx
```tsx
import React, { useState } from 'react';
import TemplateChips from './TemplateChips';
import FeatureCards from './FeatureCards';
import { Icon } from './Icons';

export default function Hero({ onLaunch }: { onLaunch: (idea: string) => void }) {
  const [input, setInput] = useState('');

  const handleLaunch = () => {
    if (input.trim()) onLaunch(input);
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 md:px-6 pt-20 pb-10 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none opacity-40 mix-blend-screen animate-pulse"></div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <h1 className="font-medium text-zinc-300 text-3xl md:text-5xl tracking-tight mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          Ask LaunchMint Agents to
        </h1>
        <h2 className="font-extrabold text-[56px] md:text-[96px] leading-[1.05] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400 drop-shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
          validate your startup.
        </h2>

        <p className="mt-8 text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          Describe any idea. Our 18 AI Agents will assign a "Success Probability" score,
          check 150+ competitors, and design your unit economics in 30 seconds.
        </p>

        {/* Input Wrapper */}
        <div className="mt-12 flex justify-center w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <div className="relative w-full max-w-3xl group">
            {/* Outer Glow */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-30 blur-xl group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

            <div className="relative rounded-2xl p-2 bg-[#0c0c12]/90 ring-1 ring-white/10 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.8)] overflow-hidden">
              {/* Inner Purple Glow Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-transparent to-indigo-500/10 pointer-events-none"></div>

              <div className="flex items-center gap-4 px-4 py-2">
                <span className="text-zinc-500">
                  <Icon name="microphone" className="w-6 h-6" />
                </span>
                <input
                  id="idea"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLaunch()}
                  placeholder="Ask LaunchMint Agents to analyze 'Uber for Dogs'..."
                  className="flex-1 bg-transparent outline-none text-zinc-100 placeholder:text-zinc-600 text-lg md:text-xl h-12"
                />
                <button
                  onClick={handleLaunch}
                  disabled={!input.trim()}
                  className="rounded-xl px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
                >
                  Generate Report <Icon name="arrow" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
          <TemplateChips className="mt-8" onSelect={(val) => setInput(val)} />
        </div>
      </div>

      <div className="mt-20 w-full max-w-6xl animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
        <FeatureCards />
      </div>
    </section>
  );
}
```

## components/Dashboard.tsx
```tsx
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
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg">
                        <Icons.Brain className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-white tracking-tight leading-none mb-1">
                                {report.branding?.nameIdeas?.[0] || 'Mission Report'}
                            </h1>
                            {report.market?.industryCategory && (
                                <span className="text-[10px] font-mono uppercase bg-white/5 px-2 py-0.5 rounded text-zinc-400 border border-white/5">
                                    {report.market.industryCategory} {report.market.subCategory ? ` // ${report.market.subCategory}` : ''}
                                </span>
                            )}
                        </div>
                        <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider line-clamp-1 max-w-md">
                            {report.idea}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 transition-colors border border-white/5">
                        <Icons.LayoutTemplate className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-medium text-indigo-400 transition-colors border border-indigo-500/20">
                        <Icons.Refresh className="w-3.5 h-3.5" /> Regenerate
                    </button>
                    <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 transition-colors border border-white/5">
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
                                            <h1 className="text-4xl font-semibold tracking-tight text-white">LaunchMint AI Analysis</h1>
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
                                        <div key={i} className="bg-[#14171C] p-6 rounded-xl border border-white/10 hover:border-zinc-500/30 transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-lg text-white">{comp.name}</h3>
                                                    <div className="text-xs text-zinc-400 mt-1 font-mono bg-white/5 inline-block px-2 py-0.5 rounded">{comp.pricing}</div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 font-bold text-xs font-mono">
                                                    #{i + 1}
                                                </div>
                                            </div>
                                            <p className="text-zinc-400 text-sm mb-6 leading-relaxed border-b border-white/5 pb-4">
                                                {comp.description}
                                            </p>

                                            <div className="space-y-4">
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
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Strategy Tab (Detailed) */}
                        {activeTab === 'Strategy' && report.strategy && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                        Strategic Execution Plan
                                        <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                                            Prioritized by Max-Heap
                                        </span>
                                    </h2>
                                    <ConfidenceBadge score={report.strategy.confidenceScore} reason={report.strategy.confidenceReason} />
                                </div>

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

                                {report.strategy.goToMarket && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <ListSection title="Go-to-Market Channels" items={report.strategy.goToMarket.channels} />
                                        <ListSection title="First 10 Users Plan" items={report.strategy.first10UsersPlan} />
                                    </div>
                                )}
                            </div>
                        )}
                         
                         {/* Other tabs omitted for brevity but follow similar patterns */}
                         
                    </div>
                </main>
            </div >
        </div >
    );
};
```

## App.tsx
```tsx
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AgentPipeline from './components/AgentPipeline';
import OrchestratorTerminal from './components/OrchestratorTerminal';
import Footer from './components/Footer';
import { Dashboard } from './components/Dashboard';
import { AgentMeta } from './components/AgentCard';
import { streamFoundersCopilot } from './services/geminiService';
import { AgentEvent, StartupReport } from './types';
import { AGENT_LIST } from './constants';

type AppMode = 'LANDING' | 'RUNNING' | 'DASHBOARD' | 'TESTING' | 'TOOLS';

function deepMergeReportPatch(target: any, patch: any): any {
    const result = { ...target };
    for (const key of Object.keys(patch)) {
        const val = patch[key];
        if (val && typeof val === 'object' && !Array.isArray(val) && result[key]) {
            result[key] = deepMergeReportPatch(result[key], val);
        } else {
            result[key] = val;
        }
    }
    return result;
}

export default function App() {
    const [appMode, setAppMode] = useState<AppMode>('LANDING');
    const [idea, setIdea] = useState('');
    const [logs, setLogs] = useState<AgentEvent[]>([]);
    const [report, setReport] = useState<Partial<StartupReport>>({});
    const [activeAgent, setActiveAgent] = useState<string | null>(null);
    const [completedAgents, setCompletedAgents] = useState<string[]>([]);
    const [failedAgents, setFailedAgents] = useState<string[]>([]);
    const [agentTimings, setAgentTimings] = useState<Record<string, { start?: number; end?: number }>>({});

    const getAgentListForUI = (): AgentMeta[] => {
        return AGENT_LIST.map(name => {
            let status: AgentMeta['status'] = 'queued';
            if (completedAgents.includes(name)) status = 'completed';
            if (failedAgents.includes(name)) status = 'failed';
            if (activeAgent === name) status = 'running';

            const timing = agentTimings[name];
            const startTime = timing?.start;
            const endTime = timing?.end;
            let durationMs = undefined;

            if (startTime && endTime) {
                durationMs = endTime - startTime;
            }

            return {
                name,
                status,
                startTime,
                durationMs
            };
        });
    };

    const getLogLines = (): string[] => {
        return logs.map(l => {
            if (l.event === 'agent_start') return `Starting ${l.agent}...`;
            if (l.event === 'agent_complete') return `Finished ${l.agent}.`;
            if (l.event === 'agent_error') return `Error in ${l.agent}: ${l.error}`;
            if (l.event === 'complete') return `Pipeline complete. Report generated.`;
            return JSON.stringify(l).substring(0, 100);
        });
    };

    const handleLaunch = async (userIdea: string) => {
        if (!userIdea.trim()) return;
        setIdea(userIdea);
        setAppMode('RUNNING');

        setLogs([]);
        setReport({ idea: userIdea });
        setActiveAgent(null);
        setCompletedAgents([]);
        setFailedAgents([]);
        setAgentTimings({});

        await streamFoundersCopilot(userIdea, 'report', null, (event) => {
            setLogs(prev => [...prev, event]);

            if (event.event === 'agent_start' && event.agent) {
                const now = Date.now();
                setAgentTimings(prev => ({
                    ...prev,
                    [event.agent!]: { ...prev[event.agent!], start: now }
                }));
                setActiveAgent(event.agent);
            }

            if (event.event === 'agent_complete') {
                if (event.agent) {
                    const now = Date.now();
                    setAgentTimings(prev => ({
                        ...prev,
                        [event.agent!]: { ...prev[event.agent!], end: now }
                    }));
                    setCompletedAgents(prev => [...prev, event.agent!]);
                }
            }

            if (event.event === 'agent_error') {
                 if (event.agent) {
                    const now = Date.now();
                    setAgentTimings(prev => ({
                        ...prev,
                        [event.agent!]: { ...prev[event.agent!], end: now }
                    }));
                    if (event.error?.includes('fallback')) {
                        setFailedAgents(prev => [...prev, event.agent!]);
                    }
                }
            }

            if (event.event === 'data_update') {
                if (event.section && event.data && typeof event.data === 'object') {
                    setReport(prev => ({
                        ...prev,
                        [event.section!]: {
                            ...(prev[event.section! as keyof StartupReport] as object),
                            ...event.data
                        }
                    }));
                }
            }
            if (event.event === 'complete') {
                if (event.report) {
                    setReport(prev => deepMergeReportPatch(prev, event.report));
                }
                setTimeout(() => setAppMode('DASHBOARD'), 1500);
            }
        });
    };

    const handleReset = () => {
        setAppMode('LANDING');
        setIdea('');
        setReport({});
        setLogs([]);
        setAgentTimings({});
    };

    return (
        <div className="min-h-screen flex flex-col font-sans bg-mat-surface">
            <Navbar onReset={handleReset} />

            <main className="flex-1 flex flex-col relative">

                {appMode === 'LANDING' && (
                    <>
                        <Hero onLaunch={handleLaunch} />
                        <Footer />
                    </>
                )}

                {appMode === 'RUNNING' && (
                    <div className="flex-1 flex flex-col pt-32 pb-12">
                        <div className="flex flex-col items-center text-center px-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
                            <h1 className="text-4xl font-semibold text-mat-primary tracking-tight mb-3">
                                Orchestrating Agents
                            </h1>
                            <p className="text-mat-text-secondary text-lg">
                                Validating hypothesis:
                                <span className="text-mat-primary underline underline-offset-4 decoration-mat-primary/30 ml-2 font-medium">
                                    "{idea}"
                                </span>
                            </p>
                        </div>

                        <AgentPipeline agents={getAgentListForUI()} />
                        <OrchestratorTerminal lines={getLogLines()} />
                    </div>
                )}

                {appMode === 'DASHBOARD' && report && (
                    <div className="flex-1 h-screen">
                        <Dashboard report={report as StartupReport} mode="report" />
                    </div>
                )}

            </main>
        </div>
    );
}
```
