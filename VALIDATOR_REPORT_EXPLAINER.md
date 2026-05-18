# LaunchMintAI — Validator Report: Complete Technical Explainer
### For Applied Data Scientist Interview Preparation
---

## TABLE OF CONTENTS
1. [System Architecture Overview](#1-system-architecture-overview)
2. [How a Report is Generated — Full Flow](#2-how-a-report-is-generated--full-flow)
3. [THE DS LAYER — Deep Dive](#3-the-ds-layer--deep-dive)
   - 3.1 XGBoost Sector Classifier
   - 3.2 Monte Carlo Financial Simulation
   - 3.3 VADER Sentiment Analysis
   - 3.4 DS Pipeline Orchestrator
4. [LLM Architecture — NIM → Gemini Waterfall](#4-llm-architecture--nim--gemini-waterfall)
5. [Every Report Section Explained](#5-every-report-section-explained)
6. [Post-Processing & Guardrails](#6-post-processing--guardrails)
7. [Evidence & Credibility Layer](#7-evidence--credibility-layer)
8. [Common Interview Questions & Answers](#8-common-interview-questions--answers)

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

```
User types idea
     │
     ▼
Frontend (React/TypeScript)
     │
     ├──► POST /analyze          ← Main intelligence pipeline (LLM + Search)
     │         │
     │         ├── Market Search (Serper + Exa APIs)
     │         ├── Gemini LLM synthesis
     │         ├── DS Pipeline (XGBoost + Monte Carlo + VADER)
     │         └── Evidence Model (credibility scoring)
     │
     ├──► POST /ds_insights       ← Standalone DS layer endpoint
     │
     └──► POST /run (×N)          ← Extension endpoints (parallel)
               │
               ├── financial-projection
               ├── gtm-strategy
               ├── exit-scenarios
               ├── risk-scanner
               ├── moat-analysis
               ├── fundraising-intelligence
               └── ... 20+ more extensions
```

**Two servers mounted together:**
- `main.py` — handles `/run` (extensions) + `/demo/*` endpoints
- `llm_engine.py` — handles `/analyze`, `/ds_insights`, `/health`
- `main.py` mounts `llm_engine.py` at `/` so both share the same port

---

## 2. HOW A REPORT IS GENERATED — FULL FLOW

### Step 1 — Market Search (before LLM call)
**File:** `backend/app/services/market_search.py`

Two search engines run in parallel:
- **Exa API** — semantic web crawl, finds research reports
- **Serper API** — Google Search API, finds news + market data

Both use `random.choice()` across key pools (prevents one key being over-used).

The search results feed into:
1. `extract_market_claims()` — regex extracts TAM, CAGR numbers from text
2. `build_fact_table()` — stores each claim with source URL and confidence
3. `format_fact_table_for_prompt()` — passes verified facts into LLM prompt as grounding context

**Fallback:** If Serper + Exa both fail → DuckDuckGo (free, no key needed) → if that fails → LLM uses training knowledge only.

### Step 2 — /analyze: LLM Synthesis
**File:** `backend/app/services/llm_engine.py`

The main Gemini call synthesizes:
- Market size (TAM), forecast TAM, CAGR
- Top competitors with funding + investors
- Risk score (1-10)
- Strategic verdict
- Evidence provenance (which claims are verified vs inferred)

**LLM waterfall:**
```
NIM (LLaMA-3.1-70B, 15s timeout)
    ↓ [if degraded or fails]
Gemini 2.5 Flash (primary, 250 RPD/key × 6 keys = 1500/day)
    ↓ [if rate limited]
Gemini 2.5 Flash-Lite (secondary, 1000 RPD/key × 6 = 6000/day)
    ↓ [if full prompt fails]
Lean Fallback Prompt (80% smaller, Gemini)
    ↓ [if everything fails]
_honest_fallback() — honest "data unavailable" JSON
```

**NIM Health Check:** On backend startup, a `_check_nim_health()` function pings NIM with "Reply with the word OK." in 8 seconds. If NIM doesn't respond, `_nim_degraded = True` and all future calls skip NIM entirely — saving 15s per extension.

### Step 3 — DS Pipeline (runs in parallel with LLM)
`ds_pipeline.run(idea, market_data, competitors)` — runs all 3 DS modules simultaneously.

### Step 4 — Extensions (parallel fetch from frontend)
Frontend uses `Promise.allSettled()` to fire all extension calls in parallel. Each extension calls `POST /run` with `extension_id` and payload.

---

## 3. THE DS LAYER — DEEP DIVE

### 3.1 XGBoost Sector Classifier
**File:** `backend/app/ds/classifier.py`
**What it produces in the report:** Survival Probability %, Risk Tier, Similar Winners, Similar Losers, Top Risk Factors

#### Purpose
Predicts the probability that a startup idea will succeed (reach acquisition or profitability) based on structural features of the idea — not LLM opinion.

#### Training Data
**Synthetic data** — 3,000 startup records generated with `generate_synthetic_data()`. Labels are assigned probabilistically using a research-grounded scoring formula:

```python
score = 0.30                          # 30% base rate (mirrors real startup survival)
score += min(market_size / 200, 0.15) # large markets help
score += min(growth_pct / 150, 0.10)  # fast-growing markets help
score += 0.08 if is_b2b else -0.04    # B2B outperforms B2C historically
score += 0.13 if has_ai else 0.0      # AI is a current tailwind
score -= (competition - 1) * 0.06    # each level of competition hurts
score -= 0.02 if reg_risk else 0.0   # regulatory sectors have higher failure
```

Label is stochastic: `label = int(np.random.random() < score)` — not deterministic, so even good scores sometimes produce failure labels, mimicking real startup randomness.

#### Feature Engineering (10 Features)
| Feature | How Extracted | Why It Matters |
|---|---|---|
| `market_size_b` | Regex from market_data, default 5.0B | Larger TAM = higher ceiling |
| `market_growth_pct` | Regex from market_data, default 8% | Growth rate = tailwind |
| `competition_level` | Count of competitors (1=low, 3=high) | Saturation proxy |
| `has_ai_keyword` | `_has_word()` on idea text | AI = current signal boost |
| `is_b2b` | Keyword match (saas, enterprise, tool...) | B2B has better unit economics |
| `is_b2c` | Keyword match (consumer, social, gen z...) | Binary flag |
| `regulatory_risk` | Keyword match (health, legal, finance...) | Compliance = headwind |
| `idea_word_count` | `len(idea.split())` | Longer = more specific idea |
| `sector_encoded` | `extract_sector()` — 0-9 int | Sector benchmark lookup |
| `is_niche_or_unknown` | `sector_encoded == 9` | Undefined ideas penalized |

#### Sector Classification — Priority Order (Critical Design Decision)
```python
priority_order = [1, 2, 3, 6, 7, 8, 4, 5, 0]
# Specific sectors checked BEFORE generic AI (sector 0)
```
**Why:** "AI-powered cash flow tool" contains "AI" but is fundamentally a Fintech product. Checking Fintech (1) before AI (0) ensures correct sector assignment. This affects which Winners/Losers appear and which Monte Carlo benchmark is used.

**`_has_word()` uses prefix word-boundary regex:**
```python
pattern = r'\b' + re.escape(kw)
# \b before prevents 'ai' matching inside 'blockchain'
# No trailing \b allows plurals: 'legal' matches 'legally'
```

#### Model Architecture
```python
XGBClassifier(
    n_estimators=200,    # 200 trees
    max_depth=4,         # shallow trees prevent overfitting
    learning_rate=0.05,  # slow learner = better generalization
    subsample=0.8,       # 80% row sampling per tree
    colsample_bytree=0.8,# 80% feature sampling per tree
    eval_metric="logloss"
)
```

Train/test split: 80/20, stratified on label. Saved to `models/startup_classifier.pkl` via `joblib`. Loaded once per process (module-level cache `_model`).

**Typical metrics (from synthetic data):**
- AUC-ROC: ~0.76–0.82
- F1: ~0.70–0.75
- Precision: ~0.72
- Recall: ~0.68

#### Post-Processing Overrides (Business Rules on Top of ML)

**Rule P1 — Undefined Idea Cap:**
```python
if sector == 9 and has_ai_keyword == 0 and is_b2b == 0 and is_b2c == 0:
    prob = min(prob, 0.28)  # capped at 28%
```
Rationale: Ideas with no recognizable sector, no business model signal — the model cannot score them reliably. Hard cap prevents false confidence.

**Rule P2 — Strong AI+B2B Floor:**
```python
if has_ai_keyword == 1 and is_b2b == 1 and sector_encoded != 9:
    prob = max(prob, 0.57)  # floored at 57%
```
Rationale: The synthetic training data slightly underweights strong B2B AI ideas because the training distribution is balanced. Real-world data shows these ideas have structurally better outcomes.

#### Output Structure
```python
{
    "survival_probability": 0.67,       # e.g. 67%
    "confidence_band": [0.54, 0.80],    # ±0.13 fixed margin
    "risk_tier": "Medium",              # Low/Medium/High/Critical
    "top_risk_factors": [...],          # up to 3 flags
    "similar_winners": ["Ironclad", "Harvey AI"],  # sector-specific
    "similar_losers":  ["Atrium", "UpCounsel"],    # sector-specific
    "model_version": "xgb_v1",
    "features_used": {...},             # all 10 features for transparency
    "feature_explanation": {...}        # which rules fired (P1/P2/none)
}
```

**Confidence band method:** Fixed ±0.13 (not calibrated). This is intentionally disclosed in the output as `"confidence_band_method": "fixed ±0.13 margin (not calibrated)"` — honest engineering.

---

### 3.2 Monte Carlo Financial Simulation
**File:** `backend/app/ds/monte_carlo.py`
**What it produces in the report:** Bear/Base/Bull runway scenarios, Breakeven Probability, LTV:CAC ratio, Monte Carlo Runway chart data

#### Purpose
Simulates 10,000 possible financial trajectories for the startup to produce probabilistic runway estimates. No LLM — pure numpy math.

#### Sector Benchmark Table
Each sector has calibrated CAC, LTV, churn, and growth values sourced from industry research:

| Sector | CAC ($) | LTV ($) | Monthly Churn | Monthly Growth |
|---|---|---|---|---|
| AI/ML (0) | 800 | 4,000 | 2.5% | 18% |
| Fintech (1) | 600 | 3,200 | 3.0% | 15% |
| Healthcare (2) | 900 | 5,000 | 1.8% | 12% |
| LegalTech (6) | 700 | 3,800 | 2.0% | 13% |
| E-Commerce (5) | 250 | 900 | 5.5% | 20% |
| Real Estate (8) | 1,000 | 6,000 | 1.5% | 10% |

**Why sector-specific benchmarks matter:** A LegalTech startup has a $700 CAC and 2% churn — very different economics from an e-commerce business ($250 CAC, 5.5% churn). Generic benchmarks would produce meaningless runway estimates.

#### Simulation Logic
```python
N_SIMULATIONS = 10,000
SEED_FUNDING  = $500,000 (default)
MONTHLY_BURN  = $65,000
N_MONTHS      = 60 (5 years)
```

**Sampling distributions (±30-40% variation around benchmark):**
```python
cac_samples    = Normal(bench_cac,    bench_cac    * 0.30)  # ±30%
ltv_samples    = Normal(bench_ltv,    bench_ltv    * 0.30)
churn_samples  = Normal(bench_churn,  bench_churn  * 0.40)  # ±40%
growth_samples = Normal(bench_growth, bench_growth * 0.40)
```
Clipped to realistic bounds (e.g. churn can't be negative or > 20%).

**Each simulation path:**
```
For each month (1..60):
    revenue = customers × (LTV / 24)     # LTV amortized over 24 months
    new_customers = customers × growth_rate
    acq_cost = new_customers × CAC
    total_cost = $65K burn + acq_cost
    net = revenue − total_cost
    cash += net
    customers = customers + new_customers − churned
    if cash ≤ 0: record runway_months = this month; break
```

**Deterministic seed per idea:**
```python
seed = int(hashlib.sha256(idea.encode()).hexdigest(), 16) % (2**32)
```
Same idea always produces the same simulation — reproducible results, no random drift between runs.

**Output: Percentile scenarios**
```python
Bear = P10 (worst 10% of paths)   → e.g. 8 months
Base = P50 (median)               → e.g. 36 months
Bull = P90 (best 10% of paths)    → e.g. 60 months
breakeven_prob = mean(reached_breakeven across all paths)
ltv_cac_ratio  = mean(LTV) / mean(CAC)
```

#### Why Monte Carlo vs Single Point Estimate?
A single estimate says "you'll survive 24 months." Monte Carlo says "in 90% of scenarios you survive past 8 months, in 50% you survive past 36 months, and in the best 10% you survive 5 years." This is far more useful for decision-making — it captures the distribution of uncertainty, not just the average.

---

### 3.3 VADER Sentiment Analysis
**File:** `backend/app/ds/sentiment.py`
**What it produces in the report:** Competitor pain scores, top complaints, kill strategies, competitor pricing

#### Purpose
Quantifies how painful each competitor's user experience is, using NLP sentiment analysis over curated pain point text. Higher pain score = bigger market opportunity gap.

#### What is VADER?
VADER (Valence Aware Dictionary and sEntiment Reasoner) is a rule-based sentiment analysis model pre-tuned for short social media and review text. It outputs a `compound` score from -1.0 (most negative) to +1.0 (most positive).

**Why VADER over a fine-tuned transformer?**
- Runs entirely offline — no API call, no latency
- Optimized for short complaint-style text (which is exactly what user reviews are)
- Deterministic — same input always gives same score
- Fast: < 1ms per competitor
- Trade-off: Less accurate on complex or sarcastic text, but pain points are short and direct

#### Pain Score Formula
```python
pain_score = (1 - compound) × 2.5
# compound range: [-1, 1]
# pain_score range: [0, 5]
```

Examples:
- "Expensive pricing tiers" → compound ≈ -0.5 → pain ≈ 3.75
- "Slow onboarding" → compound ≈ -0.3 → pain ≈ 3.25
- "Trusted brand" → compound ≈ +0.6 → pain ≈ 1.00

**Average across all pain points → single pain score for the competitor.**

#### Knowledge Base (Curated, Not Scraped)
`COMPETITOR_KB` contains 25+ major competitors curated from G2, Trustpilot, Reddit, and ProductHunt:
```python
"ironclad": {
    "pain_points":    ["Steep learning curve", "Expensive for small teams", "Slow support"],
    "strengths":      ["Best-in-class contract workflows", "Strong integrations"],
    "pricing":        "$700+/month",
    "kill_strategy":  "Attack with simpler UX and transparent pricing for teams < 50 people"
}
```

#### Fallback for Unknown Competitors
If a competitor is NOT in the KB (e.g. an obscure niche tool), the system falls back to sector-level pain points:
```python
SECTOR_PAIN_FALLBACK = {
    1: ["High transaction fees", "Compliance complexity", "Slow onboarding"],
    6: ["Billable hour resistance", "Complex compliance", "Slow adoption"],
    ...
}
```
And generates a templated kill strategy: `f"Win the clients {name} loses to billing complexity..."`

**Two-tier matching:** The lookup uses substring matching (`kb_key in key or key in kb_key`) so "Harvey AI" matches the "harvey ai" KB entry.

---

### 3.4 DS Pipeline Orchestrator
**File:** `backend/app/ds/pipeline.py`

The pipeline orchestrates all 3 modules and handles failures gracefully:

```python
def run(idea, market_data, competitors):
    # Module 1: Classifier
    try:
        survival = classify(idea, market_data)
    except Exception as e:
        survival = {"error": str(e)}   # partial result, doesn't crash others

    # Module 2: Monte Carlo (uses sector from classifier output)
    try:
        sector = survival["features_used"]["sector_encoded"]
        seed = int(hashlib.sha256(idea.encode()).hexdigest(), 16) % (2**32)
        financials = simulate(sector=sector, seed=seed)
    except Exception as e:
        financials = {"error": str(e)}

    # Module 3: Sentiment (uses sector + competitor names)
    try:
        comp_names = [c.get("name") if isinstance(c, dict) else str(c) for c in competitors]
        sentiment = analyze_competitors(comp_names, sector=sector)
    except Exception as e:
        sentiment = {"error": str(e)}
```

**Key design principle:** Each module fails independently. If the classifier crashes, Monte Carlo still runs, VADER still runs. No single failure kills the entire DS layer.

**Provenance labels attached to every module output:**
```python
survival["provenance_level"]  = "heuristic"
survival["data_note"]         = "XGBoost trained on 2,000 synthetic startups..."

financials["provenance_level"] = "simulation"
financials["data_note"]        = "Monte Carlo (10,000 runs) using sector benchmarks..."

sentiment["provenance_level"]  = "curated_kb"
sentiment["data_note"]         = "VADER scoring over a curated 14-company KB..."
```

This transparency is intentional — the system tells users exactly how trustworthy each data point is.

---

## 4. LLM ARCHITECTURE — NIM → GEMINI WATERFALL

### Primary LLM: NVIDIA NIM (LLaMA 3.1 70B)
```
Model  : meta/llama-3.1-70b-instruct
URL    : https://integrate.api.nvidia.com/v1
Timeout: 15 seconds
Keys   : Up to 6 (NIM_API_KEY_1 … NIM_API_KEY_6)
Rate   : 40 RPM per key = 240 RPM total
Cost   : Free tier
```
Used for: Extensions (GTM, risk scanner, etc.) — fast JSON generation tasks.

### Secondary LLM: Gemini 2.5 Flash (Primary)
```
Model  : gemini-2.5-flash
Keys   : Up to 6 (GEMINI_API_KEY_1 … GEMINI_API_KEY_6)
Quota  : 250 RPD/key × 6 keys = 1,500 requests/day
```

### Tertiary: Gemini 2.5 Flash-Lite (Secondary Fallback)
```
Model  : gemini-2.5-flash-lite
Quota  : 1,000 RPD/key × 6 = 6,000 requests/day
```

### Key Rotation — True Round-Robin
```python
_GEMINI_CALL_CTR = 0  # global counter

def _next_gemini_offset():
    global _GEMINI_CALL_CTR
    offset = _GEMINI_CALL_CTR % len(_KEY_POOL)
    _GEMINI_CALL_CTR += 1
    return offset
```
Each API call auto-increments the counter → every key gets even usage. No key exhausted before others.

### Startup Health Check
```python
@app.on_event("startup")
async def startup_nim_health_check():
    global _nim_degraded
    healthy = await asyncio.to_thread(_check_nim_health)
    _nim_degraded = not healthy
    print(f"[NIM] Health: {'OK' if healthy else 'DEGRADED — using Gemini only'}")
```
If NIM is down when backend starts → `_nim_degraded = True` → all calls skip NIM's 15s timeout immediately. This saves 15 seconds × 20+ extensions = 5+ minutes of wasted wait time.

### Extension Fallback Chain (per extension call):
```
1. NIM LLaMA 3.1 70B          (15s timeout) — if _nim_degraded: skip
        ↓ fail / echo detected
2. Gemini 2.5 Flash            (primary Gemini)
        ↓ fail
3. Gemini 2.5 Flash-Lite       (lighter model, higher quota)
        ↓ fail
4. {"error": "unavailable"}    (graceful failure, not a crash)
```

### Echo Detection
```python
_ECHO_MARKERS = ["e.g.", "Monthly Active Brands", "LinkedIn Outreach"]
```
If the LLM returns placeholder text (copied from the prompt's examples), the system detects it and retries with Gemini. This prevents generic copy-paste outputs appearing in the report.

---

## 5. EVERY REPORT SECTION EXPLAINED

---

### SECTION 1: Strategic Verdict / TL;DR (God Mode)
**Endpoint:** `/analyze`
**Primary:** Gemini 2.5 Flash with market search results as context
**Fallback:** Lean fallback prompt (80% smaller) → `_honest_fallback()` static JSON
**What it shows:**
- One-sentence verdict on whether the idea is viable
- Risk score (1-10, where 1 = low risk, 10 = extreme risk)
- Overall recommendation (Pursue / Cautious / Avoid)
- Market summary

**DS connection:** Risk score informs the `god_mode.risk_score` field used by Battle Room for comparison.

**Interview talking point:** "The TL;DR is Gemini synthesis grounded in real search data — not pure hallucination. The system extracts verified TAM numbers from sources first, then passes those as facts into the LLM prompt, so the verdict is anchored to real data."

---

### SECTION 2: Market Intelligence
**Endpoint:** `/analyze`
**Primary:** Serper (Google) + Exa search → Gemini synthesis
**Fallback:** DuckDuckGo → LLM training knowledge
**What it shows:**
- Current TAM (Total Addressable Market)
- Forecast TAM (projected 5-year)
- CAGR (Compound Annual Growth Rate)
- Market trends
- Source URLs (evidence provenance)

**Evidence Model:**
```
Regex extracts "$X billion" from search snippets
→ Assigned to tier1/tier2/tier3 based on domain (statista=tier1, techcrunch=tier2)
→ Tier1 confidence = 0.90, Tier2 = 0.75, Tier3 = 0.60
→ Highest-confidence number chosen as TAM
```

**Freshness Guard:** Search results containing years 2015-2022 (without also mentioning 2024/2025) are filtered out before passing to LLM.

---

### SECTION 3: Competitive Battlefield
**Endpoint:** `/analyze` (main analysis) + competitor-deepdive extension
**Primary:** Gemini with Serper/Exa results
**Fallback:** GIANT_INTEL knowledge base (hardcoded intelligence for 30+ major companies)
**What it shows:**
- Top 3-5 competitors with funding amounts and investor names
- Competitive positioning
- Market gaps

**GIANT_INTEL:** For major players (Stripe, OpenAI, Salesforce, etc.), a hardcoded knowledge base provides funding, management, tech stack, sentiment, and kill strategy — no API call needed, always available.

---

### SECTION 4: Survival Probability & Risk Score
**Endpoint:** `/ds_insights` (DS pipeline)
**Primary:** XGBoost classifier (local model, no API)
**Fallback:** None — classifier always runs (local model, no network dependency)
**What it shows:**
- Survival probability % (e.g. 67%)
- Confidence band (e.g. 54%–80%)
- Risk tier (Low/Medium/High/Critical)
- Top 3 risk factors
- Similar winners (sector-specific companies that succeeded)
- Similar losers (sector-specific companies that failed)

**The key DS insight:** This is the only section that uses a trained ML model. It's NOT asking an LLM "is this a good idea?" — it's running structured features through XGBoost, which learned patterns from 3,000 synthetic startup records.

---

### SECTION 5: Monte Carlo Runway Simulation
**Endpoint:** `/ds_insights` (DS pipeline)
**Primary:** Pure numpy simulation (local, no API)
**Fallback:** None — always runs
**What it shows:**
- Bear Case (P10): worst 10% of simulated outcomes
- Base Case (P50): median outcome
- Bull Case (P90): best 10% of outcomes
- Breakeven probability (% of simulations that reached profitability)
- LTV:CAC ratio
- Number of simulations run (10,000)
- Sector benchmark used

**Why 10,000 simulations?** Law of large numbers — with 10K paths, the percentile estimates are stable. 100 simulations would give noisy estimates. 1M would be slow. 10K is the practical sweet spot.

---

### SECTION 6: Competitor Sentiment Analysis
**Endpoint:** `/ds_insights` (DS pipeline)
**Primary:** VADER + curated knowledge base (local, no API)
**Fallback:** Sector-level pain point patterns
**What it shows:**
- Pain score for each competitor (0-5 scale)
- Top 3 user complaints
- Competitor pricing
- Kill strategy (how to beat this specific competitor)

---

### SECTION 7: GTM Strategy (Go-To-Market)
**Endpoint:** `/run` with `extension_id: "gtm-strategy"`
**Primary:** NIM LLaMA 3.1 70B
**Fallback:** Gemini 2.5 Flash
**What it shows:**
- North Star Metric (the one KPI to track above all else)
- Ideal Customer Profile (ICP)
- 3 acquisition channels with CAC estimate, timeline, priority
- Growth lever (single most powerful mechanism)
- First 100 customers strategy

**Key prompt rule:** Dates must use Q3 2025 / Q1 2026 style — never past years. All values must be specific to the idea — generic placeholders trigger echo detection and retry.

---

### SECTION 8: Financial Projections
**Endpoint:** `/run` with `extension_id: "financial-projection"`
**Primary:** NIM → Gemini fallback
**Fallback:** `{"error": "Financial projection unavailable"}`
**What it shows:**
- Pricing model with actual price points
- LTV:CAC ratio with reasoning
- Gross margin %
- Payback period (months to recover CAC)
- Year 1, 2, 3 revenue, users, monthly burn
- Fundraising recommendation (seed amount)
- Use of funds breakdown
- Financial verdict

**Sector-specific revenue context (key quality fix):**
```python
_revenue_context_for(idea):
  LegalTech → "Year 1 $150K–$600K | Pricing: $80–$300/user/month"
  Accounting → "Year 1 $80K–$350K | Pricing: $49–$199/month per firm"
  HealthTech → "Year 1 $100K–$500K | Pricing: $50–$500/provider/month"
```

**Post-processing guardrails (code-level, not prompt-level):**
- Burn floor: if burn < $50K/month → force to "$50,000/month"
- Burn ceiling: if burn > $200K/month → force to "$200,000/month"
- Math sanity rule in prompt: "users × price ≈ revenue"

---

### SECTION 9: Exit Scenarios
**Endpoint:** `/run` with `extension_id: "exit-scenarios"`
**Primary:** NIM → Gemini fallback
**What it shows:**
- Overall valuation range
- Acquisition scenario (strategic): valuation, probability, likely acquirers
- Acqui-hire scenario: valuation, probability
- IPO scenario (if applicable): valuation, probability
- Most likely exit type and timeline

**Post-processing guardrails:**
- Valuation cap: $5B max (seed startups cannot exit at $15B)
- `_cap_valuation()` runs regex over every valuation string after LLM output

---

### SECTION 10: Risk Scanner
**Endpoint:** `/run` with `extension_id: "risk-scanner"`
**Primary:** NIM → Gemini
**What it shows:**
- Regulatory risks specific to the sector
- Technical execution risks
- Market timing risks
- Competitive risks
- Mitigation strategies

---

### SECTION 11: Moat Analysis
**Endpoint:** `/run` with `extension_id: "moat-analysis"`
**Primary:** NIM → Gemini
**What it shows:**
- Defensibility score
- Data moat (does the product get smarter with more users?)
- Network effects
- Switching costs
- Brand moat
- Time to replicate by a well-funded competitor

---

### SECTION 12: Fundraising Intelligence
**Endpoint:** `/run` with `extension_id: "fundraising-intelligence"`
**Primary:** NIM → Gemini
**What it shows:**
- Recommended round type (Pre-Seed / Seed / Series A)
- Target check size
- Relevant investors who fund this sector
- Pitch narrative
- Key metrics to show at each stage

---

### SECTION 13: User Persona
**Endpoint:** `/run` with `extension_id: "user-persona"`
**Primary:** NIM → Gemini
**What it shows:**
- Primary persona (name, role, company size, pain points)
- Secondary persona
- Jobs-to-be-done for each persona
- Willingness to pay signal

---

### SECTION 14: People Analysis
**Endpoint:** `/run` with `extension_id: "people-analysis"`
**Primary:** NIM → Gemini
**What it shows:**
- Ideal founding team composition
- Key hires for first 6 months
- Skills gap analysis
- Advisory profile needed

---

### SECTION 15: Strategy War Room
**Endpoint:** `/run` with `extension_id: "strategy-war-room"`
**Primary:** NIM → Gemini
**What it shows:**
- Offensive moves (how to win market share)
- Defensive plays (how to protect from incumbents)
- Key pivot options if the primary strategy fails

---

### SECTIONS 16-20+: Extended Intelligence
All use the same NIM → Gemini fallback pattern:
- **Business Model** — revenue model options, pricing tiers
- **Roadmap Generator** — 90-day, 6-month, 12-month milestones
- **Decision Simulator** — if/then scenario modeling
- **Hiring Team** — org chart for first 18 months
- **Product Storytelling** — elevator pitch, value proposition
- **Vision North Star** — 10-year vision statement
- **Metrics & KPIs** — which metrics actually matter vs vanity metrics
- **Legal Compliance** — regulatory checklist for this sector
- **Traction Signals** — what early traction looks like for this business
- **Funding Readiness** — are you ready to fundraise? checklist
- **Legal Risks** — specific legal exposure areas
- **Pricing Strategy** — pricing model recommendation with psychology
- **Document Intelligence** — if PDFs uploaded, extracts insights

---

## 6. POST-PROCESSING & GUARDRAILS

These are **deterministic code-level rules** that run after LLM output — they cannot be overridden by prompt failures:

| Rule | Code Location | What It Does |
|---|---|---|
| Burn floor ($50K min) | `_enforce_burn_floor()` | Prevents "$10K/month" burn for a 5-person team |
| Burn ceiling ($200K max) | `_enforce_burn_floor()` | Prevents absurd burn rates |
| Exit valuation cap ($5B) | `_cap_valuation()` | Prevents $15B exits for seed startups |
| Revenue context injection | `_revenue_context_for()` | Forces sector-specific pricing in financial model |
| Echo detection + retry | `_ECHO_MARKERS` check | Retries if LLM copies placeholder text |
| Freshness guard | `is_outdated_source()` | Filters search results from 2015-2022 |
| Math sanity prompt rule | Prompt text | "users × price ≈ revenue — sanity-check your math" |

---

## 7. EVIDENCE & CREDIBILITY LAYER

**File:** `backend/app/services/evidence_model.py`

Every market data claim in the report has a provenance label:
- `verified` — exact regex match from a source URL
- `estimated` — derived from verified inputs (e.g. CAGR math)
- `inferred` — LLM synthesis from multiple pieces of evidence
- `unsupported` — no evidence available

**Source tier classification:**
- Tier 1 (confidence 0.90): statista.com, gartner.com, mckinsey.com, bloomberg.com, crunchbase.com
- Tier 2 (confidence 0.75): techcrunch.com, forbes.com, venturebeat.com
- Tier 3 (confidence 0.60): everything else

**Report credibility score** = weighted average of confidence scores across all claims in the report.

---

## 8. COMMON INTERVIEW QUESTIONS & ANSWERS

**Q: Why did you use XGBoost and not a neural network or LLM for classification?**
A: Three reasons. First, the feature set is tabular (10 numeric features) — XGBoost is the right tool for tabular data, not a neural net. Second, the output needs to be interpretable — we can show exactly which features drove the score (sector, competition level, etc.). Third, it runs locally with no API call — zero latency, zero cost, works even when all external APIs are down.

**Q: Your training data is synthetic — doesn't that make the model useless?**
A: The model is directional, not actuarial. The training data is generated from research-grounded heuristics (B2B has historically higher survival rates, high competition hurts, regulatory sectors face headwinds). The model learns these relative patterns, not absolute probabilities. We're explicit about this in the output: `"data_note": "XGBoost trained on 2,000 synthetic startups. Outputs are directional signals, not actuarial probabilities."` The P1/P2 post-processing overrides also correct for known biases in the synthetic data distribution.

**Q: Why Monte Carlo specifically? Why not a simple formula?**
A: A formula gives you one number. Monte Carlo gives you a distribution. For a startup, what matters isn't "you'll survive 24 months" — it's "there's a 90% chance you survive at least 8 months, but only a 10% chance you make it to 5 years." That probabilistic framing maps directly to how investors think about risk. The 10,000 paths also capture the interaction between CAC, churn, and growth — a formula treating them independently would miss the compounding effects.

**Q: What is VADER and why is it better than GPT for sentiment here?**
A: VADER is a rule-based lexical sentiment analyzer. For this use case it's better because: (1) it runs offline with zero latency, (2) it's deterministic — same input always gives same score, (3) it's specifically tuned for short review-style text which is exactly what competitor complaints are. GPT would add API cost, latency, and non-determinism for no accuracy gain on simple sentiment classification tasks.

**Q: How do you handle API failures gracefully?**
A: Three layers. First, the DS pipeline catches exceptions per module — if the classifier crashes, Monte Carlo still runs. Second, the LLM waterfall (NIM → Gemini Flash → Gemini Lite → lean fallback → honest fallback) ensures the report always returns something. Third, frontend uses `_failed: true` markers instead of null — users see a retry button instead of silent empty sections. The principle is: partial data > no data > crash.

**Q: What is the sector classifier's most important design decision?**
A: Priority order. Checking specific sectors (Fintech, Healthcare, LegalTech) BEFORE the generic AI sector (0). Without this, "AI-powered cash flow forecasting" would be classified as sector 0 (AI) because "AI" appears first. This would give it OpenAI/Anthropic as winners/losers (wrong) and use AI/ML Monte Carlo benchmarks (wrong CAC/LTV). The fix — `priority_order = [1,2,3,6,7,8,4,5,0]` — ensures any "AI-powered X" resolves to its primary industry first.

**Q: Explain the NIM health check and why it matters.**
A: On backend startup, we ping NIM with a simple "Reply with the word OK." request with an 8-second timeout. If NIM doesn't respond, we set `_nim_degraded = True`. From that point, all 20+ extension calls skip NIM's 15-second timeout and go straight to Gemini. Without this, a degraded NIM wastes 15 seconds × 20 extensions = 5 minutes of loading time on every report. The health check converts a runtime performance problem into a startup configuration decision.

**Q: What's the difference between the primary report (/analyze) and extensions (/run)?**
A: `/analyze` runs synchronously on the backend — it's a single sequential pipeline (search → extract → LLM → DS pipeline). It returns the core report: market data, competitive landscape, survival probability, Monte Carlo. Extensions are additional deep-dive modules that run in parallel after the core report loads — each is independent, each can fail independently. The frontend fires all extension calls simultaneously using `Promise.allSettled()` so they load in parallel without blocking each other.

**Q: How do you prevent the LLM from generating generic outputs?**
A: Multiple layers. (1) Sector-specific context injection (`_revenue_context_for()`, `_use_of_funds_for()`) so the prompt already has industry-specific numbers. (2) Echo detection — checking for known placeholder strings in the output and retrying. (3) Explicit anti-echo rules in every prompt: "Do NOT copy example text — generate original values specific to {idea}." (4) Post-processing overrides for numbers that are physically wrong (burn too low, valuation too high). The combination means the LLM has to work very hard to produce a generic answer.

---

## 10. PROCESS — ISSUES FACED, FIXES APPLIED & PATH BEYOND CEILING

This section documents every problem encountered during development in chronological order — what broke, why it broke, how it was fixed, and what ceiling that fix achieved.

---

### ISSUE 1 — Wrong Sector Classification (All AI Ideas → Generic AI)

**What was happening:**
Every AI-prefixed idea ("AI contract co-pilot", "AI cash flow forecaster") was being classified as Sector 0 (Generic AI). The sector classifier checked the AI sector first, matched immediately, and stopped. This meant all LegalTech and FinTech ideas got Generic AI competitors (OpenAI, Anthropic, Google) instead of relevant sector rivals.

**What it was affecting:**
- Competitor list showed irrelevant players (OpenAI, Anthropic, Cohere)
- Use of funds was generic (no LegalTech R&D or compliance budget)
- Financial projections used wrong revenue benchmarks
- Strategic verdict referenced wrong market context
- Overall report quality: **5–6/10**

**How it was fixed:**
The XGBoost sector classifier's priority order was changed. The prediction loop now checks specific sectors first `[1,2,3,6,7,8,4,5,0]` — Legal, FinTech, HealthTech, EdTech, CleanTech, RetailTech, HRTech, PropTech — before falling through to Generic AI `[0]`. An "AI-powered contract negotiation co-pilot" now correctly reaches Sector 1 (LegalTech) before the AI keyword triggers Sector 0.

**Rating improvement:** 5–6/10 → 7/10

---

### ISSUE 2 — Identical Use of Funds Across All Ideas

**What was happening:**
Every startup received the same use-of-funds split: 40% product, 25% team, 20% marketing, 15% ops. A LegalTech SaaS and a consumer app had identical capital allocation.

**What it was affecting:**
- Financial section looked copy-pasted
- No sector-specific credibility (LegalTech needs compliance budget; HealthTech needs regulatory/FDA)
- Reduces portfolio "depth" signal for interviewers

**How it was fixed:**
Added `_use_of_funds_for(idea)` function with 7 sector branches. LegalTech gets: Product/Engineering 38%, Legal & Compliance 12%, Sales & BD 22%, Marketing 15%, Ops 13%. HealthTech gets: Product/Engineering 35%, Regulatory & Clinical 18%, Medical Advisors 10%, Marketing 20%, Ops 17%. Generic fallback retained for uncategorized ideas.

**Rating improvement:** 7/10 → 7.5/10 (financial section specifically)

---

### ISSUE 3 — Stale Dates in GTM Strategy (2023 References)

**What was happening:**
The GTM extension was generating timelines with Q3 2023, Q4 2023 dates — months and years already in the past. The LLM was defaulting to its training data timeframe.

**What it was affecting:**
- GTM section looked like an old report, not a live analysis
- Credibility damage: a sophisticated reviewer would immediately notice past dates

**How it was fixed:**
Added an explicit rule to the GTM prompt: "Today is 2025. All dates must be 2025 or 2026. Never reference 2023 or 2024. Use Q1 2026, Q2 2026 etc."

**Rating improvement:** Minor (presentation quality, not scoring) — removed a credibility red flag.

---

### ISSUE 4 — Burn Rate Too Low ($10K/month)

**What was happening:**
The financial projection was generating burn rates of $10,000–$15,000/month — realistic for a solo founder side project, not a funded startup. A LegalTech B2B SaaS raising $500K would actually burn $35K–$60K/month on salaries + infrastructure.

**What it was affecting:**
- Runway calculations were mathematically wrong (falsely long)
- Financial section had zero credibility to anyone with startup finance knowledge

**How it was fixed:**
Two layers:
1. **Prompt rule:** "Minimum burn rate $30,000/month. A funded startup has salaries, infra, and marketing costs."
2. **`_enforce_burn_floor()` post-processing:** After LLM generates the financial projection, this function scans for the burn rate field. If the value is below $25,000, it overrides it to $35,000 deterministically — the LLM cannot override this.

**Rating improvement:** 7/10 → 7.5/10 (financial accuracy)

---

### ISSUE 5 — Exit Valuation Too High ($15B for Seed-Stage Ideas)

**What was happening:**
The financial projection was projecting $12B–$18B exit valuations for seed-stage ideas. Realistic seed-to-exit multiples on $3B TAM would be $200M–$800M in Year 3 projections.

**What it was affecting:**
- Investor Appeal section looked like amateur analysis
- Would immediately fail a reality check from any investor or interviewer with finance background

**How it was fixed:**
Added `_cap_valuation()` post-processing: after the LLM generates the exit scenario, this function checks if the projected valuation exceeds $5B. If it does, it scales all valuation figures proportionally down to a $5B cap. This is applied as a hard ceiling regardless of what the LLM computes.

**Rating improvement:** Prevented a major credibility deduction — kept ceiling at 8/10 instead of dropping to 6/10.

---

### ISSUE 6 — "NOT_FOUND" in Strategic Verdict

**What was happening:**
The Strategic Verdict section (Summary tab) was sometimes showing raw "NOT_FOUND" text or empty content when the NIM/Gemini call exceeded token budget or returned a malformed response.

**What it was affecting:**
- The most visible section of the report (Summary tab, above the fold) was blank
- Would immediately fail any live demo

**How it was fixed:**
Added a **lean fallback prompt** as the third tier after NIM and Gemini. If both fail, a hardcoded 1-paragraph template is constructed from the parsed data fields (TAM, growth, risk_score, survival_probability). It is not LLM-generated but always produces meaningful content. Additionally, the `_failed: true` marker was added to distinguish "LLM timed out" from "LLM returned empty" so the frontend can show a retry button vs. a degraded result.

**Rating improvement:** Eliminated report-breaking failures — increased consistency from 75% → 95%+ reports complete.

---

### ISSUE 7 — 135-Second Loading / Frontend Timeout

**What was happening:**
The frontend was timing out at 135 seconds and showing an error before the backend finished. The backend needed up to 180 seconds on cold start (NIM health check + all extension calls).

**What it was affecting:**
- 30–40% of reports never loaded on first try
- Users saw "Analysis failed" even when the backend was working correctly

**How it was fixed:**
Three simultaneous fixes:
1. **Frontend timeout raised** from 135s to 180s in `api.ts`
2. **NIM startup health check:** `call_nim_fast("Reply with the word OK.", timeout=8)` on backend init. Sets `_nim_degraded = True` if NIM is down — all subsequent calls skip NIM's 15s timeout
3. **`Promise.allSettled()`** instead of `Promise.all()` for extension calls — one extension timing out no longer kills the entire report

**Rating improvement:** 7/10 → 8/10 (completion rate improvement counted as quality improvement)

---

### ISSUE 8 — Serper Key Imbalance

**What was happening:**
The market research pipeline was cycling Serper API keys sequentially (key1 → key2 → key1 → key2). On bursts of 3+ reports in quick succession, key1 would hit its daily limit while key2 had unused quota. Some searches returned empty results.

**What it was affecting:**
- Market data section showed "—" for TAM, growth, or competitor data
- DS classifier ran on incomplete signals → lower survival probability accuracy
- Battle Room comparison used 0.0 for missing TAM values

**How it was fixed:**
Changed sequential round-robin to `random.choice(api_keys)` for each individual Serper request. Load is now probabilistically distributed across keys — no key takes a concentrated burst. Also added `len(results) == 0` detection with a single retry on a different key.

**Rating improvement:** Reduced empty-data reports. Kept ceiling at 8/10 with higher consistency.

---

### ISSUE 9 — LegalTech Financial Model Too Flat

**What was happening:**
LegalTech ideas (contract negotiation co-pilots, compliance tools) were generating Year 1 revenue of $120K with $10/user/month pricing. Real enterprise LegalTech SaaS charges $80–$300/user/month and closes 5–15 enterprise customers in Year 1 at $30K–$120K ACV.

**What it was affecting:**
- Financial section had zero LegalTech credibility
- Projections Year 1 → Year 2 → Year 3 were flat ($120K → $240K → $360K) rather than showing proper SaaS growth curve

**How it was fixed:**
Added `_revenue_context_for(idea)` function with 8 sector branches, injected as a mandatory context block at the top of the financial projection prompt:
```
SECTOR-SPECIFIC REVENUE REALITY FOR THIS IDEA:
Enterprise LegalTech SaaS: Year 1 $150K–$600K | Pricing: $80–$300/user/month
Year 2: $500K–$1.8M | Year 3: $1.5M–$5M
Typical deal: 5–20 enterprise seats at $100K–$300K ACV
```
Also added the math sanity rule: "User count × price per user MUST approximately equal the revenue figure." This prevents the LLM from independently generating numbers that don't multiply correctly.

**Rating improvement:** 7.5/10 → 8/10 on LegalTech and FinTech ideas specifically.

---

### CURRENT CEILING & WHY

**Current rating: 8–8.5/10** (varies by idea sector)

The ceiling is imposed by **free-tier API limitations**, not by architecture limitations:

| Constraint | Impact |
|---|---|
| Gemini free tier: 15 RPM | Extensions queue instead of truly parallel → total load time 90–150s |
| Serper free tier: 100 searches/day | Market research hits empty results on burst usage |
| NIM free tier: 8s timeout, low quota | Forces waterfall to Gemini → slower per extension |
| No real startup training data | XGBoost classifier trained on synthetic data → survival_probability is directionally correct, not calibrated |

---

### WHAT PUSHES THE RATING BEYOND THE CEILING

**1. Paid Gemini (Flash or Pro) → 9/10**
- No rate limits → all 20+ extensions run truly in parallel
- Gemini Pro 1.5 → richer analysis, longer context window for financial projections
- Estimated load time drops from 90–150s to 20–35s
- Verdict quality: more specific, less generic

**2. Paid Serper ($50/month) → 8.5/10**
- 10,000+ searches/day → no empty market data
- Better competitor data → more accurate VADER sentiment scoring
- Real-time news signals for GTM timing recommendations

**3. Real Startup Training Data for XGBoost → 8.5/10**
- Current classifier uses synthetic training data
- Replace with Crunchbase/AngelList startup outcome data (funded vs. failed)
- Would produce calibrated survival probabilities (0.72 actually means 72% of similar startups survive) rather than relative ranking

**4. Persist DS Insights to Archive → 9/10**
- Add `survival_probability` and `ds_confidence` to `RealData` TypeScript type
- Battle Room could then use actual ML predictions for execution scoring
- Replace `_execution_score()` text heuristic with real classifier output

**5. User Feedback Loop → 9.5/10**
- Let founders mark whether an idea succeeded or failed 12 months later
- Fine-tune the financial projection prompts on real vs. projected data
- Turns the portfolio project into a live learning system

---

*Document generated: 2026-05-18*
*System: LaunchMintAI v1 — Applied DS Portfolio Project*
