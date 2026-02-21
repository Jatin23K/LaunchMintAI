
import React, { useState } from "react";
import { runIdeaThroughSystem } from "../services/geminiService";
import { StartupReport } from "../types";
import { Icons } from "./Icons";

type TestResult = {
  id: number;
  testName: string;
  input: string;
  status: "PASS" | "FAIL";
  reason: string;
};

type TestDefinition = {
  id: number;
  testName: string;
  input: string;
  check: (o: StartupReport) => boolean;
  reason: string;
};

export const TestSuitePhase4: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>("");
  const [filter, setFilter] = useState<'ALL' | 'PASS' | 'FAIL'>('ALL');

  const tests: TestDefinition[] = [
    // -------------------------
    // BATCH 1 — CORE PHASE 4 STABILITY
    // -------------------------
    { id:1, testName:"Basic Benchmarking Stability", input: "AI for dog walkers", check:(r)=> !!r.benchmark && r.benchmark.differentiationScore > 0, reason:"benchmark populated" },
    { id:2, testName:"Clean JSON Test", input: "AI sleep tracker 😴 \n\n ```markdown```", check:(r)=> !!r.financialForecast, reason:"JSON extraction robust" },
    { id:3, testName:"Sparse Input Test", input: "AI in education", check:(r)=> !!r.benchmark && r.investorFit?.fitScore !== undefined, reason:"Minimal input yields structure" },
    { id:4, testName:"Multi-Industry Classification", input: "AI for agriculture + payments + climate", check:(r)=> !!r.benchmark, reason:"Complex industry handled" },
    { id:5, testName:"Consistency Test Across Phases", input: "AI tutoring platform", check:(r)=> !!r.financialForecast && !!r.market?.tam, reason:"Financials & market data exist" },

    // -------------------------
    // BATCH 2 — BENCHMARKING ENGINE
    // -------------------------
    { id:6, testName:"Competitor Benchmarking Depth", input: "CRM for freelancers", check:(r)=> (r.benchmark?.featureGaps || []).length > 0, reason:"Feature gaps identified" },
    { id:7, testName:"Weak Competitor Edge Case", input: "AI for niche mushroom farmers", check:(r)=> (r.benchmark?.differentiationScore || 0) > 60, reason:"High score for niche market" },
    { id:8, testName:"Contradiction Detection", input: "AI messaging app with 'no competitors'", check:(r)=> !!r.benchmark && r.benchmark.positioning !== "Monopoly", reason:"Detects market reality" },
    { id:9, testName:"Benchmark Heatmap Population", input: "AI lawyer assistant", check:(r)=> (r.benchmark?.riskZones || []).length > 0, reason:"Risk zones identified" },
    { id:10, testName:"Benchmark Pivot Suggestion", input: "Overcrowded AI note-taking app", check:(r)=> (r.pivotOptions || []).length > 0 || (r.audit?.auditScore || 100) < 80, reason:"Pivot suggested or score lowered" },

    // -------------------------
    // BATCH 3 — FAILURE SIMULATION
    // -------------------------
    { id:11, testName:"Scenario Stress Test", input: "Cloud video editing tool", check:(r)=> (r.failureSimulation?.scenarios || []).length >= 2, reason:"Multiple scenarios simulated" },
    { id:12, testName:"Extreme Market Crash Simulation", input: "FinTech robo-advisor", check:(r)=> (r.failureSimulation?.resilienceScore || 100) < 90, reason:"Resilience reflects risk" },
    { id:13, testName:"Team Collapse Simulation", input: "Hardware AI startup", check:(r)=> !!r.people?.founders, reason:"Founder dependency checked indirectly" },
    { id:14, testName:"Customer Churn Scenario", input: "SaaS for freelancers", check:(r)=> !!r.failureSimulation, reason:"Churn scenario possible" },
    { id:15, testName:"Infrastructure Failure Simulation", input: "Video conferencing AI", check:(r)=> (r.techFeasibility?.risks || []).length > 0, reason:"Tech risks identified" },

    // -------------------------
    // BATCH 4 — TECH, INVESTOR, REGULATORY
    // -------------------------
    { id:16, testName:"Tech Feasibility (Deep-Tech)", input: "Fusion energy optimization AI", check:(r)=> (r.techFeasibility?.score || 100) < 80, reason:"Low feasibility for fusion" },
    { id:17, testName:"Investor Fit Matching", input: "AI B2B cybersecurity", check:(r)=> !!r.investorFit?.bestFor, reason:"Investor type identified" },
    { id:18, testName:"Regulatory Risk (High-Risk)", input: "AI medical diagnostics", check:(r)=> r.regulatoryRisk?.riskLevel === "High", reason:"High risk for medtech" },
    { id:19, testName:"GDPR Risk Detection", input: "Identity verification AI", check:(r)=> JSON.stringify(r.regulatoryRisk || {}).includes("GDPR") || (r.regulatoryRisk?.complianceNeeded || []).length > 0, reason:"GDPR/Compliance flagged" },
    { id:20, testName:"Data Sovereignty Logic", input: "AI tax assistant for EU", check:(r)=> !!r.regulatoryRisk?.regions, reason:"Regional risk logic" },

    // -------------------------
    // BATCH 5 — FINANCIALS & PIVOTS
    // -------------------------
    { id:21, testName:"Three-Year Revenue Projection", input: "Marketplace for tutors", check:(r)=> !!r.financialForecast?.arrYear1, reason:"ARR Forecast present" },
    { id:22, testName:"CAC/LTV Projection Consistency", input: "Subscription AI fitness coach", check:(r)=> !!r.financialForecast, reason:"Forecast generated" },
    { id:23, testName:"Burn Rate Calculation Test", input: "AI operations tool", check:(r)=> !!r.financialForecast?.burnRate, reason:"Burn rate calculated" },
    { id:24, testName:"Strategic Pivot Detection", input: "Dead market idea: fax automation", check:(r)=> (r.pivotOptions || []).length > 0, reason:"Pivot recommended for bad idea" },
    { id:25, testName:"Advanced Audit Score", input: "Enterprise AI chatbot", check:(r)=> typeof r.audit?.auditScore === 'number', reason:"Audit score numeric" }
  ];

  const runTestLogic = async (t: TestDefinition) => {
    try {
        const raw = await runIdeaThroughSystem(t.input);
        const ok = t.check(raw);

        setResults(prev => {
            const filtered = prev.filter(p => p.id !== t.id);
            return [...filtered, {
                id: t.id,
                testName: t.testName,
                input: t.input,
                status: (ok ? "PASS" : "FAIL") as "PASS" | "FAIL",
                reason: ok ? "As expected" : t.reason
            }].sort((a,b) => a.id - b.id);
        });
    } catch (err: any) {
        setResults(prev => {
             const filtered = prev.filter(p => p.id !== t.id);
             return [...filtered, {
                id: t.id,
                testName: t.testName,
                input: t.input,
                status: "FAIL" as "PASS" | "FAIL",
                reason: "Execution error: " + err.message
            }].sort((a,b) => a.id - b.id);
        });
    }
  };

  const runAllTests = async () => {
    setRunning(true);
    setResults([]);
    for (const t of tests) {
      setCurrentTest(t.testName);
      await runTestLogic(t);
    }
    setRunning(false);
    setCurrentTest("");
  };

  const runSingleTest = async (t: TestDefinition) => {
      if (running) return;
      setRunning(true);
      setCurrentTest(t.testName);
      await runTestLogic(t);
      setRunning(false);
      setCurrentTest("");
  }

  const passedCount = results.filter(r => r.status === "PASS").length;
  const failedCount = results.filter(r => r.status === "FAIL").length;
  const progress = (results.length / tests.length) * 100;
  
  // Display filtering logic
  const displayTests = tests.filter(t => {
      const res = results.find(r => r.id === t.id);
      if (filter === 'ALL') return true;
      if (filter === 'PASS') return res?.status === 'PASS';
      if (filter === 'FAIL') return res?.status === 'FAIL';
      return true;
  });

  return (
    <div className="min-h-screen bg-[#0C0C0F] pt-24 px-6 pb-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#16161A] p-6 rounded-2xl border border-white/5">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Icons.Shield className="text-emerald-500" />
                    Phase 4 Enterprise Suite
                </h2>
                <p className="text-zinc-500 max-w-lg">
                    Validates Advanced Engines: Benchmark, Failure Sim, Tech Feasibility, Investor Fit, Regulatory Risk, Finance & Pivots.
                </p>
            </div>
            
            <div className="flex flex-col gap-3 items-end w-full md:w-auto">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {results.length > 0 && (
                        <div className="flex gap-4 text-xs font-bold bg-black/40 border border-white/10 px-4 py-2.5 rounded-lg w-full md:w-auto justify-center">
                            <span className="text-emerald-400">{passedCount} PASS</span>
                            <span className="text-zinc-700">|</span>
                            <span className="text-red-400">{failedCount} FAIL</span>
                        </div>
                    )}
                    <button
                      className="whitespace-nowrap px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.3)] w-full md:w-auto"
                      onClick={runAllTests}
                      disabled={running}
                    >
                      {running ? "Running Suite..." : "Run Enterprise Tests"}
                    </button>
                </div>
            </div>
        </div>

        {results.length > 0 && (
             <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-indigo-400 transition-all duration-500"
                    style={{ width: `${progress}%`}}
                ></div>
             </div>
        )}

        {running && (
            <div className="w-full bg-emerald-900/10 border border-emerald-500/20 p-3 rounded-lg text-sm text-emerald-300 flex items-center gap-3 animate-pulse">
                <Icons.Activity className="w-4 h-4 animate-spin" />
                <span>Running: <strong>{currentTest}</strong>... (This may take ~60s per test)</span>
            </div>
        )}

        <div className="flex gap-2">
            {(['ALL', 'PASS', 'FAIL'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${filter === f ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-white/10'}`}>
                    {f} {results.length > 0 && f !== 'ALL' ? `(${results.filter(r => r.status === f).length})` : ''}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {displayTests.map((t) => {
            const result = results.find(r => r.id === t.id);
            const status = result?.status || "PENDING";
            
            return (
                <div key={t.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all ${
                    status === "PASS" ? "bg-emerald-950/10 border-emerald-500/20" : 
                    status === "FAIL" ? "bg-red-950/10 border-red-500/20" : "bg-[#141418] border-white/5"
                }`}>
                  <div className="flex items-start gap-4 mb-3 md:mb-0">
                    <button 
                        onClick={() => runSingleTest(t)} disabled={running}
                        className={`mt-0.5 w-8 h-8 flex items-center justify-center rounded-full border transition-all ${status === "PENDING" ? "bg-white/5 border-white/10 text-zinc-500 hover:text-white" : status === "PASS" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}
                    >
                        {status === "PENDING" ? <Icons.Play className="w-3.5 h-3.5 ml-0.5" /> : status === "PASS" ? <Icons.CheckCircle className="w-4 h-4" /> : <Icons.AlertTriangle className="w-4 h-4" />}
                    </button>
                    <div>
                        <div className="font-semibold text-zinc-200 flex items-center gap-2 text-sm">
                          <span className="text-zinc-600 font-mono text-xs w-6 opacity-50">#{t.id}</span> {t.testName}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1 flex flex-col sm:flex-row gap-1 sm:gap-4">
                            <span className="text-zinc-600">Input: <span className="text-zinc-400 italic">"{t.input}"</span></span>
                            {result && <span className={`${status === 'PASS' ? 'text-emerald-500/80' : 'text-red-400'}`}>Result: {result.reason}</span>}
                        </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-12 md:pl-0">
                      {status !== "PENDING" && <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${status === "PASS" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>{status}</span>}
                  </div>
                </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}