import React, { forwardRef } from 'react';
import { RealData } from '../types';

const ForensicReport = forwardRef<HTMLDivElement, { data: RealData, input: string }>((props, ref) => {
    const { data, input } = props;
    return (
        <div ref={ref} className="p-12 bg-white text-slate-900 min-h-screen" style={{ width: '800px', margin: '0 auto', position: 'absolute', left: '-9999px', top: 0 }}>
            <div className="border-b-8 border-slate-900 pb-8 mb-12">
                <div className="flex justify-between items-end">
                    <div>
                        <div className="text-slate-500 font-mono text-sm uppercase tracking-[0.5em] mb-2 font-bold">LaunchMint Intelligence Brief</div>
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic">{input}</h1>
                    </div>
                    <div className="text-right">
                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Classification: TOP SECRET</div>
                        <div className="text-slate-900 font-black text-xs uppercase tracking-widest">{new Date().toLocaleDateString()}</div>
                    </div>
                </div>
            </div>

            {/* 1. GOD MODE VERDICT */}
            <section className="mb-16">
                <div className="flex items-center gap-2 mb-6 border-l-8 border-emerald-500 pl-4">
                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">I. Final Strategic Verdict</h2>
                    <span className="ml-auto text-sm font-black text-emerald-600 border-2 border-emerald-600 px-3 py-1 rounded">RISK: {data.god_mode?.risk_score}</span>
                </div>
                <div className="p-8 bg-slate-50 border-2 border-slate-200 rounded-3xl">
                    <p className="text-2xl font-bold text-slate-900 italic mb-6 leading-tight">"{data.god_mode?.macro_verdict}"</p>
                    <p className="text-slate-600 leading-relaxed text-lg">{data.god_mode?.swarm_summary}</p>
                </div>
            </section>

            {/* 2. MARKET VITALS */}
            <section className="mb-16">
                <div className="flex items-center gap-2 mb-6 border-l-8 border-cyan-500 pl-4">
                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">II. Market Vitals</h2>
                </div>
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Forecast TAM ({data.market.forecast_year || "2030"})</div>
                        <div className="text-4xl font-black text-slate-900">{data.market.forecast_tam || data.market.size}</div>
                    </div>
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current TAM ({data.market.current_year || "2024/25"})</div>
                        <div className="text-4xl font-black text-slate-900">{data.market.current_tam || "N/A"}</div>
                    </div>
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Veracity Index</div>
                        <div className="text-2xl font-bold text-emerald-600">{data.forensics ? `${Math.round(data.forensics.veracity_index * 100)}%` : "Verified"}</div>
                    </div>
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Forensic Weight</div>
                        <div className="text-2xl font-bold text-blue-600">{data.forensics ? `${Math.round(data.forensics.confidence_score * 100)}%` : data.market.confidence}</div>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl">
                    <h4 className="font-black text-slate-900 mb-2 uppercase text-xs tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Market Timing: {data.market.timing?.label}
                    </h4>
                    <p className="text-slate-600 italic text-sm leading-relaxed">{data.market.timing?.rationale}</p>
                    <div className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Source Link: {data.market.source_url}</div>
                </div>
            </section>

            {/* 3. COMPETITOR FORENSIC DOSSIERS */}
            <section className="mb-16 break-before-page">
                <div className="flex items-center gap-2 mb-8 border-l-8 border-purple-500 pl-4">
                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">III. Competitor Forensic Dossiers</h2>
                </div>
                <div className="space-y-12">
                    {data.competitors.slice(0, 3).map((c, i) => (
                        <div key={i} className="border-4 border-slate-900 rounded-[2rem] overflow-hidden">
                            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">{c.name}</h3>
                                <div className="text-[10px] font-black tracking-widest uppercase border border-white/20 px-3 py-1 rounded-full whitespace-nowrap overflow-hidden max-w-[200px] truncate">{c.url}</div>
                            </div>
                            <div className="p-8 grid grid-cols-3 gap-8 border-b-2 border-slate-100">
                                <div className="space-y-4">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Market & Finance</div>
                                    <div className="text-xs space-y-2">
                                        <p><span className="font-bold">Funding:</span> {c.market_fin.funding}</p>
                                        <p><span className="font-bold">Share:</span> {c.market_fin.share || "N/A"}</p>
                                        <p><span className="font-bold">Audience:</span> {c.market_fin.audience || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Product Intel</div>
                                    <div className="text-xs space-y-2">
                                        <p><span className="font-bold">Pricing:</span> {c.product_intel.pricing}</p>
                                        <p><span className="font-bold">UX:</span> {c.product_intel.ux_friction || "N/A"}</p>
                                        <p><span className="font-bold">Stack:</span> {c.technical_infra.stack}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Sentiment Scan</div>
                                    <div className="text-xs space-y-2">
                                        <p><span className="font-bold">Complaints:</span> {c.sentiment.complaints || "N/A"}</p>
                                        <p><span className="font-bold">Trust:</span> {c.sentiment.trust_score || "N/A"}</p>
                                        <p><span className="font-bold text-red-600 uppercase">Fatal Weakness:</span> {c.weakness}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 bg-slate-50 italic">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 underline">The Kill Strategy</span>
                                <p className="text-slate-900 font-bold leading-relaxed">"{c.kill_strategy}"</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. EXECUTION PLAN */}
            <section className="mb-16 break-before-page">
                <div className="flex items-center gap-2 mb-8 border-l-8 border-emerald-500 pl-4">
                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">IV. Multi-Department Execution Plan</h2>
                </div>
                <div className="grid grid-cols-2 gap-8">
                    {[
                        { id: 'Legal', d: data.dept_legal || [] },
                        { id: 'Product', d: data.dept_product || [] },
                        { id: 'Marketing', d: data.dept_marketing || [] },
                        { id: 'Finance', d: data.dept_finance || [] }
                    ].map((dept) => (
                        <div key={dept.id} className="border-2 border-slate-900 rounded-3xl p-8">
                            <h3 className="text-xl font-black uppercase tracking-widest mb-6 border-b-2 border-slate-900 pb-2 flex justify-between items-center text-slate-900">
                                {dept.id} DEP.
                                <span className="text-[8px] font-bold text-slate-400 tracking-widest">OPS/SYNC: 100%</span>
                            </h3>
                            <div className="space-y-4">
                                {dept.d.map((point, idx) => (
                                    <div key={idx} className="flex gap-4 items-baseline">
                                        <span className="font-black text-slate-300 text-sm">0{idx + 1}</span>
                                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{point}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 5. STRATEGIC AUDIT GUARDRAILS */}
            <section className="break-before-page">
                <div className="flex items-center gap-2 mb-8 border-l-8 border-slate-900 pl-4">
                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">V. Strategic Audit Guardrails</h2>
                </div>
                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200">
                    <ul className="space-y-6 text-sm">
                        <li className="flex gap-4">
                            <span className="font-black text-slate-900">GA-1.0</span>
                            <p className="text-slate-600"><span className="font-bold text-slate-900">Snapshot Analysis:</span> Verdict is static and based on real-time public data signals at the exact moment of generation. Market dynamics post-generation are not accounted for.</p>
                        </li>
                        <li className="flex gap-4">
                            <span className="font-black text-slate-900">GA-2.0</span>
                            <p className="text-slate-600"><span className="font-bold text-slate-900">Public Signal Integrity:</span> Analyzes aggressive market trends and known competitor moves; excludes non-public VC discussions or NDA-protected roadmap pivots.</p>
                        </li>
                        <li className="flex gap-4">
                            <span className="font-black text-slate-900">GA-3.0</span>
                            <p className="text-slate-600"><span className="font-bold text-slate-900">Logical Probability:</span> Strategic theories provided are probabilistic insights derived from neural pattern matching, not absolute predictive physical laws.</p>
                        </li>
                    </ul>
                </div>
                <div className="mt-12 pt-8 border-t border-slate-200 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.8em]">END OF FORENSIC INTELLIGENCE BRIEF</p>
                </div>
            </section>
        </div>
    );
});

export default ForensicReport;
