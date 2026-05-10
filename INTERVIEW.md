# LaunchMintAI — Interview Preparation Guide

Everything you need to confidently discuss this project in a Data Science or ML Engineering interview.

---

## 1. The One-Line Pitch

**LaunchMintAI is a production-grade startup intelligence engine that combines XGBoost classification, Monte Carlo simulation, VADER NLP, and real-time Tavily search grounding to validate startup ideas in under 500ms — with measurable accuracy benchmarked against 50 labeled ground-truth cases.**

---

## 2. What Problem Does It Solve?

Founders get startup feedback based on gut feel, not data. There is no fast, reliable way to assess:
- 5-year survival probability from a plain-text idea
- Financial runway under bear/base/bull market scenarios
- Competitor customer pain and kill strategies
- Whether your market size number is real or hallucinated

LaunchMintAI solves all four — reproducibly, with an evaluation layer that proves it.

---

## 3. System Architecture

### Frontend
- React 19 + TypeScript + Vite 6
- Tailwind CSS with glassmorphism "stealth terminal" design
- 4 tabs: Validator, VC Roast, Pitch Forge, Battle Room
- Cache layer (`getCachedResult`) passes Validator results to Forge — no redundant API calls

### Backend
- FastAPI (Python 3.10+) with Pydantic request models
- Parallel async endpoints — Validator fires 3 calls simultaneously: `/analyze`, `/ds_insights`, `/war_room`
- 6 Gemini API keys + 6 Tavily keys with rotation and failover
- SQLite + SQLModel for persistence; ChromaDB for vector search

### LLM Layer
- **Model:** `gemini-flash-latest` (stable, high RPM)
- Multi-key rotation — if key N fails or rate-limits, tries N+1
- Timeout: 90 seconds per request
- Thinking token handling: iterates `parts[]`, skips `thought: True` entries

### Search Layer
- **Tavily** 3-tier waterfall:
  - Tier 0: Statista, GrandViewResearch (highest trust)
  - Tier 1: McKinsey, BCG, Gartner
  - Tier 2: Open web
- Replaced DuckDuckGo (DDGS) which hung indefinitely on rate limits

### DS Layer
- XGBoost binary classifier → survival probability
- Monte Carlo (10,000 runs) → Bear/Base/Bull runway
- VADER sentiment on curated competitor knowledge base → pain score
- All three run in parallel threads

---

## 4. The DS Layer — Deep Dive

### Why Not Just an LLM?

| Approach | Problem |
|----------|---------|
| Pure LLM | Inconsistent numerical scores — same idea scores differently each run. No calibrated probability output. Can't be evaluated with precision/recall. |
| Rule-based only | ~40% accuracy on nuanced cases. Can't model sector-specific survival rates. |
| **XGBoost + rules + MC + VADER** | Deterministic, evaluable, fast, calibrated |

### XGBoost Classifier

- **Training data:** 2,000 synthetic startups, stochastic survival labels based on business heuristics
- **Features (10):** `has_ai`, `is_b2b`, `is_consumer`, `is_niche_or_unknown`, `team_size_signal`, `has_b2c`, `has_saas`, `sector_encoded`, `idea_length`, `keyword_density`
- **Feature extraction:** Word-boundary regex (`\bkeyword`) — prevents substring false positives (e.g., "blockchain" triggering `has_ai`)
- **Post-processing rules:**
  - **P1 (Cap):** Niche/unknown ideas capped at 0.45 — model has no negative signal for unknown markets
  - **P2 (Floor):** AI+B2B ideas floored at 0.57 — model underweights this strong market signal on synthetic data

### Monte Carlo Simulation

- 10,000 runs per idea, sector-calibrated CAC/LTV/churn benchmarks
- Returns: Bear/Base/Bull runway in months + breakeven month
- 8 sectors benchmarked; ideas outside sectors use conservative defaults

### VADER Sentiment

- Curated knowledge base of 14 competitors
- Compound sentiment score → `pain_score` (0–5)
- Returns top pain points and kill strategy per competitor

### Evaluation Results

| Metric | Value |
|--------|-------|
| Golden Test Accuracy | 50/50 · 100% |
| XGBoost AUC-ROC | 0.8170 |
| XGBoost F1 Score | 0.7183 |
| XGBoost Accuracy | 73% |
| Avg Pipeline Latency | 386ms |
| P95 Latency | 596ms |
| Stress Test | 50/50 · 100% |

---

## 5. Key Engineering Decisions

### Decision: Merge War Room into Validator
**Why:** War Room and Validator both analyze the same idea. Users had to run Validator, switch tabs, re-enter the idea in War Room — duplicate effort, context switching. Merging into one parallel call (`/analyze` + `/war_room` fired simultaneously) eliminates this, reduces tabs from 5 to 4, and gives users forensic competitor data without extra clicks.

### Decision: Tavily over DuckDuckGo
**Why:** DDGS was hanging indefinitely on rate limits without throwing exceptions — Python threads blocked forever. Tavily is a paid API (free tier: 1,000 searches/month) with reliable SLAs. All DDGS usage replaced with synchronous Tavily client.

### Decision: `gemini-flash-latest` over `gemini-2.5-flash`
**Why:** `gemini-2.5-flash` is a preview model with 2–15 RPM limits. Under load with 6 keys rotating, it was exhausted instantly. `gemini-flash-latest` resolves to the stable production build with significantly higher RPM.

### Decision: Post-Processing Rules over Retraining
**Why:** Training XGBoost on 2,000 synthetic cases creates specific blind spots (AI+B2B underweighted, niche ideas overweighted). Retraining on real data requires a labeled CB Insights / Crunchbase dataset we don't have. Deterministic P1/P2 rules are transparent, debuggable, and fix the known failure modes without overfitting.

### Decision: Compare Arena (Battle Room)
**Why:** Users running multiple ideas through Validator had no way to compare them side-by-side. Battle Room reads from the saved archive, sends both idea summaries to `/compare`, and gets an AI-declared winner with a 5-dimension scorecard — making the decision between two paths explicit.

---

## 6. Bugs Found and Fixed

### Bug 1: Gemini 2.5 Flash Thinking Tokens (Root Cause of All NOT_FOUND)
- **Symptom:** Every API call returned `NOT_FOUND` / `_honest_fallback` despite valid keys
- **Root cause:** Gemini 2.5 Flash returns thinking content as `parts[0]` with `"thought": true`. The actual JSON response is in `parts[1+]`. Code was returning `parts[0]["text"]` which was thinking monologue, not valid JSON → `clean_json` failed → fallback triggered
- **Fix:** Iterate `parts[]`, skip entries where `part.get("thought", False) == True`, return first real text part

### Bug 2: Contradictory HONESTY PROTOCOL
- **Symptom:** Gemini responses were inconsistent and sometimes froze
- **Root cause:** Prompt said "NEVER use your own knowledge" AND "NOT_FOUND for a major market is not acceptable" — two rules that couldn't both be satisfied. Gemini entered an unresolvable conflict
- **Fix:** Rewritten as 3-priority cascade: (1) use search results, (2) use training knowledge with Medium confidence, (3) NOT_FOUND as last resort only

### Bug 3: Broken Fallback Instruction in `format_search_results_for_prompt`
- **Symptom:** Gemini returned literal string "Data verification pending" instead of JSON
- **Root cause:** Fallback text when no search results were found told Gemini to "respond with 'Data verification pending'" — not valid JSON
- **Fix:** Instruct to use training knowledge with Medium confidence and return valid JSON

### Bug 4: DDGS Hanging
- **Symptom:** Backend requests hung indefinitely, no timeout, no exception
- **Root cause:** DuckDuckGo rate limiting causes Python threads to block without raising
- **Fix:** Replaced all DDGS usage with synchronous Tavily client

### Bug 5: TypeScript Type Error in PitchForge
- **Symptom:** TS2339 — `forecast_tam` and `growth` don't exist on type `{}`
- **Fix:** Cast to `any`: `const mkt = (cached?.data?.market || {}) as any`

---

## 7. Credibility vs Quality

These are two different dimensions:

| Dimension | Meaning |
|-----------|---------|
| **Credibility** | How trustworthy is the data? Is it grounded in real sources or hallucinated? |
| **Quality** | How useful and actionable is the output for a founder? |

**Validator:** 8/10 credibility (Tavily + adversarial Skeptic audit), 9/10 quality  
**VC Roast:** 7/10 credibility (Tavily competitor grounding added in Phase 2), 9/10 quality  
**Pitch Forge:** 6/10 credibility (market data injected from Validator cache), 8/10 quality  
**Battle Room:** 7/10 credibility (LLM comparison with real market inputs), 7/10 quality

Free tier ceiling is ~8/10 credibility — achieving 9-10 requires a paid Tavily plan (10K+ searches/month) and real labeled training data for the XGBoost model.

---

## 8. Free Tier Constraints and Mitigations

| Constraint | Mitigation |
|------------|------------|
| Tavily: 1,000 searches/month | 6-key rotation across 6 accounts; caching prevents re-searches for same idea |
| Gemini: RPM limits | 6-key rotation + fallback to secondary model |
| No real startup outcome data | Synthetic training set (2,000 cases) + deterministic P1/P2 rules for known failure modes |
| No real-time news | Tavily search results stand in for real-time competitor intelligence |

---

## 9. The Eval Folder — Why It Matters

The `backend/app/ds/eval/` folder is the proof layer. Without it, LaunchMintAI is just another GPT wrapper. With it:

- **`dataset.jsonl`** — 50 labeled startup ideas, 11 domains, 3 ground truth sources (CB Insights, Startup Genome, deterministic rules)
- **`golden.test.py`** — Correctness test: 50/50 pass rate, fully reproducible with `python golden.test.py`
- **`benchmark.py`** — Performance metrics: avg latency 386ms, P95 596ms
- **`EVAL_REPORT.md`** — Full benchmark report with error analysis, domain breakdown, and methodology
- **Charts** — 4 PNG charts: accuracy by domain, survival by domain, rule breakdown, per-case grid

This is what makes the DS layer credible in an interview — you can run the eval in front of the interviewer.

---

## 10. Anticipated Interview Questions

**Q: Why XGBoost over a neural network?**  
A: Startup survival data is tabular with ~10 features. XGBoost handles tabular data better than neural nets at small dataset sizes (2,000 cases), trains in seconds, is interpretable (feature importance), and gives well-calibrated probabilities. Neural nets would overfit here.

**Q: How do you prevent hallucination?**  
A: Three-layer defense. (1) Tavily search grounding pulls real source text. (2) Adversarial Skeptic Agent does string-matching against the raw source text — if a number isn't in the text, it fails. (3) HTTP 422 thrown after 3 failed retries — the system refuses to return ungrounded data.

**Q: Why Monte Carlo for financial scenarios?**  
A: Startup financials have wide uncertainty bands. A deterministic model gives a single point estimate that's almost certainly wrong. Monte Carlo with 10,000 runs captures the distribution — bear case (P10), base case (P50), bull case (P90) — which is how real financial modelers think about uncertainty.

**Q: What would you improve with more time/data?**  
A: (1) Train XGBoost on real startup outcomes from Crunchbase/CB Insights — would push AUC-ROC from 0.82 toward 0.88+. (2) Expand Monte Carlo to 15+ sectors. (3) Expand VADER competitor KB from 14 to 50+ companies with real G2/Trustpilot review data. (4) Replace keyword feature extraction with semantic embeddings for better AI+B2B signal detection.

**Q: What's the P1/P2 rule system?**  
A: Deterministic post-processing overrides for known model blind spots. P1 caps survival at 0.45 for niche/undefined markets — the model has no negative signal for markets it's never seen. P2 floors survival at 0.57 for AI+B2B ideas — the model underweights this strong commercial signal because the synthetic training data doesn't fully reflect real-world AI+B2B success rates.

**Q: How did you validate the eval dataset's ground truth?**  
A: Three sources per domain. AI+B2B and B2B: CB Insights failure rate data (B2B SaaS ~45% survival). Consumer: CB Insights B2C data (80%+ failure). Niche/undefined: deterministic rule output (P1). High-growth/sector-specific: Startup Genome Project sector survival rates. Known archetypes (Notion, Zocdoc, Stripe patterns): model should replicate market validation signals.

**Q: Why 2,000 synthetic training samples?**  
A: It's the minimum for XGBoost to learn a generalizable boundary with 10 features. More is better, but real labeled startup outcome data at scale requires CB Insights or Crunchbase API access. Synthetic generation with business-rule-based label assignment was the fastest path to a demonstrably working classifier. The P1/P2 rules patch the remaining calibration gap.

**Q: How does the Battle Room work?**  
A: Users run multiple ideas through Validator — each result is saved to a local archive. Battle Room reads from that archive. When 2 ideas are selected, it sends both idea summaries plus their market data (TAM, growth, risk score) to the `/compare` endpoint. Gemini compares them across 5 dimensions: Market Size, Growth Rate, Competition, Execution Difficulty, Investor Appeal — outputs a winner, verdict paragraph, and scored table.

**Q: What's the latency budget?**  
A: Target was under 500ms for the DS pipeline (XGBoost + Monte Carlo + VADER). Achieved 386ms average, 596ms P95. The full Validator response (including Tavily search + Gemini analysis) takes 3–8 seconds — the bottleneck is the Tavily waterfall search, not the DS layer.

---

## 11. Numbers to Remember

| Number | What It Is |
|--------|-----------|
| 50/50 | Golden test accuracy |
| 0.8170 | XGBoost AUC-ROC |
| 0.7183 | XGBoost F1 Score |
| 73% | XGBoost accuracy on held-out test set |
| 386ms | Average DS pipeline latency |
| 596ms | P95 DS pipeline latency |
| 10,000 | Monte Carlo simulation runs per idea |
| 2,000 | Synthetic training samples for XGBoost |
| 14 | Competitors in VADER knowledge base |
| 50 | Stress test cases (5 tiers, 10 each) |
| 11 | Evaluation domains |
| 6 | Gemini API keys in rotation |
| 6 | Tavily API keys in rotation |
| 4 | Frontend tabs (Validator, Roast, Forge, Battle Room) |
| 3 | Parallel API calls fired by Validator simultaneously |
| 422 | HTTP status code thrown on grounding failure |

---

## 12. Project Phases

| Phase | What Was Done |
|-------|--------------|
| Phase 1 | Merged War Room into Validator (4 tabs total). Removed duplicate tab, fired `/war_room` in parallel with `/analyze`. |
| Phase 2 | Maxed credibility/quality for all tabs: Tavily grounding into Roast, market data injection into Forge, Compare Arena in Battle Room |
| Phase 3 | 15-idea Antigravity stress tests per tab. Fixed DDGS hanging, Gemini model deprecation, thinking token bug. All tabs passing. |
| Phase 4 | GitHub push, README/INTERVIEW updates, deploy, portfolio |
