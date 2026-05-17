
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

// --- LaunchMintAI Premium Types ---

export interface Competitor {
  name: string;
  weakness: string;
  url: string;
  market_fin: {
    funding: string;
    investors: string;
    management: string;
    share?: string;
    audience?: string
  };
  product_intel: {
    pricing: string;
    features: string;
    swot: string;
    ux_friction?: string
  };
  technical_infra: {
    stack: string;
    velocity: string;
    platform: string
  };
  sentiment: {
    complaints: string;
    trust_score: string;
    churn_drivers: string
  };
  marketing: {
    acquisition: string;
    seo_keywords: string;
    social_status: string
  };
  kill_strategy: string;
}

export interface ForensicMetadata {
  confidence_score: number;
  veracity_index: number;
  source_diversity: number;
  reasoning_trace: string[];
  bias_assessment: string;
}

export interface RealData {
  idea?: string;
  timestamp?: number;
  market: {
    size: string;
    current_tam?: string | null;
    forecast_tam?: string | null;
    current_year?: string;
    forecast_year?: string;
    growth: string | null;
    confidence: string;
    source_url: string;
    source_name: string;
    veracity_quote?: string;
    timing?: { label: string; rationale: string; };
    classified_industry?: string;
  };
  monetization?: { model: string; strategy: string; };
  competitors: Competitor[];
  forensics?: ForensicMetadata;
  dept_legal?: string[];
  dept_product?: string[];
  dept_marketing?: string[];
  dept_finance?: string[];
  god_mode?: {
    macro_verdict: string;
    swarm_summary: string;
    risk_score: string;
    pivot_warning?: string;
  };
  gen_ui?: { feature: string; desc: string; };
  pivot_suggestion?: { idea: string; potential: string; rationale: string; };
  citations?: { title: string; url: string; }[];
  idea_analysis?: string;
  // Evidence & credibility layer (additive — always optional)
  evidence?: {
    sources: EvidenceSource[];
    claims: EvidenceClaim[];
  };
  field_provenance?: Record<string, FieldProvenance>;
  credibility?: ReportCredibilityMeta;
  report_status?: "complete" | "partial_grounded" | "partial_inferred" | "failed_validation";
}

export interface PitchForgeData {
  tagline: string;
  elevator_pitch: string;
  tweet_thread_hook: string;
  cold_email_subject: string;
  value_proposition: string;
}

// DS Layer Interfaces
export interface SurvivalData {
  survival_probability: number;
  confidence_band: [number, number];
  risk_tier: string;
  top_risk_factors: string[];
  similar_winners: string[];
  similar_losers: string[];
  model_semantics?: string;
  provenance_level?: string;
  data_note?: string;
  feature_explanation?: {
    sector: string;
    is_b2b: boolean;
    has_ai_keyword: boolean;
    rule_applied: string;
    confidence_band_method: string;
    training_note: string;
  };
}

export interface FinancialsData {
  bear: { label: string; runway_months: number; };
  base: { label: string; runway_months: number; };
  bull: { label: string; runway_months: number; };
  breakeven_probability: number;
  ltv_cac_ratio: number;
  simulations_run: number;
}

interface SentimentCompetitor {
  name: string;
  pain_score: number;
  top_complaints: string[];
  kill_strategy: string;
}

export interface DSInsightsData {
  survival: SurvivalData;
  financials: FinancialsData;
  sentiment: { competitors: SentimentCompetitor[] };
  meta: { pipeline_latency_ms: number; };
}

export interface VCRoastData {
  kill_shot: string;
  brutal_feedback: string[];
  competitor_alert: string;
  investment_verdict: string;
  survival_chance: number;
}

// ── Evidence & Provenance (Validator credibility layer) ───────────────────────

export type ClaimStatus = "verified" | "estimated" | "inferred" | "unsupported";
export type CredibilityStatus = ClaimStatus;

export interface EvidenceSource {
  url: string;
  title: string;
  domain: string;
}

export interface EvidenceClaim {
  claim_id: string;
  claim_type: "current_tam" | "forecast_tam" | "cagr" | string;
  raw_text: string;
  normalized_value: number;
  unit: "USD_B" | "PCT" | string;
  year: number | null;
  quote: string;
  source_url: string;
  source_title: string;
  domain_tier: "tier1" | "tier2" | "tier3";
  status: ClaimStatus;
  confidence: number;
  extraction_method: "regex" | "derived" | "llm";
}

export interface FieldProvenance {
  status: ClaimStatus;
  source_url: string;
  source_quote: string;
  source_year: number | null;
  notes: string;
}

export interface ReportCredibilityMeta {
  verified_fields: string[];
  estimated_fields: string[];
  inferred_fields: string[];
  unsupported_fields: string[];
  grounded_fields: string[];
  conflicts_detected: string[];
  stale_sources: string[];
  generated_at: string;
  overall_score: number;
  claims_extracted: number;
}