import React, { useEffect, useRef } from 'react';
import { AgentEvent } from '../types';
import { Icons } from './Icons';
import { AGENT_LIST } from '../constants';

interface AgentStatusProps {
  logs: AgentEvent[];
  activeAgent: string | null;
  completedAgents: string[];
}

export const AgentStatus: React.FC<AgentStatusProps> = ({ logs, activeAgent, completedAgents }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pipelineRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Auto-scroll pipeline to active agent
  useEffect(() => {
    if (activeAgent && pipelineRef.current) {
        const activeEl = document.getElementById(`agent-card-${activeAgent}`);
        if (activeEl) {
            activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
  }, [activeAgent]);

  // Get specific icon for agent
  const getAgentIcon = (agentName: string) => {
    const map: Record<string, any> = {
        'MarketAgent': Icons.Market,
        'CompetitorAgent': Icons.Competitors,
        'SignalsAgent': Icons.Signals,
        'CriticAgent': Icons.Critic,
        'StrategyAgent': Icons.Strategy,
        'DesignAgent': Icons.Design,
        'BrandingAgent': Icons.Branding,
        'EngineeringAgent': Icons.Engineering,
        'OperationsAgent': Icons.Operations,
        'LegalAgent': Icons.Legal,
        'StressTestAgent': Icons.StressTest,
        'PresentationAgent': Icons.PitchDeck,
        'MetaAuditAgent': Icons.Audit
    };
    const Icon = map[agentName] || Icons.Brain;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className="flex flex-col h-full gap-6 w-full max-w-6xl mx-auto px-4 md:px-0">
      
      {/* 3. AGENT PIPELINE UI */}
      <div className="w-full overflow-x-auto pb-4 no-scrollbar" ref={pipelineRef}>
        <div className="flex gap-4 min-w-max px-1">
            {AGENT_LIST.map((agent, index) => {
                const isActive = activeAgent === agent;
                const isDone = completedAgents.includes(agent);
                const isFailed = false; // Logic for failure could be added here
                
                let borderColor = "border-white/10";
                let bgClass = "bg-white/5";
                let textColor = "text-zinc-500";
                let statusText = "Queued";
                
                if (isActive) {
                    borderColor = "border-indigo-500/50";
                    bgClass = "bg-indigo-900/10";
                    textColor = "text-indigo-400";
                    statusText = "Running...";
                } else if (isDone) {
                    borderColor = "border-emerald-500/30";
                    bgClass = "bg-emerald-900/10";
                    textColor = "text-emerald-400";
                    statusText = "Complete";
                }

                return (
                    <div 
                        key={agent} 
                        id={`agent-card-${agent}`}
                        className={`w-48 p-4 rounded-xl border ${borderColor} ${bgClass} transition-all duration-300 relative overflow-hidden group`}
                    >
                        {isActive && <div className="absolute inset-0 bg-indigo-500/5 animate-pulse"></div>}
                        
                        <div className="flex justify-between items-start mb-3 relative z-10">
                            <span className="text-xs font-mono opacity-50">{(index + 1).toString().padStart(2, '0')}</span>
                            <div className={`${textColor}`}>
                                {getAgentIcon(agent)}
                            </div>
                        </div>
                        
                        <div className="relative z-10">
                            <h3 className={`font-semibold text-sm mb-1 ${isDone || isActive ? 'text-white' : 'text-zinc-400'}`}>
                                {agent.replace('Agent', '')}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${
                                    isActive ? 'bg-indigo-400 animate-pulse' : 
                                    isDone ? 'bg-emerald-400' : 'bg-zinc-700'
                                }`}></span>
                                <span className={`text-xs ${textColor}`}>{statusText}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* 4. ORCHESTRATOR TERMINAL PANEL */}
      <div className="flex-1 min-h-0 bg-[#0a0a0f]/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* Sidebar Agent List */}
        <div className="w-full md:w-64 bg-black/20 border-r border-white/5 flex flex-col">
            <div className="p-4 border-b border-white/5 bg-white/5">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Icons.Layers className="w-4 h-4" /> Active Processes
                </h3>
            </div>
            <div className="overflow-y-auto p-2 space-y-1">
                {AGENT_LIST.map((agent) => {
                    const isActive = activeAgent === agent;
                    const isDone = completedAgents.includes(agent);
                    return (
                        <div key={agent} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 
                            isDone ? 'text-emerald-500/70' : 'text-zinc-600'
                        }`}>
                            <div className={`${isActive ? 'animate-spin' : ''}`}>
                                {isDone ? <Icons.CheckCircle className="w-4 h-4" /> : 
                                 isActive ? <Icons.Activity className="w-4 h-4" /> : 
                                 <div className="w-4 h-4 rounded-full border border-zinc-700" />}
                            </div>
                            <span className="truncate">{agent.replace('Agent', '')}</span>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Terminal Output */}
        <div className="flex-1 flex flex-col bg-black/40 relative font-mono text-sm">
             <div className="absolute top-0 right-0 p-4 z-10">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 space-y-2 text-zinc-300" ref={scrollRef}>
                <div className="text-zinc-500 mb-4">
                    MintifyAI Orchestrator v2.0 initialized...<br/>
                    Ready for input stream.
                </div>
                
                {logs.map((log, idx) => (
                    <div key={idx} className="break-words animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-zinc-600 select-none mr-2">
                            {new Date().toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                        </span>
                        
                        {log.event === 'agent_start' && (
                            <span className="text-indigo-400 font-semibold">
                                {`> Initializing ${log.agent}...`}
                            </span>
                        )}
                        
                        {log.event === 'agent_complete' && (
                            <span className="text-emerald-400">
                                {`> ${log.agent} completed successfully.`}
                            </span>
                        )}
                        
                        {log.event === 'agent_error' && (
                            <span className="text-red-400 bg-red-900/10 px-2 py-1 rounded border border-red-900/30">
                                {`> CRITICAL ERROR: ${log.error}`}
                            </span>
                        )}
                        
                        {log.event === 'complete' && (
                            <div className="mt-4 p-3 border border-indigo-500/30 bg-indigo-500/10 rounded text-indigo-300">
                                <span className="font-bold">{`> SYSTEM: All processes finished. Report generation complete.`}</span>
                            </div>
                        )}
                        
                        {!['agent_start', 'agent_complete', 'agent_error', 'complete'].includes(log.event) && (
                            <span className="text-zinc-400">{JSON.stringify(log)}</span>
                        )}
                    </div>
                ))}
                
                {activeAgent && (
                    <div className="animate-pulse text-indigo-500 mt-2">_</div>
                )}
             </div>
        </div>

      </div>
    </div>
  );
};