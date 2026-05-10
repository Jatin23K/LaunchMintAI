import React, { useState, useEffect } from 'react';
import {
    Rocket, Sparkles, Flame, Presentation, Activity, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import NeuralBackground from './components/NeuralBackground';
import { LeftHud, RightHud, RecentIntel } from './components/HUD';
import HistoryDrawer from './components/HistoryDrawer';

// Features
import ValidatorApp from './features/validator/Validator';
import VCRoastApp from './features/vc-roast/VCRoast';
import PitchForgeApp from './features/pitch-forge/PitchForge';
import DeltaAnalysisApp from './features/delta-analysis/DeltaAnalysis';

// Types
import { RealData } from './types';
import { Clock as ClockIcon } from 'lucide-react';

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
    .print-only { display: block !important; }
    .no-print { display: none !important; }
  }
  .print-only { display: none; }
`;

export default function App() {
    const [screen, setScreen] = useState<'VALIDATOR' | 'VC_ROAST' | 'PITCH_FORGE' | 'BATTLE_ROOM'>('VALIDATOR');
    const [activeReport, setActiveReport] = useState<RealData | null>(null);
    const [systemStatus, setSystemStatus] = useState<'idle' | 'processing' | 'active'>('idle');
    const [showSaveToast, setShowSaveToast] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [archive, setArchive] = useState<RealData[]>(() => {
        try {
            const saved = localStorage.getItem('launchmint_archive');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to parse archive from localStorage:', e);
            localStorage.removeItem('launchmint_archive');
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('launchmint_archive', JSON.stringify(archive));
    }, [archive]);

    const saveToArchive = (report: RealData) => {
        if (!report.idea) return;
        setArchive(prev => {
            if (prev.find(a => a.idea === report.idea)) return prev;
            return [report, ...prev].slice(0, 50);
        });
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 3000);
    };

    const deleteFromArchive = (idea: string) => {
        setArchive(prev => prev.filter(a => a.idea !== idea));
    };

    const getThemeColor = () => {
        switch (screen) {
            case 'VALIDATOR': return 'emerald';
            case 'VC_ROAST': return 'red';
            case 'PITCH_FORGE': return 'amber';
            case 'BATTLE_ROOM': return 'cyan';
            default: return 'emerald';
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-[#020617] text-white font-sans selection:bg-cyan-500/30">
            <style>{globalStyles}</style>

            <NeuralBackground color={getThemeColor()} />

            <LeftHud status={systemStatus} />
            <RightHud status={systemStatus} />
            
            <HistoryDrawer 
                isOpen={isHistoryOpen} 
                onClose={() => setIsHistoryOpen(false)} 
                archive={archive} 
                onDelete={deleteFromArchive}
                onSelect={(r) => {
                    setScreen('VALIDATOR');
                    setActiveReport(r);
                    setSystemStatus('active');
                }}
            />

            <AnimatePresence>
                {showSaveToast && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, scale: 0.5, x: '-50%' }}
                        className="fixed bottom-32 left-1/2 z-[100] bg-emerald-500 text-black px-6 py-3 rounded-full font-black text-sm flex items-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        INTELLIGENCE ARCHIVED TO WAR CHEST
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="no-print relative z-50 w-full px-6 md:px-8 pt-6 flex justify-between items-center">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 font-black text-2xl md:text-3xl tracking-tighter"
                >
                    <Rocket className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
                    <span>Launchmint <span className="text-slate-400">AI</span></span>
                </motion.div>

                <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setIsHistoryOpen(true)}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl backdrop-blur-md group"
                >
                    <ClockIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </motion.button>
            </div>

            <main className="flex-1 flex flex-col items-center justify-center w-full relative z-10 pt-20">
                <div className="no-print absolute top-6 md:top-8 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 md:gap-3 p-1.5 md:p-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md max-w-[95vw]">
                    {[
                        { id: 'VALIDATOR', icon: Sparkles, label: 'Validator', color: 'text-emerald-400' },
                        { id: 'VC_ROAST', icon: Flame, label: 'Roast', color: 'text-red-400' },
                        { id: 'PITCH_FORGE', icon: Presentation, label: 'Forge', color: 'text-amber-400' },
                        { id: 'BATTLE_ROOM', icon: Activity, label: 'Battle Room', color: 'text-cyan-400' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setScreen(tab.id as any); setSystemStatus('idle'); setActiveReport(null); }}
                            className={`relative flex items-center gap-2 px-3 md:px-5 py-2 rounded-full text-[10px] md:text-[12px] font-bold transition-all duration-300 ${screen === tab.id
                                ? 'text-white'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {screen === tab.id && (
                                <motion.div 
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white/10 border border-white/10 rounded-full shadow-lg"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <tab.icon className={`relative z-10 w-3.5 h-3.5 md:w-4 md:h-4 ${screen === tab.id ? tab.color : ''}`} />
                            <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className={`w-full flex-1 flex flex-col ${!activeReport && systemStatus === 'idle' ? 'justify-center' : ''}`}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={screen + (activeReport?.idea || '')}
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.02, y: -10 }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            className="w-full h-full flex flex-col items-center"
                        >
                            {screen === 'VALIDATOR' && (
                                <ValidatorApp
                                    onSave={saveToArchive}
                                    data={activeReport}
                                    setData={setActiveReport}
                                    setStatus={setSystemStatus}
                                />
                            )}
                            {screen === 'VC_ROAST' && <VCRoastApp onBack={() => setScreen('VALIDATOR')} setStatus={setSystemStatus} />}
                            {screen === 'PITCH_FORGE' && <PitchForgeApp onBack={() => setScreen('VALIDATOR')} setStatus={setSystemStatus} />}
                            {screen === 'BATTLE_ROOM' && <DeltaAnalysisApp archive={archive} setArchive={setArchive} />}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {screen !== 'BATTLE_ROOM' && !activeReport && (
                    <RecentIntel
                        archive={archive}
                        onSelect={(r) => {
                            setScreen('VALIDATOR');
                            setActiveReport(r);
                            setSystemStatus('active');
                        }}
                    />
                )}

                <div className="no-print relative mt-auto py-8 md:py-10 w-full flex flex-col items-center transition-opacity z-50">
                    <div className="flex flex-col items-center gap-4 transition-opacity duration-1000">
                        <div className="flex items-center gap-4 text-slate-500 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.4em]">
                            <div className={`w-1 h-1 rounded-full ${systemStatus === 'idle' ? 'bg-amber-500' : 'bg-cyan-500 animate-ping'}`} />
                            {systemStatus === 'idle' ? 'SYSTEM STANDBY: AWAITING INPUT' : 'ENGINEERED FOR STRATEGIC DOMINANCE'}
                        </div>
                        <div className={`flex flex-wrap justify-center gap-x-6 md:gap-x-12 gap-y-2 md:gap-y-4 text-[8px] md:text-[9px] font-black tracking-[0.2em] uppercase transition-colors duration-500 ${systemStatus === 'idle' ? 'text-slate-800' : 'text-slate-600'}`}>
                            <div className="flex items-center gap-2">
                                <span>DATA GROUNDING:</span>
                                <span className={systemStatus === 'idle' ? 'text-slate-900' : 'text-cyan-400'}>{systemStatus === 'idle' ? 'OFFLINE' : 'VERIFIED'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>NEURAL DEPTH:</span>
                                <span className={systemStatus === 'idle' ? 'text-slate-900' : 'text-white'}>{systemStatus === 'idle' ? '0-DIM' : '128-DIM'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>MARKET SYNC:</span>
                                <span className={systemStatus === 'idle' ? 'text-slate-900' : 'text-emerald-400'}>{systemStatus === 'idle' ? 'IDLE' : 'LIVE'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>GUARDRAILS:</span>
                                <span className={systemStatus === 'idle' ? 'text-slate-900' : 'text-purple-400'}>{systemStatus === 'idle' ? 'STANDBY' : 'DEP-7 ACTIVE'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
