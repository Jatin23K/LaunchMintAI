
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
  TrendingDown,
  Scale,
  Building,
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
