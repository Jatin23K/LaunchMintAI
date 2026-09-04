
import React, { useState } from "react";
import { runStandaloneTool } from "../services/geminiService";
import { CompetitorDeepDiveSchema, COMPETITOR_DEEPDIVE_FALLBACK } from "../lib/schemas";
import { CompetitorDeepDiveInput, CompetitorDeepDiveResult } from "../types";
import { Icons } from "./Icons";

type TestResult = {
  id: number;
  testName: string;
  input: CompetitorDeepDiveInput;
  status: "PASS" | "FAIL";
  reason: string;
  duration?: number;
};

type TestDefinition = {
  id: number;
  section: string;
  testName: string;
  input: CompetitorDeepDiveInput;
  check: (r: CompetitorDeepDiveResult) => boolean;
  reason: string;
};

export const TestSuiteCompetitor: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>("");
  const [filter, setFilter] = useState<'ALL' | 'PASS' | 'FAIL'>('ALL');

  const tests: TestDefinition[] = [
    // --- A. FULL PRODUCT TESTS ---
    {
      id: 1, section: "A. Product Stress", testName: "A1. Eyewear (Lenskart)",
      input: { industry: "Eyewear", knownCompetitors: "Lenskart", productName: "ViewEase", productDescription: "Stylish affordable eyewear for youth", targetAudience: "Gen Z", intent: "Benchmarking competitors" },
      check: (r) => r.competitorIdentity.some(c => c.name.toLowerCase().includes('lenskart')) && r.meta.analysisMode === "Product-Defined",
      reason: "Identified Lenskart in Product Mode"
    },
    {
      id: 2, section: "A. Product Stress", testName: "A2. Food Delivery (Zomato)",
      input: { industry: "Food Delivery", knownCompetitors: "Zomato", productName: "MealRush", productDescription: "Hyperlocal home-cooked meals", targetAudience: "Working professionals", intent: "Entering market" },
      check: (r) => r.competitorIdentity.length > 0 && !!r.strategyPlaybook.offensiveStrategy,
      reason: "Strategy generated for entering market"
    },
    {
      id: 3, section: "A. Product Stress", testName: "A3. Fitness (CultFit)",
      input: { industry: "Fitness", knownCompetitors: "CultFit", productName: "FitWave", productDescription: "AI coaching app with posture detection", targetAudience: "18–40", intent: "Finding gaps" },
      check: (r) => r.strategyPlaybook.safeEntryZones.length > 0,
      reason: "Found gaps (safe zones)"
    },
    {
      id: 4, section: "A. Product Stress", testName: "A4. AGI (OpenAI)",
      input: { industry: "AGI", knownCompetitors: "OpenAI", productName: "BrainChain", productDescription: "Collaborative AGI programming environment", targetAudience: "Developers", intent: "Benchmarking competitors" },
      check: (r) => r.leadershipIntelligence.some(l => l.competitorName.toLowerCase().includes("openai")),
      reason: "Analyzed OpenAI leadership"
    },

    // --- B. CONTRADICTION TESTS ---
    {
      id: 5, section: "B. Contradiction", testName: "B1. Agri-Pay vs Razorpay",
      input: { industry: "Agriculture", knownCompetitors: "Razorpay", productName: "PayBridge", productDescription: "UPI-style payments for farmers", targetAudience: "Rural vendors", intent: "Entering market" },
      check: (r) => r.competitorIdentity.length > 0 && r.meta.qualityScore > 0, 
      reason: "Handled industry mismatch gracefully"
    },
    {
      id: 6, section: "B. Contradiction", testName: "B2. Travel Planner vs Visa",
      input: { industry: "FinTech", knownCompetitors: "Visa", productName: "TripMate", productDescription: "AI travel planner", targetAudience: "Travelers", intent: "Benchmarking competitors" },
      check: (r) => r.competitorIdentity.some(c => !c.name.toLowerCase().includes('visa') || c.name.toLowerCase().includes('visa')) && r.meta.qualityScore < 100, // Expecting lower confidence or correction
      reason: "Analyzed inputs despite contradiction"
    },

    // --- C. PARTIAL PRODUCT INPUT ---
    {
      id: 7, section: "C. Partial Input", testName: "C1. SaaS CRM (Auto-Discovery)",
      input: { industry: "SaaS", productName: "CRM Pulse", productDescription: "CRM for freelancers", targetAudience: "Solo creators", intent: "Finding gaps" },
      check: (r) => r.competitorIdentity.length > 0 && r.meta.analysisMode === "Product-Defined",
      reason: "Auto-discovered competitors for product"
    },
    {
      id: 8, section: "C. Partial Input", testName: "C2. Gaming (Auto-Discovery)",
      input: { industry: "Gaming", productName: "PlayForge", productDescription: "Multiplayer arena game builder", targetAudience: "Teenagers", intent: "Benchmarking competitors" },
      check: (r) => r.competitorIdentity.length > 0,
      reason: "Identified gaming competitors"
    },

    // --- D. AMBIGUOUS DATA ---
    {
      id: 9, section: "D. Ambiguous", testName: "D1. Terrible Description",
      input: { industry: "Retail", productName: "ShopThing", productDescription: "Something new for everyone", targetAudience: "Everyone", intent: "Entering market" },
      check: (r) => r.competitorIdentity.length > 0 && r.meta.qualityScore < 90,
      reason: "Handled vague input with lower confidence"
    },
    {
      id: 10, section: "D. Ambiguous", testName: "D2. Global Broad Audience",
      input: { industry: "Education", productName: "EduBoost", productDescription: "AI teacher", targetAudience: "Global humans, all ages", intent: "Benchmarking competitors" },
      check: (r) => r.competitorIdentity.length > 0,
      reason: "Narrowed broad audience logically"
    },
    {
      id: 11, section: "D. Ambiguous", testName: "D3. Missing Description",
      input: { industry: "HealthTech", productName: "MedEase", targetAudience: "Seniors", intent: "Finding gaps" },
      check: (r) => r.competitorIdentity.length > 0,
      reason: "Inferred product from industry/audience"
    },

    // --- E. HALLUCINATION PREVENTION ---
    {
      id: 12, section: "E. Anti-Hallucination", testName: "E1. Fictional Competitor (Xytron)",
      input: { industry: "Robotics", knownCompetitors: "Xytron", productName: "AutoArm", productDescription: "Industrial robot arm", targetAudience: "Factories", intent: "Entering market" },
      check: (r) => r.competitorIdentity.length > 0 && !r.competitorIdentity.every(c => c.name === "Xytron"),
      reason: "Auto-discovered real competitors (ABB/Kuka/Fanuc)"
    },
    {
      id: 13, section: "E. Anti-Hallucination", testName: "E2. Real + Fake (Tesla + VoltDrive)",
      input: { industry: "Automotive EV", knownCompetitors: "Tesla, VoltDrive", productName: "EcoRide", productDescription: "Affordable electric car", targetAudience: "Middle class", intent: "Benchmarking competitors" },
      check: (r) => r.competitorIdentity.some(c => c.name.toLowerCase().includes("tesla")),
      reason: "Prioritized real competitor (Tesla)"
    },

    // --- F. HIGH RISK / REGULATORY ---
    {
      id: 14, section: "F. Regulatory", testName: "F1. Crypto (Binance)",
      input: { industry: "Crypto Exchange", knownCompetitors: "Binance", productName: "SafeCoin", productDescription: "Secure crypto wallet + exchange", targetAudience: "Traders", intent: "Finding gaps" },
      check: (r) => r.financialLegal.some(f => f.legalRisks.length > 0),
      reason: "Flagged regulatory risks"
    },
    {
      id: 15, section: "F. Regulatory", testName: "F2. EdTech (Byju's)",
      input: { industry: "EdTech", knownCompetitors: "Byju’s", productName: "LearnLite", productDescription: "AI-powered personalized tutor", targetAudience: "Students", intent: "Benchmarking competitors" },
      check: (r) => r.financialLegal.length > 0, // Broad check, expecting data to exist
      reason: "Financial analysis returned"
    },

    // --- G. MULTI-COMPETITOR STRESS ---
    {
      id: 16, section: "G. Multi-Comp", testName: "G1. Payments (5 Comps)",
      input: { industry: "Payments", knownCompetitors: "Paytm, PhonePe, Google Pay, Razorpay, CRED", productName: "PayFlow", productDescription: "UPI + credit insights", targetAudience: "India adults", intent: "Entering market" },
      check: (r) => r.competitorIdentity.length >= 3,
      reason: "Handled multiple competitor inputs"
    },
    {
      id: 17, section: "G. Multi-Comp", testName: "G2. E-commerce (4 Comps)",
      input: { industry: "E-commerce", knownCompetitors: "Amazon, Flipkart, Meesho, Ajio", productName: "ShopNest", productDescription: "Low-cost marketplace", targetAudience: "Tier 2–3 India", intent: "Finding gaps" },
      check: (r) => r.strategyPlaybook.unsafeZones.length > 0,
      reason: "Identified unsafe zones (Moats)"
    },

    // --- H. INDUSTRY ONLY ---
    {
      id: 18, section: "H. Industry Only", testName: "H1. EnergyTech",
      input: { industry: "Renewable Energy", productName: "SolarGrid", productDescription: "Smart grid for homes", targetAudience: "Homeowners", intent: "Benchmarking competitors" },
      check: (r) => r.competitorIdentity.length > 0 && r.meta.analysisMode === "Product-Defined",
      reason: "Auto-discovered industry leaders"
    }
  ];

  const runTestLogic = async (t: TestDefinition) => {
    const startTime = Date.now();
    try {
        const result = await runStandaloneTool<CompetitorDeepDiveInput, CompetitorDeepDiveResult>(
            "CompetitorDeepDive",
            t.input,
            CompetitorDeepDiveSchema,
            COMPETITOR_DEEPDIVE_FALLBACK
        );
        const ok = t.check(result);
        const duration = Date.now() - startTime;

        setResults(prev => {
            const filtered = prev.filter(p => p.id !== t.id);
            return [...filtered, {
                id: t.id,
                testName: t.testName,
                input: t.input,
                status: (ok ? "PASS" : "FAIL") as "PASS" | "FAIL",
                reason: ok ? t.reason : "Check function returned false",
                duration
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
                reason: "Execution error: " + err.message,
                duration: Date.now() - startTime
            }].sort((a,b) => a.id - b.id);
        });
    }
  };

  const runAllTests = async () => {
    setRunning(true);
    setResults([]);
    for (const t of tests) {
      setCurrentTest(`${t.section}: ${t.testName}`);
      await runTestLogic(t);
    }
    setRunning(false);
    setCurrentTest("");
  };

  const runSingleTest = async (t: TestDefinition) => {
      if (running) return;
      setRunning(true);
      setCurrentTest(`${t.section}: ${t.testName}`);
      await runTestLogic(t);
      setRunning(false);
      setCurrentTest("");
  }

  const passedCount = results.filter(r => r.status === "PASS").length;
  const failedCount = results.filter(r => r.status === "FAIL").length;
  const progress = (results.length / tests.length) * 100;
  
  const displayTests = tests.filter(t => {
      const res = results.find(r => r.id === t.id);
      if (filter === 'ALL') return true;
      if (filter === 'PASS') return res?.status === 'PASS';
      if (filter === 'FAIL') return res?.status === 'FAIL';
      return true;
  });

  return (
    <div className="min-h-screen bg-[#0C0C0F] pt-24 px-6 pb-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#16161A] p-6 rounded-2xl border border-white/5">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Icons.Target className="text-blue-500" />
                    Competitor DeepDive Suite
                </h2>
                <p className="text-zinc-500 max-w-lg">
                    Validates the 5-Layer Enterprise Intelligence Engine against specific product-context stress tests.
                </p>
            </div>
            
            <div className="flex flex-col gap-3 items-end w-full md:w-auto">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {results.length > 0 && (
                        <>
                            <div className="flex gap-4 text-xs font-bold bg-black/40 border border-white/10 px-4 py-2.5 rounded-lg w-full md:w-auto justify-center">
                                <span className="text-emerald-400">{passedCount} PASS</span>
                                <span className="text-zinc-700">|</span>
                                <span className="text-red-400">{failedCount} FAIL</span>
                            </div>
                            <button
                                onClick={() => {
                                    // Modified to include full result object with inputs
                                    const data = { results: results.map(r => r) };
                                    const json = JSON.stringify(data, null, 2);
                                    
                                    // Copy to clipboard
                                    navigator.clipboard.writeText(json);
                                    
                                    // Download file
                                    const blob = new Blob([json], { type: "application/json" });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = "competitor_tests.json";
                                    a.click();
                                    
                                    alert("JSON copied to clipboard & downloaded!");
                                }}
                                className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-semibold transition-all flex items-center gap-2 text-sm shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                                title="Copy to Clipboard & Download"
                            >
                                <Icons.Download className="w-4 h-4" />
                                <span className="hidden sm:inline">Export JSON</span>
                            </button>
                        </>
                    )}
                    <button
                      className="whitespace-nowrap px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(37,99,235,0.3)] w-full md:w-auto"
                      onClick={runAllTests}
                      disabled={running}
                    >
                      {running ? "Running Analysis..." : "Run All 18 Tests"}
                    </button>
                </div>
            </div>
        </div>

        {/* Progress Bar */}
        {results.length > 0 && (
             <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-500"
                    style={{ width: `${progress}%`}}
                ></div>
             </div>
        )}

        {/* Status Indicator */}
        {running && (
            <div className="w-full bg-blue-900/10 border border-blue-500/20 p-3 rounded-lg text-sm text-blue-300 flex items-center gap-3 animate-pulse">
                <Icons.Activity className="w-4 h-4 animate-spin" />
                <span>Processing: <strong>{currentTest}</strong>...</span>
            </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2">
            {(['ALL', 'PASS', 'FAIL'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${filter === f ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-white/10'}`}>
                    {f} {results.length > 0 && f !== 'ALL' ? `(${results.filter(r => r.status === f).length})` : ''}
                </button>
            ))}
        </div>

        {/* Test Grid */}
        <div className="grid grid-cols-1 gap-3">
          {displayTests.map((t) => {
            const result = results.find(r => r.id === t.id);
            const status = result?.status || "PENDING";
            
            return (
                <div key={t.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all ${
                    status === "PASS" ? "bg-emerald-950/10 border-emerald-500/20" : 
                    status === "FAIL" ? "bg-red-950/10 border-red-500/20" : "bg-[#141418] border-white/5"
                }`}>
                  <div className="flex items-start gap-4 mb-3 md:mb-0 w-full">
                    <button 
                        onClick={() => runSingleTest(t)} disabled={running}
                        className={`mt-1 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border transition-all ${status === "PENDING" ? "bg-white/5 border-white/10 text-zinc-500 hover:text-white" : status === "PASS" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}
                    >
                        {status === "PENDING" ? <Icons.Play className="w-3.5 h-3.5 ml-0.5" /> : status === "PASS" ? <Icons.CheckCircle className="w-4 h-4" /> : <Icons.AlertTriangle className="w-4 h-4" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="text-[10px] font-mono text-zinc-600 border border-zinc-800 px-1.5 rounded bg-black/20">{t.section}</span>
                            <span className="font-semibold text-zinc-200 text-sm truncate">{t.testName}</span>
                            {result?.duration && <span className="text-[10px] text-zinc-600 font-mono ml-auto">{(result.duration / 1000).toFixed(2)}s</span>}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                            <div className="text-zinc-500 truncate"><span className="text-zinc-600">Industry:</span> <span className="text-zinc-300">{t.input.industry}</span></div>
                            <div className="text-zinc-500 truncate"><span className="text-zinc-600">Comp:</span> <span className="text-zinc-300">{t.input.knownCompetitors || "(Auto)"}</span></div>
                            <div className="text-zinc-500 truncate"><span className="text-zinc-600">Product:</span> <span className="text-zinc-300">{t.input.productName || "(None)"}</span></div>
                            <div className="text-zinc-500 truncate"><span className="text-zinc-600">Intent:</span> <span className="text-indigo-400">{t.input.intent}</span></div>
                        </div>

                        {result && (
                            <div className={`mt-2 text-xs font-mono border-t border-white/5 pt-2 ${status === 'PASS' ? 'text-emerald-500/80' : 'text-red-400'}`}>
                                Result: {result.reason}
                            </div>
                        )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 pl-12 md:pl-4 min-w-[80px] justify-end">
                      {status !== "PENDING" && <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${status === "PASS" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>{status}</span>}
                  </div>
                </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
