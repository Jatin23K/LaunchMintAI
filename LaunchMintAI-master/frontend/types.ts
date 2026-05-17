
export interface StartupReport {
  idea: string;
  pivotedIdea?: string;
  market?: MarketSection;
  competitors?: CompetitorSection;
  signals?: SignalsSection;
  people?: PeopleSection;
  critic?: CriticSection;
  strategy?: StrategySection;
  pricing?: PricingSection;
  riskManagement?: RiskManagementSection;
  design?: DesignSection;
  branding?: BrandingSection;
  engineering?: EngineeringSection;
  operations?: OperationsSection;
  legal?: LegalSection;
  stressTest?: StressTestSection;
  marketing?: MarketingSection;
  website?: WebsiteSection;
  technology?: TechnologySection;
  aiTools?: AIToolsSection;
  sales?: SalesPipelineSection;
  support?: CustomerSupportSection;
  pitchDeck?: PitchDeckSection;
  audit?: AuditSection;
  viability?: ViabilitySection;
  decision?: FounderDecision;
  meta?: Phase2Metadata;
  // Phase 4 Advanced Upgrade
  benchmark?: CompetitorBenchmark;
  failureSimulation?: FailureSimulation;
  techFeasibility?: TechFeasibility;
  investorFit?: InvestorFit;
  regulatoryRisk?: RegulatoryRisk;
  financialForecast?: FinancialForecast;
  pivotOptions?: PivotOption[];
}

interface BaseSection {
  schemaVersion?: string;
  confidenceScore?: 'High' | 'Medium' | 'Low';
  confidenceReason?: string;
  citations?: string[];
}

export interface MarketSection extends BaseSection {
  tam: string;
  sam: string;
  som: string;
  growthRate: string;
  industryCategory: string;
  subCategory: string;
  coreProblem: string;
  painSeverityScore: string;
  opportunitySummary: string;
  fragmentation: string;
  earlyAdopters: string[];
  opportunityMap: {
    whiteSpaces: string[];
    inefficiencies: string[];
    entryPoints: string[];
  };
  customerSegments: string[];
  marketTrends: string[];
  opportunities: string[];
  risks: string[];
  // New Fields for Timing Analysis
  timingScore: string; // 0-100
  marketReadiness: "Low" | "Medium" | "High";
  windowOfOpportunity: string;
}

export interface CompetitorSection extends BaseSection {
  topCompetitors: Array<{
    name: string;
    description: string;
    strengths: string[];
    weaknesses: string[];
    moats: string[];
    pricing: string;
  }>;
}

export interface SignalsSection extends BaseSection {
  whyNow: string;
  trendMomentum: string;
  earlyUserSignals: string[];
  keywords: string[];
  signals: string[];
  macroTrends: string[];
  regulatoryChanges: string[];
  // timingScore: string; // Moved to MarketSection
}

export interface PeopleSection extends BaseSection {
  founders: Array<{
    name: string;
    role: string;
    bioSummary: string;
    strengths: string[];
  }>;
  userPersonas: Array<{
    type: string;
    painPoints: string[];
    motivations: string[];
  }>;
  orgChart: Array<{ role: string; reportsTo: string }>;
  hiringPlan: Array<{ role: string; months?: string | null; salaryEstimate: string }>;
}

export interface CriticSection extends BaseSection {
  flaws: string[];
  risks: string[];
  pivotNeeded: boolean;
  pivotExplanation: string;
  refinedIdea: string;
}

export interface StrategySection extends BaseSection {
  valueProposition: string;
  revenueModels: Array<{ name: string; details?: string | null }>;
  pricingStrategy: string;
  kpis: {
    cac: string;
    ltv: string;
    paybackPeriod: string;
  };
  mvp_features: string[];
  roadmap90: string[];
  hiringPlan: Array<{ role: string; months?: string | null }>;
  estimatedCosts: Record<string, number>;
  userPersonas: Array<{
    segment: string;
    needs: string[];
    willingnessToPay: "High" | "Medium" | "Low";
  }>;
  goToMarket: {
    channels: string[];
    launchPlan: string[];
  };
  moats: {
    technical: string;
    data: string;
    networkEffect: string;
    switchingCost: string;
  };
  businessModelCanvas: {
    keyPartners: string[];
    keyResources: string[];
    costStructure: string[];
  };
  sensitivityAnalysis: {
    scenarios: Array<{ condition: string; impact: string }>;
  };
  successProbability: number;
  successProbabilityReason: string;
  first10UsersPlan: string[];
  // New Field for Logic Check
  churnAnalysis: string;
  // New Field for Critical Weakness Fix
  retentionStrategy: string;
}

export interface PricingSection extends BaseSection {
  strategyType: string;
  pricePoint?: string;
  reasoning: string;
  tiers: Array<{
    name: string;
    price: string;
    features: string[];
  }>;
  psychologicalTactics: string[];
}

export interface RiskManagementSection extends BaseSection {
  marketRisks: Array<{ risk: string; mitigation: string; mitigationPlan: string }>;
  operationalRisks: Array<{ risk: string; mitigation: string; mitigationPlan: string }>;
  financialRisks: Array<{ risk: string; mitigation: string; mitigationPlan: string }>;
}

export interface DesignSection extends BaseSection {
  screens: Array<{
    id: string;
    title: string;
    description: string;
    layout: string;
  }>;
  userFlows: string[];
  accessibilityNotes: string[];
}

export interface BrandingSection extends BaseSection {
  nameIdeas: string[];
  taglines: string[];
  colors: string[];
  fonts: string[];
  brandArchetype: string;
}

export interface EngineeringSection extends BaseSection {
  techStack: string[];
  folderStructure: string[];
  sampleComponents: string[];
  apiRoutes: string[];
  dbSchema: Record<string, string[]>;
  infraCostEstimate: string;
  architectureDiagramDescription: string;
  ciCdPlan: string[];
}

export interface CostEstimate {
  month: string;
  infraCost: number;
  teamCost: number;
  marketingCost: number;
  total: number;
}

export interface OperationsSection extends BaseSection {
  burnRate: string;
  vendors: string[];
  techVendors: Array<{ name: string, purpose: string, cost: string }>;
  runbookTitles: string[];
  costs: CostEstimate[];
}

export interface LegalSection extends BaseSection {
  complianceRisks: string[];
  ipWarnings: string[];
  dataRisks: string[];
  privacyChecklist: string[];
}

export interface StressTestSection extends BaseSection {
  scenarios: Array<{ name: string; impact: string; mitigation: string }>;
  survivalScore: string;
}

export interface MarketingSection extends BaseSection {
  targetAudience: string[];
  bestPlatforms: string[];
  marketingCopy: string;
  influencerStrategy: string;
  budgetPlan: string;
  monthPlan: string[];
}

export interface WebsiteSection extends BaseSection {
  domainSuggestions: string[];
  hostingSuggestions: string[];
  structure: string[];
  seoKeywords: string[];
}

export interface TechnologySection extends BaseSection {
  backendOptions: string[];
  databaseOptions: string[];
  deploymentPlan: string[];
}

export interface AIToolsSection {
  category: string;
  recommendedTools: Array<{
    name: string;
    freeOrPaid: string;
    pros: string[];
    cons: string[];
    alternatives: string[];
  }>;
}

export interface SalesPipelineSection {
  strategy: string;
  channels: string[];
  stages: string[];
  tools: string[];
}

export interface CustomerSupportSection {
  supportStrategy: string;
  channels: string[];
  automationTools: string[];
  keyMetrics: string[];
}

export interface PitchDeckSection extends BaseSection {
  slides: Array<{
    title: string;
    subtitle?: string;
    content?: string;
    bullets?: string[];
    speakerNotes: string;
    visualHint?: string;
  }>;
  valid?: boolean;
  issues?: string[];
}

export interface AuditCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

export interface AuditItem {
  id: string;
  section: string;
  issue: string;
  severity: "low" | "medium" | "high";
  suggestion?: string;
}

export interface AuditSection extends BaseSection {
  inconsistencies: AuditItem[];
  fixes: string[];
  auditScore: number;
  executionChecks: AuditCheck[];
}

export interface ViabilitySection {
  viabilityScore: number;
  marketReadiness: "Low" | "Medium" | "High";
  executionDifficulty: "Low" | "Medium" | "High";
  fundraisingTier: "Pre-Seed" | "Seed" | "Series A" | "Later";
  recommendedNextStep: string;
}

export interface FounderDecision {
  finalVerdict: "Proceed" | "Pivot" | "Abandon" | "InvestigateMore";
  biggestRisk: string;
  hiddenOpportunity?: string;
  nextSteps: string[];
}

// --- PHASE 4 ADVANCED TYPES ---

export interface CompetitorBenchmark {
  positioning: string;
  featureGaps: string[];
  riskZones: string[];
  leader: string;
  differentiationScore: number;
}

export interface FailureScenario {
  name: string;
  impact: "Low" | "Medium" | "High";
  survivalChance: string;
}

export interface FailureSimulation {
  scenarios: FailureScenario[];
  resilienceScore: number;
}

export interface TechFeasibility {
  score: number;
  complexityLevel: "Low" | "Medium" | "High";
  requirements: string[];
  risks: string[];
  recommendedStack: string[];
}

export interface InvestorFit {
  bestFor: string;
  avoid: string[];
  pitchAngle: string;
  fitScore: number;
}

export interface RegulatoryRisk {
  riskLevel: "Low" | "Medium" | "High";
  regions: Record<string, string>;
  complianceNeeded: string[];
}

export interface FinancialForecast {
  arrYear1: string;
  burnRate: string;
  runwayMonths: number;
  growthLevers: string[];
}

export interface PivotOption {
  name: string;
  reason: string;
  newTargetAudience: string;
  coreFeatureChange: string;
}

export interface Phase2Metadata {
  timestamp: string;
  runs: {
    strategyRuns: number;
    criticRuns: number;
  };
}

export interface AgentEvent {
  event: 'agent_start' | 'agent_complete' | 'data_update' | 'agent_error' | 'complete';
  agent?: string;
  section?: string;
  data?: any;
  error?: string;
  report?: StartupReport;
}

// --- PHASE 5 STANDALONE TOOLS (ENHANCED) ---

export interface CompetitorDeepDiveInput {
  industry: string;
  productName?: string;
  productDescription?: string;
  knownCompetitors?: string; // New: allow specific targeting
  targetAudience?: string;
  intent: string;
  mode?: "Product-Defined" | "Industry-Discovery";
}

export interface CompetitorDeepDiveResult {
  meta: {
    analysisMode: "Product-Defined" | "Industry-Discovery";
    qualityScore: number; // 0-100
    qualityReason: string;
  };

  // 1. Identity & Public Footprint
  competitorIdentity: Array<{
    name: string;
    websiteUrl: string;
    socialLinks: {
      linkedin?: string;
      twitter?: string;
      instagram?: string;
      youtube?: string;
    };
    headquarters: string;
    foundingYear: string;
    industrySegment: string;
    profile: string;
    reputation: string;
    confidence: "High" | "Medium" | "Low";
  }>;

  // 2. Leadership & Management
  leadershipIntelligence: Array<{
    competitorName: string;
    founders: Array<{
      name: string;
      background: string;
      strengths: string[];
      weaknesses: string[];
      riskAppetite: "High" | "Medium" | "Low" | "Unknown";
    }>;
    managementStyle: string;
    confidence: "High" | "Medium" | "Low";
  }>;

  // 3. Financial & Legal
  financialLegal: Array<{
    competitorName: string;
    funding: string;
    investors: string[];
    valuationEstimate: string;
    revenueEstimate: string;
    burnRateEstimate: string;
    legalRisks: string[];
    confidence: "High" | "Medium" | "Low";
  }>;

  // 4. Operational Threat
  operationalThreat: Array<{
    competitorName: string;
    operationalCapability: "High" | "Medium" | "Low";
    marketPower: "High" | "Medium" | "Low";
    weaknesses: string[];
    threatScore: number; // 1-5
    threatReason: string;
    confidence: "High" | "Medium" | "Low";
  }>;

  // 5. Strategy Playbook (Art of War)
  strategyPlaybook: {
    vulnerabilitiesToExploit: string[];
    safeEntryZones: string[];
    unsafeZones: string[];
    predictedMoves: string[];
    offensiveStrategy: string;
    defensiveStrategy: string;
    communicationStrategy: string;
  };
}