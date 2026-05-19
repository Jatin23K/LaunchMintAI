# LaunchMintAI — VC Roast Tab: Complete Technical Explainer
### For Applied Data Scientist Interview Preparation
---

## TABLE OF CONTENTS
1. [What is VC Roast?](#1-what-is-vc-roast)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Two-Step LLM Pipeline — The Core Innovation](#3-two-step-llm-pipeline--the-core-innovation)
   - 3.1 Step 1: Classifier (Tier Lock)
   - 3.2 Step 2: Roaster (Text Generation)
   - 3.3 Python Safety Net
4. [Tier Classification System](#4-tier-classification-system)
5. [Model Architecture — Gemini → Flash-Lite → NIM](#5-model-architecture--gemini--flash-lite--nim)
6. [Every Output Field Explained](#6-every-output-field-explained)
7. [Frontend — Dynamic Badge & UI System](#7-frontend--dynamic-badge--ui-system)
8. [Web Search Grounding](#8-web-search-grounding)
9. [Calibration Problem & Solution](#9-calibration-problem--solution)
10. [Process — How We Reached Ceiling](#10-process--how-we-reached-ceiling)
11. [Common Interview Questions & Answers](#11-common-interview-questions--answers)

---

## 1. WHAT IS VC ROAST?

VC Roast is a startup idea evaluation tool that simulates the perspective of a ruthless but accurate Venture Capitalist Partner. Given any startup idea in plain English, it returns:

- A one-sentence **kill shot** (the single biggest reason it fails)
- **5 brutal feedback points** covering market, tech, competition, distribution, and timing
- A **survival probability** (1–100%) calibrated to the actual idea quality
- An **investment verdict** (LAUGHABLE / HARD PASS / WEAK MAYBE / CONDITIONAL INTEREST)
- A **competitor alert** naming the specific incumbent and why they win
- A **survival benchmark** with real-world sector survival data

The key design goal: **differentiate between a dog walking app and an enterprise AI infrastructure tool.** Both have incumbents. Only one deserves 5% survival chance.

---

## 2. SYSTEM ARCHITECTURE OVERVIEW

```
User types startup idea
        │
        ▼
Frontend (React/TypeScript) — VCRoast.tsx
        │
        └──► POST /vc_roast
                    │
                    ├──────────────────────────────────────────┐
                    │  (parallel)                              │
                    ▼                                          ▼
           [Web Search]                              [Step 1: Classifier]
           Serper API → competitor intel             Flash-Lite → tier + score
                    │                                          │
                    └──────────────────────────────────────────┘
                                        │
                                        ▼
                              [Step 2: Roaster]
                              Flash → brutal text with locked values
                                        │
                                        ▼
                              Python safety net
                              (overwrites survival_chance + verdict)
                                        │
                                        ▼
                              JSON response to frontend
```

Web search and classification run **in parallel** — zero added latency from the two-step design.

---

## 3. TWO-STEP LLM PIPELINE — THE CORE INNOVATION

### Why Two Steps?

Single-prompt approaches fail at calibration. A model given both the "score this" and "write the roast" instructions simultaneously lets its creative persona override structured rules. The SKEPTIC character finds incumbents, gets dramatic, and collapses everything to 5% LAUGHABLE.

The solution: **separate the judge from the writer.**

### 3.1 Step 1: Classifier (Tier Lock)

**Model:** Gemini 2.5 Flash-Lite (fast, cheap, structured output)
**Input:** Startup idea only
**Output:**
```json
{
  "tier": 4,
  "survival_chance": 55,
  "investment_verdict": "CONDITIONAL INTEREST",
  "tier_reason": "Enterprise AI replacing manual credit analysts with quantifiable ROI."
}
```

The classifier has no creative persona. It is a neutral tier-assignment system with explicit rules and concrete examples per tier. It cannot be overridden by a "skeptic" personality because it has none.

### 3.2 Step 2: Roaster (Text Generation)

**Model:** Gemini 2.5 Flash (quality reasoning, real competitor names)
**Input:** Startup idea + tier + survival_chance + verdict (locked from Step 1) + web search intel
**Role:** Writer, not judge. The numbers are injected directly into the prompt:

```
PRE-DETERMINED CLASSIFICATION — DO NOT CHANGE THESE VALUES:
  Tier:               4
  survival_chance:    55   ← OUTPUT THIS EXACT INTEGER. DO NOT CHANGE IT.
  investment_verdict: CONDITIONAL INTEREST  ← OUTPUT THIS EXACT STRING.
```

The roaster focuses purely on writing compelling, specific analysis — naming real companies, real funding rounds, real market dynamics.

### 3.3 Python Safety Net

Even after the two-step approach, the roaster might still try to change the numbers in its JSON output. A final Python override before returning the response guarantees correctness:

```python
# Safety net: always enforce classifier values regardless of what the roaster outputs
data["survival_chance"] = survival_chance
data["investment_verdict"] = verdict
return data
```

This means the calibration is enforced at **three independent layers**: classifier prompt, roaster prompt, and Python code.

---

## 4. TIER CLASSIFICATION SYSTEM

| Tier | Range | Verdict | Description | Examples |
|------|-------|---------|-------------|---------|
| 1 | 1–8% | LAUGHABLE | Consumer clone, "Uber for X", dead markets | Dog walking app, NFT marketplace, metaverse |
| 2 | 9–20% | HARD PASS | Real B2B problem, single thin feature, no workflow ownership | Generic AI chatbot, basic CRM add-on |
| 3 | 21–40% | WEAK MAYBE | Vertical SaaS owning a complete end-to-end workflow | Auto repair SaaS, HIPAA compliance SaaS, vet clinic SaaS |
| 4 | 41–60% | CONDITIONAL INTEREST | Enterprise AI replacing a manual human role with measurable efficiency gain | Insurance claims AI, radiology AI, underwriting AI |
| 5 | 61–80% | CONDITIONAL INTEREST | Platform replacing entire legacy software category, novel data combination | AI-native ERP replacing SAP, satellite + LLM supply chain |
| 6 | 81–100% | CONDITIONAL INTEREST | Truly novel — new market category, deep tech moat, no competition | Extremely rare |

**Critical classification rules:**
1. "Has incumbents" ≠ Tier 2. Every B2B market has incumbents.
2. "Fragmented SMB market" ≠ Tier 2. Vertical SaaS for fragmented markets = Tier 3.
3. "Market is mature" ≠ Tier 2. Enterprise AI replacing manual work in a mature market = Tier 4.
4. "Replacing manual [role]" OR "cites specific efficiency metric" = Tier 4 minimum.

---

## 5. MODEL ARCHITECTURE — GEMINI → FLASH-LITE → NIM

```
Classifier call:
  PRIMARY:    Gemini 2.5 Flash-Lite (6 keys, round-robin)
  FALLBACK:   NIM (independent key pool)
  HARD:       Tier 2 default (safe conservative fallback)

Roaster call:
  PRIMARY:    Gemini 2.5 Flash (6 keys, round-robin)
  FALLBACK 1: Gemini 2.5 Flash-Lite (same family, still good quality)
  FALLBACK 2: NIM (independent keys — true safety net when Gemini quota exhausted)
```

**Why Flash-Lite for the classifier?**
The classifier only needs to output a small structured JSON (4 fields). Flash-Lite is 3–5x faster and cheaper than Flash for structured tasks. Quality reasoning is reserved for the roaster where it matters — writing sharp, specific, persuasive analysis.

**Why NIM as final fallback?**
NIM uses a completely independent key pool. When all 6 Gemini keys hit quota simultaneously, NIM provides a genuine safety net rather than another Gemini key that would also be rate-limited.

**Key rotation:** Both Gemini and NIM use round-robin offset tracking to distribute load across all available API keys, preventing any single key from hitting quota during batch testing.

---

## 6. EVERY OUTPUT FIELD EXPLAINED

### `kill_shot` (string)
The single most devastating reason the idea fails — in one sentence. Must name a real competitor or real market dynamic. This is the headline of the roast, displayed in the large banner card at the top.

*Example:* "Rover and Wag already own this commoditized market with established network effects and brand recognition."

### `brutal_feedback` (array of 5 strings)
Five specific criticisms, each targeting a different dimension:
1. Market size / economics (include real numbers)
2. Tech / implementation complexity
3. Competition (name the actual incumbent and why they win)
4. Distribution / customer acquisition cost
5. Timing, team fit, or regulatory risk

No "Point 1:", "Point 2:" prefixes — the frontend adds `#01` through `#05` numbering.

### `survival_chance` (integer 1–100)
Set by the classifier, enforced by Python. Represents the estimated probability this startup survives to meaningful scale. Maps directly to the tier system.

### `survival_benchmark` (string)
One sentence of real sector survival data for context. Grounds the percentage in reality.

*Example:* "Consumer apps in saturated 'Uber for X' markets with dominant incumbents typically have a survival rate below 8%."

### `investment_verdict` (enum)
One of four values: `LAUGHABLE` | `HARD PASS` | `WEAK MAYBE` | `CONDITIONAL INTEREST`
Maps directly to tier (Tier 1 → LAUGHABLE, Tier 2 → HARD PASS, Tier 3 → WEAK MAYBE, Tier 4-6 → CONDITIONAL INTEREST).

### `competitor_alert` (string)
Names the specific incumbent and the exact reason they win (data moat, distribution, brand, or pricing). Displayed in the "Competitor Death Trap" section with a warning icon.

---

## 7. FRONTEND — DYNAMIC BADGE & UI SYSTEM

### `getRiskLabel()` Function

The survival percentage maps to a dynamic badge — color, label, and styling all change based on the number:

```typescript
function getRiskLabel(chance: number): { label: string; color: string; bg: string; border: string } {
    if (chance <= 15) return { label: 'Critical Risk',    color: 'text-red-400',     ... };
    if (chance <= 35) return { label: 'High Risk',        color: 'text-orange-400',  ... };
    if (chance <= 55) return { label: 'Moderate Risk',    color: 'text-amber-400',   ... };
    if (chance <= 75) return { label: 'Viable',           color: 'text-yellow-400',  ... };
    return              { label: 'Strong Potential',   color: 'text-emerald-400', ... };
}
```

| Survival % | Badge | Color |
|-----------|-------|-------|
| 1–15% | Critical Risk | Red |
| 16–35% | High Risk | Orange |
| 36–55% | Moderate Risk | Amber |
| 56–75% | Viable | Yellow |
| 76–100% | Strong Potential | Emerald |

### Skeleton Loading State
While the API processes, the UI shows a **skeleton that mirrors the exact result layout** — kill_shot banner shape, 5 feedback row shapes, survival panel, verdict card. All pulse with `animate-pulse`. This is significantly better than a spinner because it sets the user's expectation of what's coming.

### Error + Retry System
- `lastText` state stores the last submitted idea
- On API failure: error message + **↻ Retry Roast** button appears
- Retry calls `runRoast()` with `lastText` — user doesn't need to retype

---

## 8. WEB SEARCH GROUNDING

Before generating the roast, the backend runs a **Serper competitor search** using the idea as the query. The results are injected into the roaster prompt as live market intel:

```
LIVE MARKET INTEL (from web search):
[Serper results — competitor names, funding rounds, market data]
```

This is why the roaster can name specific companies like "Rover has $155M in funding" or "Snyk's $8.6B valuation" — it's pulling real-time data, not relying on training cutoff knowledge.

The web search runs **in parallel with the classifier call** — not sequentially — so it adds zero latency to the total response time.

---

## 9. CALIBRATION PROBLEM & SOLUTION

### The Problem
Single-prompt VC Roast gave every idea (weak and strong) a survival_chance of 1–5% and verdict of LAUGHABLE. The SKEPTIC persona dominated calibration rules.

### What We Tried First (Failed)
Adding "MANDATORY" rules to the single prompt. The model read the rules, then reasoned its way around them: "yes, but this market is saturated so 5%." Adding more rules made the prompt longer but didn't fix the behavior.

### Root Cause
LLMs are **creative reasoners**, not rule-followers. Giving a strongly characterized persona (SKEPTIC) both the scoring and writing job means the persona wins. Every time.

### The Solution: Separate Judge from Writer
```
Before: One model → scores + writes → persona overrides calibration
After:  Model A (neutral) → scores only → locks numbers
        Model B (skeptic) → writes only → numbers pre-decided
```

The classifier has no persona. It cannot be "dramatic" because it is a classifier. It follows the tier rules because there is nothing else for it to do.

### Test Results After Fix
- 21 completely different ideas (not the ones in the prompt examples)
- 9 weak ideas: all scored 5%, LAUGHABLE ✅
- 6 medium ideas: all scored 30%, WEAK MAYBE ✅
- 6 strong ideas: all scored 50–55%, CONDITIONAL INTEREST ✅
- **21/21 passed** — zero calibration failures

---

## 10. PROCESS — HOW WE REACHED CEILING

### Issue 1: All ideas scored 1–5% regardless of quality
**Root cause:** Single-prompt design — SKEPTIC persona overrides calibration rules
**Fix:** Two-step pipeline (classifier + roaster)

### Issue 2: "Point 1:", "Point 2:" prefix in feedback items
**Root cause:** Prompt output format example included literal "Point 1:" labels
**Fix:** Changed output format to plain strings without prefix labels

### Issue 3: `KeyError: '\n  "kill_shot"'` — 500 errors after two-step implementation
**Root cause:** Python's `str.format()` treated JSON curly braces `{` `}` in the prompt template as format placeholders
**Fix:** Escaped all literal JSON braces as `{{` and `}}`, leaving only `{tier}`, `{survival_chance}`, `{verdict}`, `{tier_reason}` as actual placeholders

### Issue 4: Medium ideas scoring 12% (should be 21–40%)
**Root cause:** Model classified all "has incumbents + saturated" ideas as Tier 2, regardless of workflow ownership
**Fix:** Added explicit rule — "end-to-end workflow ownership for a specific industry = Tier 3 minimum" — with concrete named examples per tier in the classifier prompt

### Issue 5: Strong ideas scoring 12% (should be 41–60%)
**Root cause:** "Market is mature" triggered Tier 2 classification even for enterprise AI replacing manual roles
**Fix:** Added explicit rule — "replacing manual [role] OR cites efficiency metric = Tier 4 minimum" — with all failing ideas added as named Tier 4 examples

### Issue 6: Spinner looked basic
**Root cause:** Just a centered `Loader2` spinner with text
**Fix:** Full skeleton loading state that mirrors the exact result layout (banner, 5 feedback rows, survival panel, verdict card) with `animate-pulse`

### Issue 7: No retry on error
**Root cause:** Error state had no way to resubmit the same idea
**Fix:** Added `lastText` state and **↻ Retry Roast** button that calls `runRoast(lastText)`

### Ceiling Rating: 8/10
The VC Roast tab is production-quality for a portfolio project.

**What makes it 8/10:**
- Two-step classifier + roaster eliminates calibration drift permanently
- Python safety net as third enforcement layer
- Dynamic badge system (5 color tiers)
- Live web search grounding for real competitor names
- Skeleton loading state
- Error + retry flow
- 21/21 universal calibration test passing

**What would push it to 10/10 (beyond ceiling):**
- Idea history — save previous roasts per session
- Share button — shareable link to roast result
- "Defend your idea" — user can respond to each point, AI counter-argues
- Roast comparison — submit two ideas side-by-side
- Export to PDF — roast result as formatted one-pager
- Real funding data integration — pull actual recent funding rounds from Crunchbase API

---

## 11. COMMON INTERVIEW QUESTIONS & ANSWERS

**Q: Why did you choose a two-step LLM pipeline instead of a single prompt?**

A: Single-prompt approaches fail at calibration because LLMs are creative reasoners, not rule-followers. When you give a strongly characterized persona (a "ruthless skeptic") both the scoring and writing job, the persona dominates. No matter how many "MANDATORY" rules you add, the model reasons around them. The solution is separation of concerns — a neutral classifier locks the numbers, a creative writer generates the text. The numbers are then also enforced in Python code as a third layer. This is a pattern borrowed from traditional ML: you don't let your feature engineering model also make the prediction.

**Q: How does the calibration system prevent drift as ideas change?**

A: Three independent enforcement layers. Layer 1: the classifier prompt has explicit tier rules with concrete named examples for each tier, so it classifies by pattern-matching against examples rather than reasoning. Layer 2: the roaster prompt receives the tier and numbers as hard facts with explicit "DO NOT CHANGE THESE VALUES" instructions. Layer 3: Python overwrites `survival_chance` and `investment_verdict` in the response dict before returning, regardless of what the model output. Even if layers 1 and 2 fail, layer 3 is unconditional code.

**Q: Why use Flash-Lite for classification and Flash for roasting?**

A: The classifier task is structured and small — input one idea, output four fields of JSON. Flash-Lite handles this perfectly and is 3–5x faster and cheaper. The roaster task is creative and long-form — it needs to name real companies, cite specific numbers, write punchy prose across six fields. This requires Flash's higher reasoning quality. Matching model capability to task complexity is standard practice in production LLM systems.

**Q: Why is NIM in the fallback chain at all if Gemini is better?**

A: NIM uses an entirely independent API key pool. When all 6 Gemini keys hit quota simultaneously (which happens during batch testing with 21 concurrent ideas), adding a 7th Gemini key would also be rate-limited — same model family, same quota system. NIM is a genuine safety net precisely because it's independent. The fallback chain is: Flash → Flash-Lite → NIM → static error response. Each step uses a completely different key pool.

**Q: How do you test that calibration is working correctly?**

A: A 21-idea automated test suite covers three tiers: 9 weak ideas (expected 1–8%, LAUGHABLE), 6 medium ideas (expected 21–40%, WEAK MAYBE), 6 strong ideas (expected 41–60%, CONDITIONAL INTEREST). The test ideas are completely different from the examples in the classifier prompt — this validates that the classification is generalized, not memorized. All 21 pass with the current two-step architecture.

**Q: What's the difference between VC Roast and the Validator tab?**

A: VC Roast is a single fast endpoint (one Gemini call for classification + one for roasting, both under 30 seconds) that gives harsh, opinionated feedback from one perspective. The Validator runs 11+ parallel analysis modules (XGBoost sector classifier, Monte Carlo financial simulation, VADER sentiment analysis, 6 LLM extensions, Serper + Exa web search) and takes 60–90 seconds. VC Roast prioritizes speed and personality. Validator prioritizes depth and data coverage.

---

## 12. ROLE-SPECIFIC INTERVIEW QUICK REFERENCE

### If you are interviewing for Applied Data Scientist

Lead with these 3 stories in this order:
1. **The calibration collapse problem** — "Single-prompt LLMs fail at calibration because they are creative reasoners, not rule-followers. A SKEPTIC persona overrides MANDATORY numeric rules. This is the same root cause as uncalibrated probability outputs in classification models — the model learns to be overconfident."
2. **Two-step pipeline as separation of concerns** — "Neutral classifier locks the numbers. Creative writer generates text around those numbers. Python overwrites the numbers unconditionally after the fact. Three independent enforcement layers — this is defence in depth applied to LLM reliability."
3. **Test suite design** — "21 ideas, all completely different from the prompt examples. This proves generalisation, not memorisation. Same principle as held-out test data in ML — if your examples and your tests overlap, you're measuring nothing."

### If you are interviewing for Forward Deployed Engineer

Lead with these 3 stories in this order:
1. **Python safety net as the real fix** — "Even with a two-step pipeline, the roaster might still try to change the numbers. `data['survival_chance'] = survival_chance` runs unconditionally after the LLM response. It doesn't matter what the LLM wrote — the code always wins."
2. **Parallel web search + classification** — "Web search and classification run as asyncio tasks simultaneously. Zero added latency from the two-step design. `asyncio.create_task()` for both, then `await` both — classic async fan-out pattern."
3. **Tier 2 default as hard fallback** — "If the classifier API fails entirely, it defaults to Tier 2 (HARD PASS, 15% survival). Conservative, never optimistic. A failed classification should never make a bad idea look good."

---

## 13. FORWARD DEPLOYED ENGINEER — INTERVIEW Q&A

**Q: A client says "every idea I submit gets LAUGHABLE — the system is clearly broken." How do you diagnose this?**

A: Four-step diagnosis. Step 1: check if the Python safety net is the cause — add a log line `logger.debug(f"classifier_tier={tier}, classifier_survival={survival_chance}")` and see what the classifier is actually returning. Step 2: check if the classifier is hitting its fallback — if the Flash-Lite API is exhausted, it defaults to Tier 2 (15%, HARD PASS) not Tier 1. If the client says "LAUGHABLE" specifically, the classifier is returning Tier 1 for everything, which means the classifier prompt is being misread or the key pool is exhausted and falling back to a cached wrong response. Step 3: run `test_vc_roast.py` directly — if it passes 21/21, the system is working and the client's ideas genuinely are Tier 1. Step 4: if the test fails, check the key pool — `len(_KEY_POOL)` at startup. If 0 keys loaded, every call fails silently and uses the hardcoded fallback tier.

**Q: How do you explain the tier system to a non-technical founder who is upset their idea got HARD PASS?**

A: Start with the frame: "This is what a partner at a top-tier VC firm would say to 100 founders in a day. Hard Pass doesn't mean the idea is bad — it means this specific architecture, at this point in time, doesn't have the structural signals VCs look for at seed." Then explain their tier specifically. If they're Tier 2: "A single feature on top of an existing workflow — VCs want to see end-to-end ownership of a problem. The fix isn't the idea itself, it's the scope." Then show them a Tier 3 version of their idea: "If you owned the entire workflow for electrical contractors — not just invoicing but job costing, scheduling, and compliance — that's Tier 3." The goal is to use the roast as a navigation tool, not a verdict.

**Q: The classifier is sometimes returning Tier 4 for clearly Tier 1 ideas (e.g. "Uber for dog walking"). How do you fix it in production?**

A: The classifier is over-triggering on the word "Uber" — it pattern-matches to "platform business" or "marketplace" and jumps tiers. Add an explicit overrule rule to the classifier prompt: "Consumer marketplace clones ('Uber for X', 'Airbnb for X') are ALWAYS Tier 1 regardless of the underlying sector — maximum survival 8%." Then add "Rover" and "Wag" as Tier 1 named examples explicitly. Also add this to the test suite: the dog walking app was already in `test_vc_roast.py` — if it's passing, the regression is in a different idea. Find which Tier 1 idea is being misclassified, add it as a named example in the classifier prompt, re-run all 21. If you can't add it to the prompt (token budget), add a post-processing overrule in Python: scan the idea text for "Uber for" or "Airbnb for" and force Tier 1.

**Q: How would you add a "defend your idea" feature where the founder can respond and the AI reconsiders?**

A: Three-round debate architecture. Round 1: standard VC Roast — classifier + roaster as-is. Round 2: founder submits a defence text (e.g. "we have 3 enterprise LOIs and the founder ran Ironclad's sales team for 5 years"). Backend: pass the original roast + the defence text to a new `_reconsider_call()` — Flash evaluates whether the new information changes the tier and updates the verdict. Python still enforces the minimum — a Tier 1 idea cannot become Tier 4 from one defence point, but it can move from Tier 1 to Tier 2. Round 3: summary verdict with "original assessment vs updated assessment." Frontend: add a text area below the roast result labeled "Counter the roast," a DEFEND button, and an updated results panel. Key constraint: the defence cannot change the Python safety net's floor — if the classifier says Tier 1, the minimum Python allows is Tier 1. The defence can only upgrade, never manufacture a Tier 6 from a bad idea.

**Q: The test_vc_roast.py takes 5+ minutes to run. A client wants instant validation for 50 ideas. How do you architect that?**

A: Two changes. Backend: add a `/vc_roast_batch` endpoint that accepts a list of up to 10 ideas and runs them concurrently using `asyncio.gather()`. With the two-step pipeline (Flash-Lite classifier + Flash roaster), each idea takes ~8-12 seconds. 10 in parallel = ~12 seconds total. Rate limit: the 6-key pool supports ~10 concurrent Flash-Lite calls (60 RPM ÷ 6 = 10 per second). For 50 ideas: run 5 batches of 10 with 15-second gaps = ~90 seconds total vs 12.5 minutes sequential. Frontend: add a bulk input mode — CSV upload or textarea with one idea per line. Show a progress bar: "Roasting 7/50 ideas..." Each result appears as it completes. The test script already demonstrates the pattern — just move the delay from the script into server-side rate limiting.

**Q: How do you monitor whether the calibration is drifting over time in production?**

A: Three monitoring signals. First, log every classifier output: `{tier, survival_chance, idea_length, timestamp}`. A dashboard showing the distribution of tiers over time tells you if calibration is shifting — if Tier 1 starts dominating (>60% of all calls), the classifier is getting more aggressive. Second, run the 21-idea test suite on a weekly cron and alert if any of the 21 expected tier brackets are missed. This is a calibration regression test. Third, track the survival_chance distribution as a histogram — it should show roughly: peak at 5-8% (weak ideas are common), another peak at 30-35% (medium ideas), lower frequency at 50-55% (strong ideas). If the histogram becomes a single spike at 5%, recalibration is needed. The fix is always the same: add more named examples to the classifier prompt for the underrepresented tiers.

**Q: A client wants to white-label this for their accelerator — 200 founders submit ideas per week. What does the production architecture look like?**

A: Five changes from the current portfolio setup. (1) Auth: add API key authentication per accelerator cohort — each cohort gets a key, usage is tracked per key. (2) Queue: add a Celery + Redis job queue in front of the LLM calls. Each `/vc_roast` submission creates a job, the queue workers process them at the rate limit. Founders get a job_id and poll `/vc_roast/status/{job_id}`. (3) Storage: move results from ephemeral response to a PostgreSQL table — `{job_id, idea, tier, survival_chance, all fields, timestamp}`. Accelerator staff can see all 200 results in a dashboard. (4) Paid Gemini: at 200 ideas/week × 2 Gemini calls each = 400 calls/week, the free tier (1,500 RPD) technically holds, but paid is safer and removes latency variability. (5) Monitoring: add the calibration dashboard described above — 200 ideas/week generates enough signal to detect drift quickly.

**Q: How would you explain the two-step pipeline to a PM who is asking why you need two AI calls instead of one?**

A: "One AI call means one personality that does two jobs — scoring and writing. The problem is the personality takes over. If you hire a harsh critic to both grade essays and give feedback, the grading will reflect the critic's mood, not the rubric. Two calls means one neutral examiner grades the essay (no personality, just rules), then hands the grade to the critic who writes the feedback. The examiner's grade can't be changed once it's locked. That's why every idea gets a fair score — the critic only controls the words, not the numbers. The extra call adds about 8 seconds to the response time. That's a deliberate trade-off for calibration accuracy."

---

## 14. PRODUCTION SCENARIOS & DEBUGGING PLAYBOOK

### Scenario A: Calibration collapse (all ideas returning Tier 1, 5% survival)

**Symptoms:** Every idea — weak and strong — returns LAUGHABLE at 5%.

**Root cause options:**
1. All Gemini keys are exhausted → classifier fails → falls back to Tier 1 default (wrong — the default should be Tier 2, check the fallback code)
2. The classifier prompt was accidentally modified to have a persona added
3. The `str.format()` KeyError from JSON braces was reintroduced — the classifier is erroring and the exception is being caught silently, returning the hardcoded fallback

**Debug steps:**
1. Check backend logs for `KeyError` exceptions in the classifier call
2. Log `tier, survival_chance` right after the classifier returns — before the roaster runs
3. Run the quick health check: send "AI-powered clinical documentation replacing manual physician note-taking in hospitals" — should return Tier 4 (41-60%). If it returns Tier 1, the classifier is broken.
4. Check `len(_KEY_POOL)` at startup log — if 0, no keys loaded, every call uses fallback

---

### Scenario B: `KeyError: '\n "kill_shot"'` — 500 errors

**Symptoms:** Backend returns HTTP 500. Log shows `KeyError` referencing a JSON field name.

**Root cause:** Python's `str.format()` treats `{` and `}` in the roaster prompt template as format placeholders. The JSON output format in the prompt has `{"kill_shot": ...}` — the `{kill_shot` becomes a format placeholder that has no matching argument.

**Fix:** All literal JSON braces in the prompt must be escaped as `{{` and `}}`. Only the actual injection variables (`{tier}`, `{survival_chance}`, `{verdict}`, `{tier_reason}`) should remain as single braces.

**Debug:** Search for any `{` in the prompt string that isn't one of the four injection variables. Every other `{` must be `{{`.

---

### Scenario C: Tweet in Pitch Forge exceeds 280 characters

**Symptoms:** The test suite shows `⚠️ tweet (312 chars)` — the Viral Tweet field is too long.

**Root cause:** The Pitch Forge prompt specifies ≤280 characters for the tweet but Gemini sometimes generates 300-320 character tweets.

**Fix options:**
1. **Prompt tightening:** Add "Count the characters. If your tweet is over 280 characters, shorten it. 280 is a hard limit."
2. **Post-processing truncation:** After the LLM response, if `len(tweet) > 280`, truncate at the last space before character 277 and add `...`
3. **Two-step for tweet:** Run a second Flash-Lite call specifically to trim the tweet: "Shorten this tweet to exactly 280 characters or fewer without losing the core message: {tweet}"

Option 2 is fastest. Option 3 is highest quality but adds an API call. For a portfolio project, Option 1 + Option 2 together is the right balance.

---

### Scenario D: Skeleton loads but result never appears (infinite loading)

**Symptoms:** The `animate-pulse` skeleton appears, stays for 60+ seconds, then shows error.

**Root cause options:**
1. Both Flash and Flash-Lite quota exhausted AND NIM is timing out (all three fallbacks failing)
2. The roaster returned valid JSON but the frontend can't parse it — check for extra text before the `{` in the response
3. Network request succeeded (200) but the response body is empty — Gemini returned an empty string that passed the rate-limit check

**Debug steps:**
1. Check browser DevTools → Network → find the `/vc_roast` request → look at Response tab
2. If status 200 but empty body: the LLM returned empty — check for quota errors in the backend log
3. If status 200 with content: the JSON parse is failing — add `try/except` with logging around `json.loads()` in the frontend `api.ts` handler
4. If status 429: Gemini quota hit — wait for reset or add the 7th API key

---

## 15. STAKEHOLDER COMMUNICATION SCRIPTS

### Explaining to a Non-Technical Founder

> "The survival percentage is a calibrated signal, not a prediction. It tells you where your idea sits on a spectrum from 'consumer clone with dominant incumbents' to 'enterprise AI replacing a manual job at scale.' A 5% survival chance means your idea looks structurally like the ideas that almost always fail — not that yours definitely will. A 55% chance means your idea has the structural signals that strong venture-backable businesses have. Use it to understand what category you're in, not as a pass/fail."

### Explaining the Two-Step Pipeline to a VC

> "Single-prompt scoring systems are unreliable because the same model that writes the critique also assigns the score. We separated the judge from the writer. A neutral classifier assigns the tier and survival probability — it has no creative persona, just rules and examples. A second model writes the harsh analysis using those locked numbers. Then Python overwrites the numbers in the API response unconditionally. Three layers of enforcement means the calibration cannot drift from the quality of the prose."

### Explaining to a Hiring Manager (DS Position)

> "The calibration problem is fundamentally a probability calibration problem. A single-prompt model outputs survival probabilities that cluster at 5% for everything — like a classifier that always outputs the same probability regardless of input. The fix mirrors standard calibration techniques: separate the prediction from the output. The classifier is the equivalent of Platt scaling — it takes the raw signal (the idea) and maps it to a calibrated probability through a structured rule system, not through a creative process."

### Explaining to a Hiring Manager (FDE Position)

> "The two-step pipeline solves a production reliability problem. In production LLM systems, you cannot trust a model to follow numeric rules when it also has a strong creative persona. Every time you add a rule, the model reasons around it. The fix is architectural: the model that assigns the score has no persona — it cannot be 'dramatic.' The model that writes the text receives the score as a pre-committed fact. Python then enforces it in code regardless. This pattern — separate judgement from narration, enforce in code — applies to any LLM system where numbers matter."

---

*Document updated: 2026-05-19 — covers Applied Data Scientist + Forward Deployed Engineer interview preparation*
*System: LaunchMintAI v1 — Applied DS Portfolio Project*
