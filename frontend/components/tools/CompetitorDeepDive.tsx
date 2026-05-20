import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { runStandaloneTool } from '../../services/geminiService';
import { CompetitorDeepDiveSchema, COMPETITOR_DEEPDIVE_FALLBACK } from '../../lib/schemas';
import { CompetitorDeepDiveInput, CompetitorDeepDiveResult } from '../../types';

export const CompetitorDeepDive: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompetitorDeepDiveResult | null>(null);
  const [formData, setFormData] = useState<CompetitorDeepDiveInput>({
    industry: '',
    productName: '',
    productDescription: '',
    knownCompetitors: '', // New Field
    targetAudience: '',
    intent: 'Entering market',
    mode: 'Industry-Discovery'
  });

  // Deterministic Mode Logic
  // Product-Defined: productName exists AND (productDescription OR targetAudience exists)
  // Industry-Discovery: product fields empty OR knownCompetitors empty (default fallback)
  useEffect(() => {
    const hasProductName = !!formData.productName?.trim();
    const hasProductContext = !!(formData.productDescription?.trim() || formData.targetAudience?.trim());
    
    if (hasProductName && hasProductContext) {
        setFormData(prev => ({ ...prev, mode: 'Product-Defined' }));
    } else {
        setFormData(prev => ({ ...prev, mode: 'Industry-Discovery' }));
    }
  }, [formData.productName, formData.productDescription, formData.targetAudience]);

  const handleRun = async () => {
    if (!formData.industry) return;
    setLoading(true);
    setResult(null); 
    
    try {
        const res = await runStandaloneTool(
            'CompetitorDeepDive',
            formData,
            CompetitorDeepDiveSchema,
            COMPETITOR_DEEPDIVE_FALLBACK
        ) as CompetitorDeepDiveResult;
        setResult(res);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const getQualityColor = (score: number) => {
      if (score >= 80) return "text-emerald-400";
      if (score >= 50) return "text-amber-400";
      return "text-red-400";
  };

  const ThreatScoreBadge = ({ score }: { score: number }) => {
      let color = "bg-emerald-500";
      let textColor = "text-emerald-400";
      let text = "Low Threat";
      if (score >= 3) { color = "bg-amber-500"; textColor = "text-amber-400"; text = "Medium Threat"; }
      if (score >= 4.5) { color = "bg-red-500"; textColor = "text-red-400"; text = "CRITICAL THREAT"; }
      
      return (
          <div className="flex items-center gap-2">
              <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                      <div key={i} className={`w-2 h-6 rounded-sm ${i <= score ? color : 'bg-white/10'}`}></div>
                  ))}
              </div>
              <span className={`text-xs font-bold uppercase ${textColor}`}>{text}</span>
          </div>
      );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 text-zinc-200">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
            <Icons.Target className="w-6 h-6 text-blue-400" />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-white">Competitor DeepDive <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 ml-2 align-middle">V2 ENTERPRISE</span></h1>
            <p className="text-zinc-400">5-Layer Competitive Intelligence & "Art of War" Strategy Engine.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* INPUT PANEL - Takes up less space now */}
        <div className="lg:col-span-3 space-y-6">
            <div className="bg-[#14171C] p-6 rounded-xl border border-white/10 shadow-lg sticky top-6">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Mission Config</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Industry (Required)</label>
                        <input 
                            type="text" 
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none transition-colors"
                            placeholder="e.g. FinTech, SaaS..."
                            value={formData.industry}
                            onChange={e => setFormData({...formData, industry: e.target.value})}
                        />
                    </div>

                    <div>
                         <label className="block text-xs font-medium text-zinc-400 mb-1">Target Competitors (Optional)</label>
                         <input 
                             type="text" 
                             className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none transition-colors"
                             placeholder="e.g. Stripe, PayPal (Empty = Auto)"
                             value={formData.knownCompetitors}
                             onChange={e => setFormData({...formData, knownCompetitors: e.target.value})}
                         />
                    </div>
                    
                     <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Product Name (Optional)</label>
                        <input 
                            type="text" 
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none transition-colors"
                            placeholder="My Startup Name"
                            value={formData.productName}
                            onChange={e => setFormData({...formData, productName: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Description (Optional)</label>
                        <textarea 
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none transition-colors h-20 resize-none"
                            placeholder="What do you do?"
                            value={formData.productDescription}
                            onChange={e => setFormData({...formData, productDescription: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Target Audience (Optional)</label>
                        <input 
                            type="text" 
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none transition-colors"
                            placeholder="e.g. Freelancers, CTOs..."
                            value={formData.targetAudience}
                            onChange={e => setFormData({...formData, targetAudience: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Intent</label>
                        <select 
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none transition-colors text-zinc-300"
                            value={formData.intent}
                            onChange={e => setFormData({...formData, intent: e.target.value})}
                        >
                            <option value="Entering market">Entering market</option>
                            <option value="Building MVP">Building MVP</option>
                            <option value="Benchmarking competitors">Benchmarking competitors</option>
                            <option value="Finding gaps">Finding gaps</option>
                        </select>
                    </div>

                    {/* Mode Preview */}
                    <div className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                        formData.mode === 'Product-Defined' 
                        ? 'bg-emerald-900/10 border-emerald-500/20 text-emerald-300' 
                        : 'bg-blue-900/10 border-blue-500/20 text-blue-300'
                    }`}>
                        <Icons.Zap className="w-3 h-3" />
                        <span>Mode: {formData.mode}</span>
                    </div>

                    <button 
                        onClick={handleRun}
                        disabled={!formData.industry || loading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(79,70,229,0.4)] flex items-center justify-center gap-2"
                    >
                        {loading ? <Icons.Activity className="w-4 h-4 animate-spin" /> : <Icons.Zap className="w-4 h-4" />}
                        {loading ? 'Running Intel...' : 'Generate DeepDive'}
                    </button>
                </div>
            </div>
        </div>

        {/* OUTPUT PANEL */}
        <div className="lg:col-span-9 space-y-8">
            {!result && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-white/5 rounded-2xl min-h-[400px]">
                    <Icons.Target className="w-12 h-12 mb-4 opacity-20" />
                    <p>Enter details and run analysis to see competitor intelligence.</p>
                </div>
            )}

            {loading && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 min-h-[400px]">
                     <Icons.Activity className="w-10 h-10 mb-4 animate-spin text-indigo-500" />
                     <p>Gathering intelligence...</p>
                </div>
            )}

            {result && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Header Metadata */}
                    <div className="flex justify-between items-center bg-[#14171C] p-4 rounded-xl border border-white/10">
                        <div className="flex items-center gap-4">
                             <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                result.meta.analysisMode === 'Product-Defined' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                             }`}>
                                {result.meta.analysisMode} Mode
                             </div>
                             <span className="text-zinc-500 text-xs hidden md:inline">|</span>
                             <span className="text-zinc-400 text-xs italic hidden md:inline">{result.meta.qualityReason}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="text-xs font-bold text-zinc-500 uppercase">Confidence</span>
                             <span className={`text-xl font-bold ${getQualityColor(result.meta.qualityScore)}`}>
                                {result.meta.qualityScore}/100
                             </span>
                        </div>
                    </div>

                    {/* SECTION 1: IDENTITY & FOOTPRINT (Cards) */}
                    <section>
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Icons.Website className="w-5 h-5 text-blue-400" /> Identity & Public Footprint
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {result.competitorIdentity.map((comp, i) => (
                                <div key={i} className="bg-[#14171C] p-5 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{comp.name}</h3>
                                        {comp.socialLinks && (
                                            <div className="flex gap-2 opacity-50">
                                                {/* Simplified icons for socials */}
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-zinc-500 font-mono mb-4">{comp.websiteUrl}</div>
                                    
                                    <div className="space-y-2 text-sm text-zinc-400">
                                        <div className="flex justify-between border-b border-white/5 pb-1">
                                            <span>HQ</span> <span className="text-zinc-200">{comp.headquarters}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-1">
                                            <span>Founded</span> <span className="text-zinc-200">{comp.foundingYear}</span>
                                        </div>
                                        <div className="pt-2">
                                            <span className="block text-xs font-bold text-zinc-600 uppercase mb-1">Reputation</span>
                                            <p className="text-xs text-zinc-300 leading-snug">{comp.reputation}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* SECTION 2: LEADERSHIP INTELLIGENCE */}
                    <section>
                         <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Icons.Users className="w-5 h-5 text-purple-400" /> Leadership Intelligence
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            {result.leadershipIntelligence.map((leaderInfo, i) => (
                                <div key={i} className="bg-[#14171C] border border-white/10 rounded-xl overflow-hidden">
                                    <div className="bg-white/5 px-4 py-2 border-b border-white/5 font-bold text-zinc-300 flex justify-between items-center">
                                        {leaderInfo.competitorName}
                                        <span className="text-xs font-normal text-zinc-500 font-mono">Style: {leaderInfo.managementStyle}</span>
                                    </div>
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {leaderInfo.founders.map((founder, j) => (
                                            <div key={j} className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                                                    {founder.name.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <h4 className="font-bold text-white text-sm">{founder.name}</h4>
                                                        <span className={`text-[10px] px-2 rounded-full border ${
                                                            founder.riskAppetite === 'High' ? 'border-red-500/30 text-red-400' : 'border-zinc-500/30 text-zinc-400'
                                                        }`}>{founder.riskAppetite} Risk</span>
                                                    </div>
                                                    <p className="text-xs text-zinc-400 mt-1 mb-2">{founder.background}</p>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <span className="text-[10px] text-zinc-600 uppercase font-bold">Strengths</span>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {founder.strengths.slice(0,2).map((s, k) => (
                                                                    <span key={k} className="text-[10px] bg-green-500/10 text-green-400 px-1 rounded">{s}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                             <span className="text-[10px] text-zinc-600 uppercase font-bold">Weaknesses</span>
                                                             <div className="flex flex-wrap gap-1 mt-1">
                                                                {founder.weaknesses.slice(0,2).map((w, k) => (
                                                                    <span key={k} className="text-[10px] bg-red-500/10 text-red-400 px-1 rounded">{w}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* SECTION 3 & 4: FINANCIALS & OPS THREAT (Split View) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Financials */}
                        <section>
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Icons.DollarSign className="w-5 h-5 text-emerald-400" /> Financial & Legal X-Ray
                            </h2>
                            <div className="space-y-4">
                                {result.financialLegal.map((fin, i) => (
                                    <div key={i} className="bg-[#14171C] p-4 rounded-xl border border-white/10">
                                        <h4 className="font-bold text-zinc-200 mb-3 border-b border-white/5 pb-2">{fin.competitorName}</h4>
                                        <div className="grid grid-cols-2 gap-y-3 text-sm">
                                            <div className="text-zinc-500">Funding</div>
                                            <div className="text-right text-emerald-400 font-mono">{fin.funding}</div>
                                            
                                            <div className="text-zinc-500">Valuation (Est)</div>
                                            <div className="text-right text-zinc-200 font-mono">{fin.valuationEstimate}</div>

                                            <div className="text-zinc-500">Revenue (Est)</div>
                                            <div className="text-right text-zinc-200 font-mono">{fin.revenueEstimate}</div>

                                            <div className="text-zinc-500">Burn Rate</div>
                                            <div className="text-right text-red-400 font-mono">{fin.burnRateEstimate}</div>
                                        </div>
                                        {fin.legalRisks.length > 0 && (
                                            <div className="mt-3 pt-2 border-t border-white/5">
                                                <span className="text-xs text-red-500 font-bold uppercase">Legal/Reg Risks</span>
                                                <p className="text-xs text-zinc-400 mt-1">{fin.legalRisks.join(", ")}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Operational Threat */}
                        <section>
                             <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Icons.RiskManagement className="w-5 h-5 text-red-500" /> Threat Level Assessment
                            </h2>
                            <div className="space-y-4">
                                {result.operationalThreat.map((threat, i) => (
                                    <div key={i} className="bg-[#14171C] p-4 rounded-xl border border-white/10">
                                        <div className="flex justify-between items-center mb-3">
                                             <h4 className="font-bold text-zinc-200">{threat.competitorName}</h4>
                                             <ThreatScoreBadge score={threat.threatScore} />
                                        </div>
                                        <div className="flex gap-2 mb-3">
                                            <span className="px-2 py-1 bg-white/5 rounded text-xs text-zinc-400">Ops: {threat.operationalCapability}</span>
                                            <span className="px-2 py-1 bg-white/5 rounded text-xs text-zinc-400">Market Power: {threat.marketPower}</span>
                                        </div>
                                        <p className="text-sm text-zinc-400 italic">"{threat.threatReason}"</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* SECTION 5: STRATEGY PLAYBOOK (Art of War) */}
                    <section className="bg-gradient-to-br from-[#1E1E24] to-[#141418] p-8 rounded-2xl border border-indigo-500/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none"></div>
                        
                         <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2 relative z-10">
                            <Icons.Zap className="w-6 h-6 text-yellow-400" /> The Founder's War Room
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                            {/* Offense */}
                            <div>
                                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Icons.Target className="w-4 h-4" /> Offensive Strategy
                                </h4>
                                <div className="bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-100 text-sm leading-relaxed mb-4">
                                    {result.strategyPlaybook.offensiveStrategy}
                                </div>
                                <div className="space-y-2">
                                    <span className="text-xs font-bold text-zinc-500">Safe Entry Zones</span>
                                    <div className="flex flex-wrap gap-2">
                                        {result.strategyPlaybook.safeEntryZones.map((zone, i) => (
                                            <span key={i} className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">{zone}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Defense */}
                             <div>
                                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Icons.Shield className="w-4 h-4" /> Defensive Strategy
                                </h4>
                                <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl text-blue-100 text-sm leading-relaxed mb-4">
                                    {result.strategyPlaybook.defensiveStrategy}
                                </div>
                                 <div className="space-y-2">
                                    <span className="text-xs font-bold text-zinc-500">Unsafe Zones (Avoid)</span>
                                    <div className="flex flex-wrap gap-2">
                                        {result.strategyPlaybook.unsafeZones.map((zone, i) => (
                                            <span key={i} className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20">{zone}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Prediction */}
                             <div>
                                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Icons.Activity className="w-4 h-4" /> Predicted Moves
                                </h4>
                                <ul className="space-y-3">
                                    {result.strategyPlaybook.predictedMoves.map((move, i) => (
                                        <li key={i} className="flex gap-3 items-start text-sm text-zinc-300">
                                            <span className="text-amber-500 font-bold mt-1">→</span>
                                            {move}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Regenerate Button */}
                    <div className="flex justify-center pt-8 border-t border-white/5">
                        <button 
                            onClick={handleRun}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/30 transition-all text-sm font-medium text-zinc-300 hover:text-white"
                        >
                            <Icons.history className="w-4 h-4" />
                            Regenerate Analysis
                        </button>
                    </div>

                </div>
            )}
        </div>
      </div>
    </div>
  );
};