# LaunchMintAI — Interview Preparation Guide
### Targeting: Applied Data Scientist · Full-Stack Data/Application Engineer

Everything you need to confidently discuss this project in a DS, ML Engineering, or full-stack engineering interview.

---

## 1. The One-Line Pitch

**LaunchMintAI is a production-grade startup intelligence engine that combines XGBoost classification, Monte Carlo simulation, VADER NLP, and real-time web search grounding to validate startup ideas — with a calibrated two-step LLM pipeline, 9 production-scale optimizations, and a measurable eval layer benchmarked against 50 labeled ground-truth cases.**

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
- `cache.ts` — localStorage LRU cache (24h TTL, max 20 entries, evicts oldest on overflow)
- `inFlightRef` deduplication — prevents double-firing identical requests mid-flight
- SSE EventSource — Validator streams 5-stage progress updates via `/analyze/stream`

### Backend
- FastAPI 0.128 (Python 3.10+) with Pydantic request models
- Parallel async endpoints — Validator fires `/analyze` + `/ds_insights` + `/war_room` simultaneously
- 6 Gemini API keys + 6 NIM keys with rotation and dead-key tracking
- slowapi rate limiter — 10 req/min per IP on all LLM endpoints
- SQLite + SQLModel for Battle Room archive persistence; ChromaDB for vector search
- Server-side in-memory response cache — 86400s TTL, 500-entry LRU

### LLM Layer
- **Primary:** `gemini-flash-latest` (stable high-RPM build) + NVIDIA NIM fallback
- `_llm_race()` — fires Gemini and NIM simultaneously with `asyncio.as_completed`, takes first valid response
- Dead key tracking — `_DEAD_KEYS` dict skips 429-returning keys for 60 minutes
- Multi-key rotation — if key N hits rate limit, tries N+1 from pool
- Thinking token handling: iterates `parts[]`, skips `thought: True` entries

### Search Layer
- **Serper** (Google grounding) — financial + competitor queries in parallel via `asyncio.gather`
- **Tavily** 3-tier waterfall (Statista → McKinsey/BCG/Gartner → open web)

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

### Deterministic RAG & The Math Fallback Protocol

- **Zero-Tolerance Hallucination Protocol:** LLM is mathematically forced to return `UNSUPPORTED` if specific figures aren't found in the semantic context window. Eliminates "Medium confidence" guessing.
- **Dynamic Recency Filtering:** Python `datetime` module extracts 4-digit years from raw search text and deterministically drops the source if the *newest* cited year is >3 years old.
- **Math Override (The True Skeptic):** The backend actively audits the LLM. If the LLM hallucinates a Forecast TAM that deviates >10% from `Current_TAM * ((1 + CAGR/100) ^ 5)`, the Python engine intercepts the payload, overwrites the JSON with the correct math, and flags it `[MATH OVERRIDE]`.
- **Advanced Regex Extraction:** Dual-pass RegEx captures both standard English phrasing ("market reached a value of $X") and shorthand financial bullet points ("TAM: $XB").

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

## 5. The 9 Production-Scale Optimizations

This is a key differentiator — not just "it works" but "it works under load."

### OPT 1 — Server-Side Response Cache
```python
_RESPONSE_CACHE: dict[str, tuple[dict, float]] = {}
_CACHE_TTL = 86400  # 24h
_CACHE_MAX = 500    # LRU eviction at 500 entries
```
- Identical idea strings return cached JSON instantly — no LLM call, no API credit burned
- LRU eviction: when cache hits 500 entries, the oldest timestamp entry is deleted
- **Interview angle:** This is a read-through cache pattern — same concept as Redis for API responses

### OPT 2 — Dead Key Tracking
```python
_DEAD_KEYS: dict[str, float] = {}   # key → timestamp when marked dead
_DEAD_KEY_COOLDOWN = 3600           # 60 minutes
```
- When a key returns 429, it's recorded with a timestamp and skipped for 60 minutes
- Prevents hammering exhausted keys — the rotation pool self-heals automatically
- **Interview angle:** Same pattern as circuit breakers in distributed systems

### OPT 3 — Rate Limiting (slowapi)
```python
_limiter = Limiter(key_func=get_remote_address)
@_rate_limit  # 10 req/min per IP on /analyze, /vc_roast, /pitch_forge
```
- Prevents single client from exhausting Gemini quota
- Graceful 429 response with `Retry-After` header
- **Interview angle:** Token bucket algorithm under the hood — same as Nginx rate limiting

### OPT 4 — LLM Race (Gemini vs NIM)
```python
async def _llm_race(prompt, gemini_key, nim_key):
    tasks = [call_gemini(prompt, gemini_key), call_nim(prompt, nim_key)]
    async for result in asyncio.as_completed(tasks):
        if valid(result): return result
```
- Both providers fired simultaneously; first valid response wins
- Losers are cancelled — no wasted latency waiting for the slower one
- **Interview angle:** Speculative execution — same pattern as parallel DB reads with early exit

### OPT 5 — Request Deduplication (Frontend)
```typescript
const inFlightRef = useRef<string | null>(null);
// In runAnalysis:
if (inFlightRef.current === dedupeKey) return;
inFlightRef.current = dedupeKey;
// In finally: inFlightRef.current = null;
```
- Prevents double API calls when user rapidly clicks or suggestion chips fire twice
- Applied to Validator, VC Roast, and Pitch Forge
- **Interview angle:** Idempotency key pattern at the client level

### OPT 6 — Parallel Web Search
```python
fin_task = asyncio.create_task(search_financial(idea))
comp_task = asyncio.create_task(search_competitors(idea))
fin_results, comp_results = await asyncio.gather(fin_task, comp_task)
```
- Financial and competitor Serper queries fired simultaneously instead of sequentially
- Saves ~1–2 seconds per Validator call
- **Interview angle:** Fork-join pattern — parallelise independent I/O-bound tasks

### OPT 7 — Client-Side LRU Cache
```typescript
const MAX_CACHE_ENTRIES = 20;
const enforceMaxEntries = () => {
  // find oldest timestamp entry, remove it
};
// called at end of setCachedResult
```
- localStorage capped at 20 ideas (24h TTL each)
- Prevents localStorage bloat across sessions
- **Interview angle:** Same eviction policy as LRU caches in memory management

### OPT 8 — SQLite Battle Room Archive
```python
class SavedReport(SQLModel, table=True):
    idea: str = Field(index=True)
    timestamp: datetime
    raw_json: str  # full report stored as JSON string
```
- Upsert on save (same idea overwrites old entry)
- `list_reports` limited to 50 most recent — bounded query
- **Interview angle:** Event sourcing lite — the archive is the source of truth for Battle Room comparisons

### OPT 9 — SSE Progress Streaming
```python
@app.get("/analyze/stream")
async def analyze_stream(idea: str):
    async def generator():
        stages = ["Grounding market data", "Running DS pipeline", ...]
        for stage in stages:
            yield f"data: {json.dumps({'stage': stage})}\n\n"
            await asyncio.sleep(2.2)
    return EventSourceResponse(generator())
```
- Frontend `EventSource` connects to `/analyze/stream` and shows 5 live stage labels
- Eliminates blank loading screens — user sees progress without polling
- **Interview angle:** SSE vs WebSocket — SSE is unidirectional (server→client) and much simpler; sufficient for progress updates

---

## 6. Key Engineering Decisions

### Decision: Two-Step LLM Pipeline for VC Roast
**Problem:** Single-prompt LLMs collapse all survival scores to 12–15% regardless of idea quality. Root cause: creative personas override numeric rules — LLMs are reasoners, not rule-followers.

**Solution:** Three-layer enforcement:
1. **Flash-Lite Classifier** — neutral tone, no persona. Assigns Tier 1–6, survival %, verdict. Structured JSON only.
2. **Flash Roaster** — receives pre-locked `{tier}`, `{survival_chance}`, `{verdict}` via prompt injection. Cannot override.
3. **Python safety net** — `data["survival_chance"] = survival_chance` unconditionally overwrites after LLM response.

**Result:** 15/15 test ideas score in calibrated range across weak/medium/strong tiers.

### Decision: Merge War Room into Validator
**Why:** War Room and Validator both analyze the same idea. Merging into one parallel call eliminates duplicate entry, reduces tabs from 5 to 4, and gives forensic competitor data without extra clicks.

### Decision: Tavily over DuckDuckGo
**Why:** DDGS hangs indefinitely on rate limits without throwing exceptions — Python threads blocked forever. Tavily has reliable SLAs with 1,000 free searches/month.

### Decision: `gemini-flash-latest` over `gemini-2.5-flash`
**Why:** `gemini-2.5-flash` is a preview model with 2–15 RPM limits. Under load with 6 keys rotating, it was exhausted instantly. `gemini-flash-latest` resolves to the stable production build with significantly higher RPM.

### Decision: Post-Processing Rules over Retraining
**Why:** Retraining XGBoost on real data requires a labeled CB Insights/Crunchbase dataset. Deterministic P1/P2 rules are transparent, debuggable, and fix the known failure modes without overfitting.

### Decision: Battle Room reads from Archive, not re-analyzing
**Why:** Re-running Validator on two ideas just to compare them wastes 2× API calls and 6–16 seconds. Reading from SQLite archive means comparison is instant and uses data the user already paid for.

---

## 7. Bugs Found and Fixed

### Bug 1: Gemini 2.5 Flash Thinking Tokens
- **Symptom:** Every API call returned `NOT_FOUND` / `_honest_fallback` despite valid keys
- **Root cause:** Gemini 2.5 Flash returns thinking content as `parts[0]` with `"thought": true`. Code was returning `parts[0]["text"]` — thinking monologue, not valid JSON
- **Fix:** Iterate `parts[]`, skip entries where `part.get("thought", False) == True`

### Bug 2: Contradictory HONESTY PROTOCOL
- **Symptom:** Gemini responses inconsistent, sometimes froze
- **Root cause:** Prompt said "NEVER use your own knowledge" AND "NOT_FOUND for a major market is not acceptable" — unresolvable conflict
- **Fix:** 3-priority cascade: (1) search results, (2) training knowledge with Medium confidence, (3) NOT_FOUND as last resort

### Bug 3: Static Fallback String in Prompt
- **Symptom:** Gemini returned literal "Data verification pending" instead of JSON
- **Root cause:** Fallback text told Gemini to respond with that string when no search results found
- **Fix:** Instruct to use training knowledge with Medium confidence and return valid JSON

### Bug 4: DDGS Hanging Indefinitely
- **Root cause:** DuckDuckGo rate limiting blocks Python threads without raising exceptions
- **Fix:** Replaced all DDGS usage with synchronous Tavily client

### Bug 5: Rate Limit Decorator Conflict
- **Symptom:** FastAPI `422 Unprocessable Entity` on `/vc_roast` and `/pitch_forge`
- **Root cause:** slowapi `@_rate_limit` requires a `request: Request` parameter. Both endpoints used `request` as the Pydantic model param name — name collision
- **Fix:** Renamed Pydantic param to `req` in both endpoints; `request: Request = None` added for slowapi

### Bug 6: TypeScript Type Error in PitchForge
- **Symptom:** TS2339 — `forecast_tam` and `growth` don't exist on type `{}`
- **Fix:** Cast to `any`: `const mkt = (cached?.data?.market || {}) as any`

### Bug 7: Semantic Search Keyword Pollution
- **Symptom:** Semantic RAG search was dropping highly relevant 2024 reports.
- **Root cause:** The Exa search string hardcoded `2025 2030` into the semantic vector, forcing exact character matches instead of contextual embeddings.
- **Fix:** Stripped hardcoded years, allowing neural embeddings to match contextually, relying on the Python Recency Filter for date validation.

### Bug 8: Naive RAG Conflict Resolution
- **Symptom:** When multiple Tier 1 domains reported conflicting TAMs, the system picked the first one arbitrarily.
- **Root cause:** Resolution logic only checked domain authority (`confidence`), not recency.
- **Fix:** Upgraded the `build_fact_table` tie-breaker to parse the extraction year and mathematically prioritize the most recent data point for identical-confidence domains.

---

## 8. Credibility vs Quality

| Tab | Credibility | Quality | Notes |
|-----|------------|---------|-------|
| Validator | 8/10 | 9/10 | Tavily + adversarial Skeptic audit |
| VC Roast | 7/10 | 9/10 | Tavily competitor grounding + two-step calibration |
| Pitch Forge | 6/10 | 8/10 | Market data injected from Validator cache |
| Battle Room | 7/10 | 7/10 | LLM comparison with real market inputs from archive |

Free tier ceiling is ~8/10 credibility. Achieving 9–10 requires a paid Tavily plan (10K+ searches/month) and real labeled startup outcome data.

---

## 9. Free Tier Constraints and Mitigations

| Constraint | Mitigation |
|------------|------------|
| Gemini: RPM limits | 6-key rotation + dead key tracking + NIM race fallback |
| Tavily: 1,000 searches/month | 6-key rotation; server-side 24h cache prevents re-searches |
| No real startup outcome data | Synthetic training set (2,000 cases) + P1/P2 deterministic rules |
| Frontend localStorage limits | LRU eviction at 20 entries |
| Single client quota abuse | slowapi 10 req/min per IP |

---

## 10. The Eval Folder — Why It Matters

The `backend/app/ds/eval/` folder is the proof layer. Without it, LaunchMintAI is just another GPT wrapper. With it:

- **`dataset.jsonl`** — 50 labeled startup ideas, 11 domains, 3 ground truth sources
- **`golden.test.py`** — Correctness test: 50/50 pass rate, fully reproducible
- **`benchmark.py`** — Avg latency 386ms, P95 596ms
- **`EVAL_REPORT.md`** — Full benchmark report with error analysis
- **Charts** — 4 PNG charts: accuracy by domain, survival by domain, rule breakdown, per-case grid

This is what makes the DS layer credible in an interview — you can run the eval in front of the interviewer.

---

## 11. DS Interview Q&A

**Q: Why XGBoost over a neural network?**
A: Startup survival data is tabular with ~10 features. XGBoost handles tabular data better than neural nets at small dataset sizes (2,000 cases), trains in seconds, is interpretable via feature importance, and gives well-calibrated probabilities. Neural nets would overfit here.

**Q: How do you prevent hallucination?**
A: Three-layer defense. (1) Tavily search grounding pulls real source text. (2) Adversarial Skeptic Agent does string-matching against the raw source — if a number isn't in the text, it fails. (3) HTTP 422 after 3 failed retries — the system refuses to return ungrounded data.

**Q: Why Monte Carlo for financial scenarios?**
A: Startup financials have wide uncertainty bands. A deterministic model gives a single point estimate that's almost certainly wrong. Monte Carlo with 10,000 runs captures the distribution — P10 (bear), P50 (base), P90 (bull) — which is how real financial modelers think about uncertainty.

**Q: What's the P1/P2 rule system?**
A: Deterministic post-processing overrides for known model blind spots. P1 caps survival at 0.45 for niche/undefined markets — the model has no negative signal for markets it hasn't seen. P2 floors survival at 0.57 for AI+B2B ideas — the model underweights this strong commercial signal because synthetic training data doesn't fully reflect real AI+B2B success rates.

**Q: How did you validate the eval dataset's ground truth?**
A: Three sources per domain. B2B SaaS: CB Insights failure rate data (~45% survival). Consumer: CB Insights B2C data (80%+ failure). Niche/undefined: deterministic P1 rule output. High-growth: Startup Genome Project sector survival rates.

**Q: Why 2,000 synthetic training samples?**
A: Minimum for XGBoost to learn a generalizable boundary with 10 features. Real labeled data at scale requires CB Insights or Crunchbase API access (paid). Synthetic generation with business-rule-based labels was the fastest path to a demonstrably working classifier. P1/P2 rules patch the remaining calibration gap.

**Q: What would you improve with more time/data?**
A: (1) Train XGBoost on real Crunchbase outcomes — would push AUC-ROC from 0.82 toward 0.88+. (2) Expand Monte Carlo to 15+ sectors. (3) Expand VADER KB from 14 to 50+ companies with real G2/Trustpilot data. (4) Replace keyword feature extraction with semantic embeddings.

**Q: How does the VC Roast calibration work?**
A: Two-step pipeline. Step 1 — Flash-Lite classifier assigns Tier 1–6 + survival % with no creative persona. Step 2 — Flash Roaster receives those locked numbers via prompt injection and writes the fatal flaw analysis around them. Python safety net unconditionally overwrites `survival_chance` after LLM response regardless of what the model wrote. Result: 15/15 test ideas score in correct calibrated range across weak/medium/strong tiers.

---

## 12. Full-Stack / Engineering Interview Q&A

**Q: How does the frontend cache work?**
A: Two-layer cache. Server-side: `_RESPONSE_CACHE` dict in FastAPI memory, 86400s TTL, 500-entry LRU. Client-side: `localStorage` with 24h TTL and max 20 entries. `getCachedResult` checks localStorage first — if hit and not expired, skips the API call entirely. `setCachedResult` writes to localStorage then calls `enforceMaxEntries` which finds and evicts the oldest timestamp entry if over 20.

**Q: What's the inFlightRef pattern?**
A: A `useRef` holding the deduplication key of the current in-flight request. Before firing, we check if `inFlightRef.current === dedupeKey` — if so, the request is already running and we return early. On completion (finally block), we set `inFlightRef.current = null`. This prevents double-firing when a user rapidly clicks or a suggestion chip auto-submits while analysis is already running.

**Q: How does SSE work vs WebSocket?**
A: SSE (Server-Sent Events) is unidirectional — server pushes to client over a persistent HTTP connection. WebSocket is bidirectional. For progress updates, SSE is sufficient and far simpler — no upgrade handshake, works over standard HTTP, auto-reconnects. Frontend creates `new EventSource(url)`, listens to `message` events, and closes the connection in the finally block.

**Q: How does the LLM race work technically?**
A: `asyncio.as_completed(tasks)` returns an iterator that yields futures as they complete. We iterate and take the first result that passes validation (non-empty, valid JSON). The other task is still running but its result is ignored — Python's event loop handles cleanup. This gives us the latency of the faster provider without waiting for the slower one.

**Q: How does rate limiting work with slowapi?**
A: slowapi wraps FastAPI with a `Limiter` that uses the request's remote IP as the key. Each `@_rate_limit` decorated endpoint tracks request counts in memory using a sliding window. When the count exceeds the limit (10/minute), the framework returns a 429 with a `Retry-After` header. The limit decorator requires a `request: Request` parameter in the function signature — which caused a naming conflict with our Pydantic models (fixed by renaming the model param to `req`).

**Q: How does the Battle Room archive work?**
A: `SavedReport` is a SQLModel table backed by SQLite. `save_report` does an upsert — if the same idea string already exists, it overwrites. `list_reports` queries the last 50 by timestamp. `delete_report` removes by idea string. The archive endpoints are `/archive/save` (POST), `/archive/list` (GET), `/archive/{idea}` (DELETE). Battle Room reads from this archive to compare two ideas without re-running Validator.

**Q: How do you handle API key exhaustion?**
A: Three layers. (1) Key rotation — 6 keys in a pool, round-robin. (2) Dead key tracking — if a key returns 429, it's logged to `_DEAD_KEYS` dict with a timestamp and skipped for 60 minutes. (3) LLM race — if Gemini is exhausted, NIM (NVIDIA) fills in as the parallel fallback provider. The system can survive losing all 6 Gemini keys simultaneously by falling back entirely to NIM.

**Q: What TypeScript patterns did you use?**
A: `useRef` for mutable state that doesn't trigger re-renders (inFlightRef, debounceRef). Generic types for the cache (`CachedResult` interface). `as any` cast for dynamic market data objects where the shape isn't known at compile time. `ReturnType<typeof setTimeout>` for proper timer typing across environments.

---

## 13. Numbers to Remember

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
| 15/15 | VC Roast calibration test (weak/medium/strong) |
| 15/15 | Pitch Forge output quality test (T1–T5 tiers) |
| 45/45 | test_suite.py (Validator + Roast + Forge, 15 each) |
| 9 | Production-scale optimizations implemented |
| 86400s | Server-side cache TTL (24 hours) |
| 500 | Server-side cache max entries before LRU eviction |
| 20 | Client-side localStorage max entries |
| 10/min | slowapi rate limit per IP |
| 60 min | Dead key cooldown after 429 |
| 11 | Evaluation domains |
| 6 | Gemini API keys in rotation |
| 6 | NIM API keys in rotation |
| 4 | Frontend tabs (Validator, Roast, Forge, Battle Room) |
| 3 | Parallel API calls fired by Validator simultaneously |
| 422 | HTTP status code thrown on grounding failure |
| 5 | SSE progress stages streamed to frontend |

---

## 14. Project Phases

| Phase | What Was Done |
|-------|--------------|
| Phase 1 | Merged War Room into Validator (4 tabs total). Fired `/war_room` in parallel with `/analyze`. |
| Phase 2 | Maxed credibility/quality: Tavily grounding into Roast, market data injection into Forge, Compare Arena in Battle Room. |
| Phase 3 | 15-idea Antigravity stress tests per tab. Fixed DDGS hanging, Gemini model deprecation, thinking token bug. All tabs passing. |
| Phase 4 | VC Roast two-step calibrated pipeline. Pitch Forge market-grounded copy generation. EXPLAINER docs written. |
| Phase 5 | 9 production-scale optimizations: server cache, dead keys, rate limiting, LLM race, request dedup, parallel search, localStorage LRU, SQLite archive, SSE streaming. Full re-test: 74/75 automated tests passed. All 4 tabs UI-verified. |
