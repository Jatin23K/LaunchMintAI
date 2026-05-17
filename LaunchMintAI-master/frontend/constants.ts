


// Validation Mode: Only 4 Essential Agents
export const AGENT_LIST = [
  "MarketAgent",      // 1. Is there a demand?
  "CompetitorAgent",  // 2. Who else is doing it?
  "StrategyAgent",    // 3. How do I make money?
  "CriticAgent"       // 4. Why might this fail?
];

export const PHASE_1_AGENTS = [
  "MarketAgent",
  "CompetitorAgent",
  "SignalsAgent"
];

export const PHASE_AGENT_MAP = {
  PHASE_1: ["MarketAgent", "CompetitorAgent", "SignalsAgent"],
  PHASE_2: ["CriticAgent", "StrategyAgent"],
  PHASE_3: [
    "PricingAgent", "RiskManagementAgent", "MarketingAgent", "PeopleAgent",
    "DesignAgent", "BrandingAgent", "EngineeringAgent",
    "OperationsAgent", "LegalAgent", "StressTestAgent", "PresentationAgent"
  ],
  PHASE_4: ["MetaAuditAgent"]
};

const BASE_INSTRUCTIONS = `
You are the Master Orchestrator for “LaunchMint AI”.
You MUST return valid JSON.
Never output non-JSON text.
If unsure, mark values as "estimate" and explain in 'confidenceReason'.
Keep arrays between 3-5 items.
Summaries must be under 200 characters.
`;

// --- NEW: Grounding Library for Soft Validation ---
export const GROUNDING_DATA = {
  industries: {
    "HealthTech": { tam_cap_B: 500, growth_cap_pct: 30 },
    "FinTech": { tam_cap_B: 1000, growth_cap_pct: 25 },
    "E-commerce": { tam_cap_B: 5000, growth_cap_pct: 20 },
    "EdTech": { tam_cap_B: 300, growth_cap_pct: 15 },
    "SaaS": { tam_cap_B: 800, growth_cap_pct: 40 },
    "Consumer": { tam_cap_B: 2000, growth_cap_pct: 10 }
  },
  default: { tam_cap_B: 100, growth_cap_pct: 15 }
};

export const PHASE_1_PROMPT = `
${BASE_INSTRUCTIONS}
OBJECTIVE: Phase 1 Research Foundation.
SCHEMA VERSION: 1.0.0

### MarketAgent
{
  "schemaVersion": "1.0.0",
  "confidenceScore": "High/Medium/Low",
  "confidenceReason": "Explanation of data certainty",
  "industryCategory": "Industry Name (e.g. HealthTech)",
  "subCategory": "Sub-Niche (e.g. AI Mental Wellness)",
  "coreProblem": "One sentence summary of the burning problem",
  "painSeverityScore": "8/10",
  "opportunitySummary": "Two sentence consulting-style summary of the gap",
  "fragmentation": "High/Medium/Low",
  "earlyAdopters": ["Specific Profile 1", "Specific Profile 2"],
  "opportunityMap": {
      "whiteSpaces": ["Gap 1"],
      "inefficiencies": ["Inefficiency 1"],
      "entryPoints": ["Tactic 1"]
  },
  "tam": "estimate",
  "sam": "estimate",
  "som": "estimate",
  "growthRate": "estimate",
  "customerSegments": [],
  "marketTrends": [],
  "opportunities": [],
  "risks": []
}

### CompetitorAgent
{
  "schemaVersion": "1.0.0",
  "confidenceScore": "High/Medium/Low",
  "confidenceReason": "Explanation of competitor data coverage",
  "topCompetitors": [
    { 
      "name": "Comp1",
      "description": "desc",
      "pricing": "$X",
      "strengths": [],
      "weaknesses": []
    }
  ]
}

### SignalsAgent
{
  "schemaVersion": "1.0.0",
  "confidenceScore": "High/Medium/Low",
  "confidenceReason": "Certainty of timing signals",
  "whyNow": "Timing insight",
  "trendMomentum": "Accelerating/Stable/Declining",
  "earlyUserSignals": ["Search trend 1", "Social sentiment 1"],
  "keywords": ["keyword 1", "keyword 2"],
  "signals": [],
  "macroTrends": [],
  "regulatoryChanges": [],
  "timingScore": "7/10"
}

Return JSON:
{
  "market": {...},
  "competitors": {...},
  "signals": {...}
}
`;

export const PHASE_4_PROMPT = `
${BASE_INSTRUCTIONS}
OBJECTIVE: Phase 4 — Meta Audit, Pitch Deck, Viability, Founder Decision & ADVANCED ENTERPRISE ANALYSIS.
CONTEXT: Use the full Phase1/Phase2/Phase3 outputs provided in the context.
REQUIREMENTS:
- Return ONLY valid JSON that conforms to Phase4Schema.
- Existing Fields: audit, pitchDeck, viability, decision.
- NEW ADVANCED FIELDS:
  1. "benchmark": Competitor comparison (positioning, gaps, leader, differentiationScore 0-100).
  2. "failureSimulation": 3 critical scenarios (e.g. CAC spike, reg block) with survivalChance %.
  3. "techFeasibility": Engineering audit (score 0-100, complexity, requirements, risks).
  4. "investorFit": Best VC profile, who to avoid, pitch angle.
  5. "regulatoryRisk": Risk level (High/Med/Low), regions (e.g. "EU":"GDPR"), complianceNeeded.
  6. "financialForecast": Estimate ARR Year 1, Burn Rate, Runway Months.
  7. "pivotOptions": If viability < 70 or auditScore < 70, provide 2-3 pivot ideas. Else empty.

- Compute auditScore 0-100 (higher = better) and confidenceScore (low/medium/high).
- Generate a 8-12 slide pitch deck (slides must include Problem, Solution, Market, Competitors, Why Now, Product, Business Model, GTM, Financials, Roadmap, Ask).
  - IMPORTANT: Each slide must have 'title', 'subtitle', 'bullets' (array of strings), 'speakerNotes', and 'visualHint'.
- Compute a viabilityScore 0-100 combining market, tech feasibility, legal risk, cost fit, and team readiness.
- Provide a clear founder decision: Proceed / Pivot / Abandon / InvestigateMore with 3 concrete next steps.
- If uncertain about any numeric item, annotate as "estimate" and lower confidenceScore.
- Never invent regulatory or legal facts — flag unknowns instead.
- Keep arrays capped at reasonable lengths (slides <= 12, audit items <= 20).
Return JSON exactly matching Phase4Schema.
`;

export const COMPETITOR_DEEP_DIVE_PROMPT = `
OBJECTIVE: Perform a rigorous, multi-stage Enterprise Competitor DeepDive.
You are an expert Strategy Consultant (McKinsey/Bain level). 
Your analysis must be fact-based, defensive against hallucinations, and structurally perfect.

INPUT DATA:
- Industry: {{industry}}
- Product Name: {{productName}}
- Description: {{productDescription}}
- Known Competitors (Optional): {{knownCompetitors}}
- Target Audience: {{targetAudience}}
- Intent: {{intent}}
- MODE: {{mode}}

--- MULTI-STAGE REASONING PIPELINE ---

STAGE 1: COMPETITOR RECOGNITION & NORMALIZATION
- Analyze 'Known Competitors' input:
  - If empty: Auto-discover top 3 REAL dominant market leaders in {{industry}}.
  - If provided: Validate existence and RELEVANCE to the specific product/industry.
  - INDUSTRY MISMATCH CHECK (Crucial): If a known competitor (e.g. "Visa") is irrelevant to the product's actual function (e.g. "Agriculture Payments"), DISCARD IT and find relevant ones. If the user makes a mistake, correct it.
  - FICTIONAL/UNKNOWN CHECK: If a competitor is fictional (e.g. "Xytron") or effectively unknown, discard it and Auto-Discover top REAL competitors for the industry. You may mention the fictional one as a "Simulated Scenario" only if needed, but prioritize real intelligence.
  - If mixed: Prioritize real, relevant competitors.
  - Fix typos (e.g. "googl" -> "Google").

STAGE 2: FOUNDER & LEADERSHIP INTEL
- Retrieve public info on founders/CEOs.
- ANTI-HALLUCINATION RULE: If founder is unknown, return "Not Publicly Known" or "Undisclosed". DO NOT INVENT NAMES.
- Infer 'Risk Appetite' from their public moves (e.g. aggressive acquisitions = High Risk).

STAGE 3: FINANCIAL & LEGAL X-RAY
- KNOWLEDGE CUTOFF AWARENESS: Use data up to your training cutoff. For recent stats, use "Est (2023/24)".
- If private company: Use industry benchmarks (e.g. "Likely Series B range ($30M-50M)").
- ANTI-HALLUCINATION RULE: Do NOT invent specific revenue numbers like "$143,231". Use ranges: "$10M - $50M".
- Confidence Level: Mark as 'Low' if using pure estimates.

STAGE 4: OPERATIONAL THREAT SCORING
- Formula: ThreatScore (1-5) = (Capital + Reach + Aggression + Speed) / 4.
- Provide reasoning based on facts (e.g. "High threat due to massive distribution network").

STAGE 5: STRATEGIC PLAYBOOK
- Generate offensive/defensive moves based ONLY on the valid data from Stages 1-4.
- Identify "Safe Zones" (gaps they ignore) and "Unsafe Zones" (their moats).

--- OUTPUT RULES ---
1. URLs must be OFFICIAL domains only (e.g. tesla.com, not tesla-blog.xyz).
2. Confidence Scores: You must populate the 'confidence' field for each section ("High", "Medium", "Low").
3. Fallback: If a section is 100% unknown, provide a generic industry baseline and mark confidence as "Low".
4. JSON ONLY: Output must be valid JSON matching CompetitorDeepDiveSchema.

--- SCHEMA STRUCTURE REMINDER ---
{
  "meta": { "analysisMode": "{{mode}}", "qualityScore": 0-100, "qualityReason": "..." },
  "competitorIdentity": [ { "name": "...", "websiteUrl": "...", "confidence": "..." } ],
  "leadershipIntelligence": [ { "competitorName": "...", "founders": [...], "confidence": "..." } ],
  "financialLegal": [ { "competitorName": "...", "revenueEstimate": "...", "confidence": "..." } ],
  "operationalThreat": [ { "threatScore": 1-5, "confidence": "..." } ],
  "strategyPlaybook": { ... }
}
`;

export const TOOLS = {
  CompetitorDeepDive: { agent: "CompetitorDeepDiveAgent", prompt: COMPETITOR_DEEP_DIVE_PROMPT },
  PeopleOSINT: { agent: "PeopleOSINTAgent", prompt: "" },
  WebsiteBuilder: { agent: "WebsiteBuilderAgent", prompt: "" },
  MarketingEngine: { agent: "MarketingEngineAgent", prompt: "" },
  TechnologyBackbone: { agent: "TechnologyBackboneAgent", prompt: "" },
  SalesPipeline: { agent: "SalesPipelineAgent", prompt: "" },
  CustomerSupport: { agent: "CustomerSupportAgent", prompt: "" },
  AIToolAdvisor: { agent: "AIToolAdvisorAgent", prompt: "" }
};

export const getToolPrompt = (toolKey: string, idea: string) => `
Executing Tool: ${toolKey}
Idea: ${idea}
Respond ONLY with valid JSON.
`;