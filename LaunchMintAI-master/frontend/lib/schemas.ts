
import { z } from "zod";

// --- SHARED SCHEMA ---
const MetaSchema = z.object({
  schemaVersion: z.string().default("1.0.0"),
  confidenceScore: z.enum(["High", "Medium", "Low"]).default("Medium"),
  confidenceReason: z.string().default("Pending validation")
});

// --- RESEARCH PHASE ---

export const MarketSchema = MetaSchema.extend({
  tam: z.string(),
  sam: z.string(),
  som: z.string(),
  growthRate: z.string(),
  industryCategory: z.string().default("General Tech"),
  subCategory: z.string().default("Unknown"),
  coreProblem: z.string().default("Unknown"),
  painSeverityScore: z.string().default("N/A"),
  opportunitySummary: z.string().default("Analysis pending"),
  fragmentation: z.string().default("Unknown"),
  earlyAdopters: z.array(z.string()).default([]),
  opportunityMap: z.object({
      whiteSpaces: z.array(z.string()).default([]),
      inefficiencies: z.array(z.string()).default([]),
      entryPoints: z.array(z.string()).default([])
  }).default({ whiteSpaces: [], inefficiencies: [], entryPoints: [] }),
  customerSegments: z.array(z.string()),
  marketTrends: z.array(z.string()),
  opportunities: z.array(z.string()),
  risks: z.array(z.string())
});
export const MARKET_FALLBACK = {
  schemaVersion: "1.0.0", confidenceScore: "Low" as const, confidenceReason: "Fallback triggered",
  tam: "Unknown", sam: "Unknown", som: "Unknown", growthRate: "Unknown",
  industryCategory: "Unknown", subCategory: "Unknown",
  coreProblem: "Unknown", painSeverityScore: "N/A", opportunitySummary: "Unknown",
  fragmentation: "Unknown", earlyAdopters: [],
  opportunityMap: { whiteSpaces: [], inefficiencies: [], entryPoints: [] },
  customerSegments: [], marketTrends: [], opportunities: [], risks: []
};

export const CompetitorSchema = MetaSchema.extend({
  topCompetitors: z.array(z.object({
    name: z.string(),
    description: z.string(),
    pricing: z.string(),
    strengths: z.array(z.string()).default([]),
    weaknesses: z.array(z.string()).default([]),
    moats: z.array(z.string()).default([]),
  }))
});
export const COMPETITOR_FALLBACK = { 
  schemaVersion: "1.0.0", confidenceScore: "Low" as const, confidenceReason: "Fallback triggered",
  topCompetitors: [] 
};

export const SignalsSchema = MetaSchema.extend({
  whyNow: z.string().default("Analysis pending"),
  trendMomentum: z.string().default("Unknown"),
  earlyUserSignals: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  signals: z.array(z.string()),
  macroTrends: z.array(z.string()),
  regulatoryChanges: z.array(z.string()),
  timingScore: z.string()
});
export const SIGNALS_FALLBACK = { 
    schemaVersion: "1.0.0", confidenceScore: "Low" as const, confidenceReason: "Fallback triggered",
    whyNow: "Unknown", trendMomentum: "Unknown", earlyUserSignals: [], keywords: [], 
    signals: [], macroTrends: [], regulatoryChanges: [], timingScore: "N/A" 
};

// --- STRATEGY PHASE ---

export const CriticSchema = MetaSchema.extend({
  flaws: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  pivotNeeded: z.boolean().default(false),
  pivotExplanation: z.string().default("No pivot explanation provided."),
  refinedIdea: z.string().default("Original Idea")
});
export const CRITIC_FALLBACK = { 
    schemaVersion: "1.0.0", confidenceScore: "Low" as const, confidenceReason: "Fallback",
    flaws: [], risks: [], pivotNeeded: false, pivotExplanation: "Analysis failed", refinedIdea: "Original Idea" 
};

export const StrategySchema = MetaSchema.extend({
  valueProposition: z.string().nullable().default("N/A"),
  revenueModels: z.array(z.object({
    name: z.string(),
    details: z.string().nullable()
  })).default([]),
  pricingStrategy: z.string().nullable().default("N/A"),
  kpis: z.object({
    cac: z.string().nullable().default("N/A"),
    ltv: z.string().nullable().default("N/A"),
    paybackPeriod: z.string().nullable().default("N/A")
  }).default({ cac: "N/A", ltv: "N/A", paybackPeriod: "N/A" }),
  mvp_features: z.array(z.string()).default([]),
  roadmap90: z.array(z.string()).default([]),
  hiringPlan: z.array(z.object({ 
      role: z.string(), 
      months: z.string().nullable() 
  })).default([]),
  estimatedCosts: z.record(z.string(), z.number()).default({}),

  userPersonas: z.array(z.object({
      segment: z.string(),
      needs: z.array(z.string()),
      willingnessToPay: z.enum(["High", "Medium", "Low"]).default("Medium")
  })).default([]),
  goToMarket: z.object({
      channels: z.array(z.string()).default([]),
      launchPlan: z.array(z.string()).default([])
  }).default({ channels: [], launchPlan: [] }),
  moats: z.object({
      technical: z.string().default("None"),
      data: z.string().default("None"),
      networkEffect: z.string().default("None"),
      switchingCost: z.string().default("None")
  }).default({ technical: "None", data: "None", networkEffect: "None", switchingCost: "None" }),
  businessModelCanvas: z.object({
      keyPartners: z.array(z.string()).default([]),
      keyResources: z.array(z.string()).default([]),
      costStructure: z.array(z.string()).default([])
  }).default({ keyPartners: [], keyResources: [], costStructure: [] }),
  sensitivityAnalysis: z.object({
      scenarios: z.array(z.object({
          condition: z.string(),
          impact: z.string()
      })).default([])
  }).default({ scenarios: [] }),
  successProbability: z.number().min(0).max(100).default(50),
  successProbabilityReason: z.string().default("Pending analysis"),
  first10UsersPlan: z.array(z.string()).default([])
});

export const STRATEGY_FALLBACK = {
  schemaVersion: "1.0.0", confidenceScore: "Low" as const, confidenceReason: "Fallback",
  valueProposition: "Analysis Unavailable",
  revenueModels: [], pricingStrategy: "N/A", kpis: { cac: "N/A", ltv: "N/A", paybackPeriod: "N/A" },
  mvp_features: [], roadmap90: [], hiringPlan: [], estimatedCosts: {},
  userPersonas: [], goToMarket: { channels: [], launchPlan: [] },
  moats: { technical: "N/A", data: "N/A", networkEffect: "N/A", switchingCost: "N/A" },
  businessModelCanvas: { keyPartners: [], keyResources: [], costStructure: [] },
  sensitivityAnalysis: { scenarios: [] },
  successProbability: 50, successProbabilityReason: "Fallback", first10UsersPlan: []
};

// --- PHASE 3: EXECUTION DESIGN ---

export const PricingSchema = MetaSchema.extend({
  strategyType: z.string(),
  pricePoint: z.string().optional(),
  reasoning: z.string(),
  tiers: z.array(z.object({
    name: z.string(),
    price: z.string(),
    features: z.array(z.string())
  })),
  psychologicalTactics: z.array(z.string())
});
export const PRICING_FALLBACK = { schemaVersion: "1.0.0", confidenceScore: "Low" as const, confidenceReason: "Fallback", strategyType: "N/A", pricePoint: "N/A", reasoning: "N/A", tiers: [], psychologicalTactics: [] };

export const RiskManagementSchema = MetaSchema.extend({
  marketRisks: z.array(z.object({ risk: z.string(), mitigation: z.string() })),
  operationalRisks: z.array(z.object({ risk: z.string(), mitigation: z.string() })),
  financialRisks: z.array(z.object({ risk: z.string(), mitigation: z.string() }))
});
export const RISK_FALLBACK = { schemaVersion: "1.0.0", confidenceScore: "Low" as const, confidenceReason: "Fallback", marketRisks: [], operationalRisks: [], financialRisks: [] };

export const MarketingSchema = MetaSchema.extend({
  targetAudience: z.array(z.string()),
  bestPlatforms: z.array(z.string()),
  marketingCopy: z.string(),
  influencerStrategy: z.string(),
  budgetPlan: z.string(),
  monthPlan: z.array(z.string())
});
export const MARKETING_FALLBACK = { 
  schemaVersion: "1.0.0", confidenceScore: "Low" as const, confidenceReason: "Fallback",
  targetAudience: [], 
  bestPlatforms: [], 
  marketingCopy: "N/A", 
  influencerStrategy: "N/A", 
  budgetPlan: "N/A", 
  monthPlan: [] 
};

export const PeopleSchema = MetaSchema.extend({
  founders: z.array(z.object({
    name: z.string(),
    role: z.string(),
    bioSummary: z.string(),
    strengths: z.array(z.string())
  })).default([]),
  userPersonas: z.array(z.object({
    type: z.string(),
    painPoints: z.array(z.string()),
    motivations: z.array(z.string())
  })).default([]),
  orgChart: z.array(z.object({
      role: z.string(),
      reportsTo: z.string()
  })).default([]),
  hiringPlan: z.array(z.object({
      role: z.string(),
      months: z.string().nullable(),
      salaryEstimate: z.string().default("N/A")
  })).default([])
});
export const PEOPLE_FALLBACK = { schemaVersion: "1.0.0", confidenceScore: "Low" as const, confidenceReason: "Fallback", founders: [], userPersonas: [], orgChart: [], hiringPlan: [] };

export const DesignSchema = MetaSchema.extend({
  screens: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      layout: z.string()
  })).default([]),
  userFlows: z.array(z.string()).default([]),
  accessibilityNotes: z.array(z.string()).default([])
});
export const DESIGN_FALLBACK = { schemaVersion: "1.0.0", confidenceScore: "Low" as const, confidenceReason: "Fallback", screens: [], userFlows: [], accessibilityNotes: [] };

export const BrandingSchema = MetaSchema.extend({
  nameIdeas: z.array(z.string()).default([]),
  taglines: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  fonts: z.array(z.string()).default([]),
  brandArchetype: z.string().default("Unknown")
});
export const BRANDING_FALLBACK = { schemaVersion: "1.0.0", confidenceScore: "Low" as const, confidenceReason: "Fallback", nameIdeas: [], taglines: [], colors: [], fonts: [], brandArchetype: "N/A" };

export const EngineeringSchema = MetaSchema.extend({
  techStack: z.array(z.string()),
  folderStructure: z.array(z.string()),
  sampleComponents: z.array(z.string()),
  apiRoutes: z.array(z.string()),
  dbSchema: z.record(z.string(), z.array(z.string())).default({}),
  infraCostEstimate: z.string().default("N/A"),
  architectureDiagramDescription: z.string().default("N/A"),
  ciCdPlan: z.array(z.string()).default([])
});
export const ENGINEERING_FALLBACK = { schemaVersion: "1.0.0", confidenceScore: "Low" as const, confidenceReason: "Fallback", techStack: [], folderStructure: [], sampleComponents: [], apiRoutes: [], dbSchema: {}, infraCostEstimate: "N/A", architectureDiagramDescription: "N/A", ciCdPlan: [] };

export const CostEstimateSchema = z.object({
  month: z.string(),
  infraCost: z.number(),
  teamCost: z.number(),
  marketingCost: z.number(),
  total: z.number()
});

export const OperationsSchema = MetaSchema.extend({
  burnRate: z.string(),
  vendors: z.array(z.string()),
  techVendors: z.array(z.object({
      name: z.string(),
      purpose: z.string(),
      cost: z.string()
  })).default([]),
  runbookTitles: z.array(z.string()).default([]),
  costs: z.array(CostEstimateSchema).default([])
});
export const OPERATIONS_FALLBACK = { schemaVersion: "1.0.0", confidenceScore: "Low" as const, confidenceReason: "Fallback", burnRate: "N/A", vendors: [], techVendors: [], runbookTitles: [], costs: [] };

export const LegalSchema = MetaSchema.extend({
  complianceRisks: z.array(z.string()),
  ipWarnings: z.array(z.string()),
  dataRisks: z.array(z.string()),
  privacyChecklist: z.array(z.string()).default([])
});
export const LEGAL_FALLBACK = { schemaVersion: "1.0.0", confidenceScore: "Low" as const, confidenceReason: "Fallback", complianceRisks: [], ipWarnings: [], dataRisks: [], privacyChecklist: [] };

export const StressTestSchema = MetaSchema.extend({
  scenarios: z.array(z.object({
      name: z.string(),
      impact: z.string(),
      mitigation: z.string()
  })).default([]),
  survivalScore: z.string()
});
export const STRESSTEST_FALLBACK = { schemaVersion: "1.0.0", confidenceScore: "Low" as const, confidenceReason: "Fallback", scenarios: [], survivalScore: "N/A" };

export const PresentationSchema = MetaSchema.extend({
  slides: z.array(z.object({
    title: z.string(),
    content: z.string(),
    speakerNotes: z.string().default("")
  }))
});
export const PRESENTATION_FALLBACK = { schemaVersion: "1.0.0", confidenceScore: "Low" as const, confidenceReason: "Fallback", slides: [] };

// --- PHASE 4: META AUDIT & DECISION (ADVANCED) ---

export const AuditItemSchema = z.object({
  id: z.string(),
  section: z.string(),
  issue: z.string(),
  severity: z.enum(["low","medium","high"]).default("medium"),
  suggestion: z.string().optional()
});

export const AuditSectionSchema = MetaSchema.extend({
  inconsistencies: z.array(AuditItemSchema).default([]),
  fixes: z.array(z.string()).default([]),
  auditScore: z.number().min(0).max(100).default(50),
  executionChecks: z.array(z.object({
    name: z.string(),
    status: z.enum(['pass', 'fail', 'warning']),
    message: z.string()
  })).default([])
});
export const AUDIT_FALLBACK = {
  schemaVersion: "1.0.0",
  confidenceScore: "Low" as const,
  confidenceReason: "Fallback",
  inconsistencies: [],
  fixes: [],
  auditScore: 50,
  executionChecks: []
};

export const PitchSlideSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  content: z.string().optional(), // backward compatibility
  bullets: z.array(z.string()).default([]),
  speakerNotes: z.string().default(""),
  visualHint: z.string().optional()
});

export const PitchDeckSectionSchema = MetaSchema.extend({
  slides: z.array(PitchSlideSchema).min(6).default([]),
  valid: z.boolean().default(false),
  issues: z.array(z.string()).default([])
});

export const ViabilitySchema = z.object({
  viabilityScore: z.number().min(0).max(100).default(50),
  marketReadiness: z.enum(["Low","Medium","High"]).default("Medium"),
  executionDifficulty: z.enum(["Low","Medium","High"]).default("Medium"),
  fundraisingTier: z.enum(["Pre-Seed","Seed","Series A","Later"]).default("Pre-Seed"),
  recommendedNextStep: z.string().default("Run customer interviews")
});

export const FounderDecisionSchema = z.object({
  finalVerdict: z.enum(["Proceed","Pivot","Abandon","InvestigateMore"]).default("InvestigateMore"),
  biggestRisk: z.string().default("Unknown"),
  hiddenOpportunity: z.string().optional(),
  nextSteps: z.array(z.string()).default([])
});

// NEW ADVANCED SCHEMAS
export const CompetitorBenchmarkSchema = z.object({
  positioning: z.string().default("Unknown"),
  featureGaps: z.array(z.string()).default([]),
  riskZones: z.array(z.string()).default([]),
  leader: z.string().default("None"),
  differentiationScore: z.number().min(0).max(100).default(50)
});

export const FailureSimulationSchema = z.object({
  scenarios: z.array(z.object({
    name: z.string(),
    impact: z.enum(["Low", "Medium", "High"]).default("Medium"),
    survivalChance: z.string()
  })).default([]),
  resilienceScore: z.number().min(0).max(100).default(50)
});

export const TechFeasibilitySchema = z.object({
  score: z.number().min(0).max(100).default(50),
  complexityLevel: z.enum(["Low", "Medium", "High"]).default("Medium"),
  requirements: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  recommendedStack: z.array(z.string()).default([])
});

export const InvestorFitSchema = z.object({
  bestFor: z.string().default("Generalist Angels"),
  avoid: z.array(z.string()).default([]),
  pitchAngle: z.string().default("Growth"),
  fitScore: z.number().min(0).max(100).default(50)
});

export const RegulatoryRiskSchema = z.object({
  riskLevel: z.enum(["Low", "Medium", "High"]).default("Medium"),
  regions: z.record(z.string(), z.string()).default({}), 
  complianceNeeded: z.array(z.string()).default([])
});

export const FinancialForecastSchema = z.object({
  arrYear1: z.string().default("$0"),
  burnRate: z.string().default("$0/mo"),
  runwayMonths: z.number().default(0),
  growthLevers: z.array(z.string()).default([])
});

export const PivotOptionSchema = z.object({
  name: z.string(),
  reason: z.string(),
  newTargetAudience: z.string(),
  coreFeatureChange: z.string()
});

export const Phase4Schema = z.object({
  schemaVersion: z.string().default("4.0.0"),
  audit: AuditSectionSchema,
  pitchDeck: PitchDeckSectionSchema,
  viability: ViabilitySchema,
  decision: FounderDecisionSchema,
  
  benchmark: CompetitorBenchmarkSchema.optional(),
  failureSimulation: FailureSimulationSchema.optional(),
  techFeasibility: TechFeasibilitySchema.optional(),
  investorFit: InvestorFitSchema.optional(),
  regulatoryRisk: RegulatoryRiskSchema.optional(),
  financialForecast: FinancialForecastSchema.optional(),
  pivotOptions: z.array(PivotOptionSchema).optional().default([])
});

export const PHASE4_FALLBACK = {
    schemaVersion: "4.0.0",
    audit: { ...AUDIT_FALLBACK, inconsistencies: [] as any[] }, 
    pitchDeck: { ...PRESENTATION_FALLBACK, valid: false, issues: [] },
    viability: { viabilityScore: 50, marketReadiness: "Medium" as const, executionDifficulty: "Medium" as const, fundraisingTier: "Seed" as const, recommendedNextStep: "Manual Review" },
    decision: { finalVerdict: "InvestigateMore" as const, biggestRisk: "Analysis failed", nextSteps: [] },
    
    benchmark: { positioning: "N/A", featureGaps: [], riskZones: [], leader: "Unknown", differentiationScore: 50 },
    failureSimulation: { scenarios: [], resilienceScore: 50 },
    techFeasibility: { score: 50, complexityLevel: "Medium" as const, requirements: [], risks: [], recommendedStack: [] },
    investorFit: { bestFor: "N/A", avoid: [], pitchAngle: "N/A", fitScore: 50 },
    regulatoryRisk: { riskLevel: "Medium" as const, regions: {}, complianceNeeded: [] },
    financialForecast: { arrYear1: "N/A", burnRate: "N/A", runwayMonths: 0, growthLevers: [] },
    pivotOptions: []
};

// --- PHASE 5 STANDALONE TOOLS (ENHANCED V2) ---

export const CompetitorDeepDiveSchema = z.object({
  meta: z.object({
    analysisMode: z.enum(["Product-Defined", "Industry-Discovery"]).default("Industry-Discovery"),
    qualityScore: z.number().min(0).max(100).default(50),
    qualityReason: z.string().default("Standard analysis performed.")
  }),
  
  // 1. Identity & Public Footprint
  competitorIdentity: z.array(z.object({
    name: z.string(),
    websiteUrl: z.string().default("Unknown"),
    socialLinks: z.object({
      linkedin: z.string().optional(),
      twitter: z.string().optional(),
      instagram: z.string().optional(),
      youtube: z.string().optional()
    }).default({}),
    headquarters: z.string().default("Unknown"),
    foundingYear: z.string().default("Unknown"),
    industrySegment: z.string().default("General"),
    profile: z.string().default("No profile available"),
    reputation: z.string().default("Unknown"),
    confidence: z.enum(["High", "Medium", "Low"]).default("Medium"),
  })).default([]),

  // 2. Leadership & Management
  leadershipIntelligence: z.array(z.object({
    competitorName: z.string(),
    founders: z.array(z.object({
      name: z.string().default("Unknown"),
      background: z.string().default("Unknown"),
      strengths: z.array(z.string()).default([]),
      weaknesses: z.array(z.string()).default([]),
      riskAppetite: z.enum(["High", "Medium", "Low", "Unknown"]).default("Unknown")
    })).default([]),
    managementStyle: z.string().default("Unknown"),
    confidence: z.enum(["High", "Medium", "Low"]).default("Medium"),
  })).default([]),

  // 3. Financial & Legal
  financialLegal: z.array(z.object({
    competitorName: z.string(),
    funding: z.string().default("Unknown"),
    investors: z.array(z.string()).default([]),
    valuationEstimate: z.string().default("Unknown"),
    revenueEstimate: z.string().default("Unknown"),
    burnRateEstimate: z.string().default("Unknown"),
    legalRisks: z.array(z.string()).default([]),
    confidence: z.enum(["High", "Medium", "Low"]).default("Medium"),
  })).default([]),

  // 4. Operational Threat
  operationalThreat: z.array(z.object({
    competitorName: z.string(),
    operationalCapability: z.enum(["High", "Medium", "Low"]).default("Medium"),
    marketPower: z.enum(["High", "Medium", "Low"]).default("Medium"),
    weaknesses: z.array(z.string()).default([]),
    threatScore: z.number().min(1).max(5).default(3),
    threatReason: z.string().default("Analysis pending"),
    confidence: z.enum(["High", "Medium", "Low"]).default("Medium"),
  })).default([]),

  // 5. Strategy Playbook (Art of War)
  strategyPlaybook: z.object({
    vulnerabilitiesToExploit: z.array(z.string()).default([]),
    safeEntryZones: z.array(z.string()).default([]),
    unsafeZones: z.array(z.string()).default([]),
    predictedMoves: z.array(z.string()).default([]),
    offensiveStrategy: z.string().default("Analysis pending"),
    defensiveStrategy: z.string().default("Analysis pending"),
    communicationStrategy: z.string().default("Analysis pending")
  })
});

export const COMPETITOR_DEEPDIVE_FALLBACK = {
  meta: { analysisMode: "Industry-Discovery" as const, qualityScore: 50, qualityReason: "Fallback" },
  competitorIdentity: [],
  leadershipIntelligence: [],
  financialLegal: [],
  operationalThreat: [],
  strategyPlaybook: { 
      vulnerabilitiesToExploit: [], 
      safeEntryZones: [], 
      unsafeZones: [], 
      predictedMoves: [], 
      offensiveStrategy: "N/A", 
      defensiveStrategy: "N/A", 
      communicationStrategy: "N/A" 
  }
};