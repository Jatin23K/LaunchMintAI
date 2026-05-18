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
