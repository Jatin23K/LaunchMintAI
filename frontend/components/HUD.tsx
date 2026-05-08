import React from 'react';
import { Clock, Terminal, Activity } from 'lucide-react';
import { RealData } from '../types';

export const RecentIntel = ({ archive, onSelect }: { archive: RealData[], onSelect: (report: RealData) => void }) => {
    if (archive.length === 0) return null;
    return (
        <div className="w-full max-w-4xl mt-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex items-center gap-3 mb-6 px-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] whitespace-nowrap">Recent Intel Briefs</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {archive.map((report, i) => (
                    <button
                        key={i}
                        onClick={() => onSelect(report)}
                        className="group relative p-5 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-cyan-500/50 hover:bg-slate-900/60 transition-all text-left overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
                            <Clock className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 truncate">ID: {report.idea?.slice(0, 15)}...</div>
                        <div className="text-white font-bold truncate group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{report.idea}</div>
                        <div className="mt-3 flex items-center gap-2">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${report.god_mode?.risk_score.includes('Low') ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'}`}>
                                {report.god_mode?.risk_score}
                            </span>
                            <span className="text-[9px] font-bold text-slate-600 uppercase">Tam: {report.market.size}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export const LeftHud = ({ status }: { status: 'idle' | 'processing' | 'active' }) => {
    const logs = status === 'idle'
        ? [
            "[SYS] BIOS: OK",
            "[NET] CONNECTION: STABLE",
            "[AI] NEURAL LAYER: STANDBY",
            "[SEC] ENCRYPTION: ACTIVE",
            ">_ AWAITING COMMAND"
        ]
        : [
            "[SYS] Omega Pass Active",
            "[AI] Neural Context Scoped",
            "[NET] Veracity Check: ENABLED",
            "[SYS] Syncing Market Pulse",
            "[SEC] Guardrails: DEP-7 READY",
            status === 'processing' ? "[AI] Scoping TAM Dynamics..." : "[AI] Scoping TAM: COMPLETE",
            status === 'processing' ? "[SYS] Auditor: PRIME ACTIVE" : "[SYS] Auditor: PRIME COMPLETE"
        ];
    return (
        <div className="no-print hidden lg:flex fixed left-4 md:left-6 top-1/2 -translate-y-1/2 flex-col gap-4 z-40 opacity-40 hover:opacity-100 transition-opacity duration-700">
            <div className={`h-48 md:h-64 w-32 md:w-48 bg-slate-950/20 border ${status === 'idle' ? 'border-white/5' : 'border-cyan-500/30'} rounded-2xl p-4 md:p-6 overflow-hidden backdrop-blur-sm relative group`}>
                <div className={`absolute -inset-0.5 bg-gradient-to-b ${status === 'idle' ? 'from-white/5' : 'from-cyan-500/20'} to-transparent opacity-0 group-hover:opacity-100 transition duration-1000`}></div>
                <div className="relative">
                    <div className={`text-[10px] md:text-[12px] font-black ${status === 'idle' ? 'text-slate-500' : 'text-cyan-500'} uppercase tracking-widest mb-3 md:mb-5 flex items-center gap-2`}>
                        <Terminal className="w-3 h-3 md:w-4 md:h-4" /> ENGINE
                    </div>
                    <div className="space-y-2 md:space-y-3">
                        {logs.map((log, i) => (
                            <div key={i} className={`text-[9px] md:text-[11px] font-mono ${status === 'idle' ? 'text-slate-600' : 'text-slate-500'} border-l border-white/10 pl-2 md:pl-3 leading-tight ${status === 'processing' ? 'animate-pulse' : ''}`} style={{ animationDelay: `${i * 0.5}s` }}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none" />
            </div>
            <div className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 bg-white/5 border border-white/5 rounded-full backdrop-blur-md`}>
                <div className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full ${status === 'idle' ? 'bg-amber-500' : 'bg-green-500 animate-ping'}`} />
                <span className="text-[8px] md:text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">{status === 'idle' ? 'STANDBY' : 'LIVE'}</span>
            </div>
        </div>
    );
};

export const RightHud = ({ status }: { status: 'idle' | 'processing' | 'active' }) => {
    const vitals = [
        { label: 'GEN AI', val: status === 'active' ? 'OVERLOAD' : 'SCANNING...', color: status === 'active' ? 'text-white' : 'text-slate-600' },
        { label: 'SAAS', val: status === 'active' ? 'SATURATED' : 'SCANNING...', color: status === 'active' ? 'text-slate-400' : 'text-slate-600' },
        { label: 'DEEP TECH', val: status === 'active' ? 'BULLISH' : 'SCANNING...', color: status === 'active' ? 'text-cyan-400' : 'text-slate-600' },
        { label: 'FINTECH', val: status === 'active' ? 'CAUTION' : 'SCANNING...', color: status === 'active' ? 'text-amber-500' : 'text-slate-600' }
    ];
    return (
        <div className="no-print hidden lg:flex fixed right-4 md:right-6 top-1/2 -translate-y-1/2 flex-col gap-4 z-40 items-end opacity-40 hover:opacity-100 transition-opacity duration-700 text-right">
            <div className={`h-40 md:h-48 w-32 md:w-48 bg-slate-950/20 border ${status === 'idle' ? 'border-white/5' : 'border-purple-500/30'} rounded-2xl p-4 md:p-6 backdrop-blur-sm relative group overflow-hidden`}>
                <div className={`absolute -inset-0.5 bg-gradient-to-t ${status === 'idle' ? 'from-white/5' : 'from-purple-500/10'} to-transparent opacity-0 group-hover:opacity-100 transition duration-1000`}></div>
                <div className="relative">
                    <div className={`text-[10px] md:text-[12px] font-black ${status === 'idle' ? 'text-slate-500' : 'text-purple-400'} uppercase tracking-widest mb-4 md:mb-6 flex items-center justify-end gap-2`}>
                        VITALS <Activity className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                    <div className="space-y-3 md:space-y-4">
                        {vitals.map((item, i) => (
                            <div key={i} className="flex flex-col gap-0.5 md:gap-1">
                                <span className="text-[8px] md:text-[10px] font-black text-slate-600 tracking-tighter uppercase">{item.label}</span>
                                <span className={`text-[10px] md:text-[12px] font-black ${item.color} italic tracking-widest ${status === 'processing' ? 'animate-pulse' : ''}`}>{item.val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="px-4 md:px-6 py-2 md:py-3 bg-white/5 border border-white/5 rounded-full backdrop-blur-md flex items-center gap-2 text-right">
                <span className="text-[8px] md:text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase whitespace-nowrap">Lat: <span className={status === 'idle' ? 'text-slate-600' : 'text-cyan-400'}>{status === 'idle' ? '0ms' : '14ms'}</span></span>
            </div>
        </div>
    );
};

