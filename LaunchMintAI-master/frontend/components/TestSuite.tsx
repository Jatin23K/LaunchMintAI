
import React, { useState } from "react";
import { runIdeaThroughSystem, validateAndRepairPhase3 } from "../services/geminiService";
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

export const TestSuite: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>("");
  const [filter, setFilter] = useState<'ALL' | 'PASS' | 'FAIL'>('ALL');

  const tests: TestDefinition[] = [
    // -------------------------
    // BATCH 1 — CORE STABILITY
    // -------------------------
    {
      id: 1,
      testName: "Basic Execution Output",
      input: "Dog walking app",
      check: (o: StartupReport) => !!(o.engineering && o.design && o.operations && o.legal),
      reason: "Phase 3 sections must be populated"
    },
    {
      id: 2,
      testName: "Messy Input Handling",
      input: "AI sleep tracker ### 😴",
      check: (o: StartupReport) => !!o.engineering,
      reason: "Must clean messy input and output structured JSON"
    },
    {
      id: 3,
      testName: "Sparse Input Test",
      input: "AI in schools",
      check: (o: StartupReport) => !!o.design,
      reason: "Should produce minimal valid design section"
    },
    {
      id: 4,
      testName: "Multi-Industry Handling",
      input: "AI for farmers + finance + mental health",
      check: (o: StartupReport) => !!o.engineering?.techStack,
      reason: "Engineering must infer dominant vertical"
    },
    {
      id: 5,
      testName: "Execution Consistency Test",
      input: "AI tutoring app",
      check: (o: StartupReport) =>
        (o.engineering?.apiRoutes?.length || 0) > 0 &&
        JSON.stringify(o.engineering?.dbSchema || {}).length > 10,
      reason: "MVP → API → DB mapping must exist"
    },

    // -------------------------
    // BATCH 2 — ENGINEERING
    // -------------------------
    {
      id: 6,
      testName: "Tech Stack Grounding",
      input: "Genomics + Wearables platform",
      check: (o: StartupReport) => Array.isArray(o.engineering?.techStack),
      reason: "Tech stack must be grounded"
    },
    {
      id: 7,
      testName: "API Mapping",
      input: "AI fitness coach",
      check: (o: StartupReport) => !!o.audit?.executionChecks?.find(c => c.name === "Feature -> API Mapping" && c.status !== 'fail'),
      reason: "Each feature must map to an API route"
    },
    {
      id: 8,
      testName: "DB Schema Validity",
      input: "Booking management system",
      check: (o: StartupReport) =>
        !!o.engineering?.dbSchema &&
        Object.keys(o.engineering?.dbSchema || {}).length > 0,
      reason: "DB schema must exist"
    },
    {
      id: 9,
      testName: "Folder Structure Check",
      input: "Marketplace SaaS",
      check: (o: StartupReport) => (o.engineering?.folderStructure?.length || 0) > 2,
      reason: "Must include clear folder structure"
    },
    {
      id: 10,
      testName: "CI/CD Plan Presence",
      input: "CRM system",
      check: (o: StartupReport) => (o.engineering?.ciCdPlan?.length || 0) > 0,
      reason: "CI/CD plan is required"
    },

    // -------------------------
    // BATCH 3 — COST ENGINE & OPS
    // -------------------------
    {
      id: 11,
      testName: "Budget Cap Enforcement",
      input: "Budget-constrained SaaS CRM",
      check: (o: StartupReport) => (o.operations?.costs || []).every((c: any) => c.total <= 50000), // Using hardcoded cap from geminiService
      reason: "Costs must not exceed budget cap"
    },
    {
      id: 12,
      testName: "Infra Cost Normalization",
      input: "AI video analytics pipeline",
      check: (o: StartupReport) => o.audit?.fixes?.some(f => f.includes("Scaled down")) || false,
      reason: "Must normalize unrealistic infra cost"
    },
    {
      id: 13,
      testName: "Hiring Plan Cost Check",
      input: "Enterprise workflow tool",
      check: (o: StartupReport) => !!o.people?.hiringPlan,
      reason: "Hiring plan cost must be included"
    },
    {
      id: 14,
      testName: "Vendor Selection",
      input: "FinTech onboarding AI",
      check: (o: StartupReport) => (o.operations?.vendors || []).length > 0,
      reason: "Ops must select correct vendors"
    },
    {
      id: 15,
      testName: "Runbook Generation",
      input: "Chatbot support system",
      check: (o: StartupReport) => (o.operations?.runbookTitles || []).length >= 2,
      reason: "Ops must include incident runbooks"
    },

    // -------------------------
    // BATCH 4 — DESIGN & BRANDING
    // -------------------------
    {
      id: 16,
      testName: "Wireframe Generation",
      input: "E-commerce site",
      check: (o: StartupReport) => (o.design?.screens || []).length >= 3,
      reason: "At least 3 wireframes must exist"
    },
    {
      id: 17,
      testName: "User Flows",
      input: "Food delivery app",
      check: (o: StartupReport) => (o.design?.userFlows || []).length > 0,
      reason: "Must output user flows"
    },
    {
      id: 18,
      testName: "Component Inventory",
      input: "Productivity tool",
      check: (o: StartupReport) => (o.engineering?.sampleComponents || []).length > 0,
      reason: "Design must include component list"
    },
    {
      id: 19,
      testName: "Accessibility Notes",
      input: "Meditation mobile app",
      check: (o: StartupReport) => (o.design?.accessibilityNotes || []).length > 0,
      reason: "Design must include accessibility"
    },
    {
      id: 20,
      testName: "Brand Consistency",
      input: "Social creator network",
      check: (o: StartupReport) => !!o.branding?.colors,
      reason: "Brand identity must exist"
    },

    // -------------------------
    // BATCH 5 — LEGAL, STRESS, DECK, AUDIT
    // -------------------------
    {
      id: 21,
      testName: "Legal Compliance",
      input: "Health records AI system",
      check: (o: StartupReport) => (o.legal?.complianceRisks || []).length > 0,
      reason: "Must output compliance rules"
    },
    {
      id: 22,
      testName: "Data Privacy Detection",
      input: "Identity verification app",
      check: (o: StartupReport) => !!o.audit?.executionChecks?.find(c => c.name === "GDPR/Privacy Compliance" && c.status !== 'fail'),
      reason: "Must detect PII in DB schema"
    },
    {
      id: 23,
      testName: "Stress Test Scenarios",
      input: "Messaging app",
      check: (o: StartupReport) => (o.stressTest?.scenarios || []).length >= 3,
      reason: "Must output at least 3 scenarios"
    },
    {
      id: 24,
      testName: "Pitch Deck Completeness",
      input: "Creator monetization platform",
      check: (o: StartupReport) => (o.pitchDeck?.slides || []).length >= 5, // Gemini often does 5-10
      reason: "Deck must contain full slide set"
    },
    {
      id: 25,
      testName: "Audit Score Test",
      input: "Payment automation SaaS",
      check: (o: StartupReport) => typeof o.audit?.auditScore === "number",
      reason: "Audit engine must output auditScore"
    }
  ];

  const runTestLogic = async (t: TestDefinition) => {
    try {
        const raw = await runIdeaThroughSystem(t.input);
        const validated = validateAndRepairPhase3(raw);
        
        // CRITICAL FIX: Ensure the raw report has the audit data attached
        // before passing it to the check function.
        if (raw) {
            raw.audit = validated;
        }

        const ok = t.check(raw);

        setResults(prev => {
            const filtered = prev.filter(p => p.id !== t.id);
            const newResult: TestResult = {
                id: t.id,
                testName: t.testName,
                input: t.input,
                status: ok ? "PASS" : "FAIL",
                reason: ok ? "As expected" : t.reason
            };
            return [...filtered, newResult].sort((a,b) => a.id - b.id);
        });
    } catch (err: any) {
        setResults(prev => {
             const filtered = prev.filter(p => p.id !== t.id);
             const newResult: TestResult = {
                id: t.id,
                testName: t.testName,
                input: t.input,
                status: "FAIL",
                reason: "Execution error: " + err.message
            };
             return [...filtered, newResult].sort((a,b) => a.id - b.id);
        });
    }
  };

  const runAllTests = async () => {
    setRunning(true);
    setResults([]); // Clear previous results
    
    // We'll run them sequentially to avoid hitting rate limits
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

  const filteredTests = tests.filter(t => {
      const result = results.find(r => r.id === t.id);
      if (filter === 'ALL') return true;
      if (filter === 'PASS') return result?.status === 'PASS';
      if (filter === 'FAIL') return result?.status === 'FAIL';
      return true;
  });

  return (
    <div className="min-h-screen bg-[#0C0C0F] pt-24 px-6 pb-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#16161A] p-6 rounded-2xl border border-white/5">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Icons.zap className="text-indigo-500" />
                    Phase 3 Validation Suite
                </h2>
                <p className="text-zinc-500 max-w-lg">
                    Execution Design Logic Tests. Run the full suite to validate all 25 integration scenarios, or run individual tests to debug specific logic.
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
                      className="whitespace-nowrap px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(79,70,229,0.3)] w-full md:w-auto"
                      onClick={runAllTests}
                      disabled={running}
                    >
                      {running ? "Running Suite..." : "Run All Tests"}
                    </button>
                </div>
            </div>
        </div>

        {/* Progress Bar */}
        {results.length > 0 && (
             <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${progress}%`}}
                ></div>
             </div>
        )}

        {/* Running Indicator */}
        {running && (
            <div className="w-full bg-indigo-900/10 border border-indigo-500/20 p-3 rounded-lg text-sm text-indigo-300 flex items-center gap-3 animate-pulse">
                <Icons.Activity className="w-4 h-4 animate-spin" />
                <span>Running: <strong>{currentTest}</strong>... (This may take ~60s per test)</span>
            </div>
        )}

        {/* Filters */}
        <div className="flex gap-2">
            {(['ALL', 'PASS', 'FAIL'] as const).map(f => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        filter === f 
                        ? 'bg-white text-black border-white' 
                        : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/30'
                    }`}
                >
                    {f} {results.length > 0 && f !== 'ALL' ? `(${results.filter(r => r.status === f).length})` : ''}
                </button>
            ))}
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 gap-3">
          {filteredTests.map((t) => {
            const result = results.find(r => r.id === t.id);
            const status = result?.status || "PENDING";
            
            return (
                <div key={t.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all ${
                    status === "PASS" 
                    ? "bg-emerald-950/10 border-emerald-500/20" 
                    : status === "FAIL"
                    ? "bg-red-950/10 border-red-500/20"
                    : "bg-[#141418] border-white/5 hover:border-white/10"
                }`}>
                  <div className="flex items-start gap-4 mb-3 md:mb-0">
                    <button 
                        onClick={() => runSingleTest(t)}
                        disabled={running}
                        className={`mt-0.5 w-8 h-8 flex items-center justify-center rounded-full border transition-all ${
                            status === "PENDING" 
                            ? "bg-white/5 border-white/10 text-zinc-500 hover:text-white hover:bg-white/10 hover:border-white/30" 
                            : status === "PASS"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-red-500/10 border-red-500/30 text-red-400"
                        }`}
                        title="Run this test individually"
                    >
                        {status === "PENDING" ? <Icons.Play className="w-3.5 h-3.5 ml-0.5" /> : 
                         status === "PASS" ? <Icons.CheckCircle className="w-4 h-4" /> : 
                         <Icons.AlertTriangle className="w-4 h-4" />}
                    </button>

                    <div>
                        <div className="font-semibold text-zinc-200 flex items-center gap-2 text-sm">
                          <span className="text-zinc-600 font-mono text-xs w-6 opacity-50">#{t.id}</span> 
                          {t.testName}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1 flex flex-col sm:flex-row gap-1 sm:gap-4">
                            <span className="text-zinc-600">Input: <span className="text-zinc-400 italic">"{t.input}"</span></span>
                            {result && (
                                <span className={`${status === 'PASS' ? 'text-emerald-500/80' : 'text-red-400'}`}>
                                    Result: {result.reason}
                                </span>
                            )}
                        </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pl-12 md:pl-0">
                      {status === "PENDING" && (
                          <span className="text-[10px] font-bold text-zinc-700 bg-zinc-900 px-2 py-1 rounded">PENDING</span>
                      )}
                      {status !== "PENDING" && (
                          <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                              status === "PASS" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                          }`}>
                              {status}
                          </span>
                      )}
                  </div>
                </div>
            );
          })}
          
          {filteredTests.length === 0 && (
               <div className="text-center py-12 text-zinc-600 italic border border-dashed border-white/5 rounded-xl">
                  No tests found matching filter '{filter}'.
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
