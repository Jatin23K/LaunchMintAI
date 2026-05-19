# LaunchMintAI — Battle Room: Complete Technical Explainer
### For Applied Data Scientist + Forward Deployed Engineer Interview Preparation
---

## TABLE OF CONTENTS
1. [What Battle Room Does](#1-what-battle-room-does)
2. [Data Flow — End to End](#2-data-flow--end-to-end)
3. [Backend — /compare Endpoint](#3-backend--compare-endpoint)
4. [Scoring Logic — All 5 Categories](#4-scoring-logic--all-5-categories)
5. [Winner Determination & Tie-Breaker](#5-winner-determination--tie-breaker)
6. [Verdict Generation — Gemini](#6-verdict-generation--gemini)
7. [Frontend — DeltaAnalysis.tsx](#7-frontend--deltaanalysistsx)
8. [Design Decisions](#8-design-decisions)
9. [Common Interview Questions & Answers](#9-common-interview-questions--answers)

---

## 1. WHAT BATTLE ROOM DOES

Battle Room is a **head-to-head startup idea comparison engine**. It takes 2 validated startup ideas from the archive, scores them across 5 categories using deterministic math, declares a winner, and generates a brutally honest verdict.

**Key principle:** The scoring is data-driven and deterministic — not LLM opinion. Gemini is used only for the 2-sentence verdict narrative. The actual winner is determined by math.

```
Validator generates reports → User saves to archive
                                      ↓
              Battle Room reads archive → User picks 2 ideas
                                      ↓
                         POST /compare (backend)
                                      ↓
              Parse TAM + Growth + Risk + Idea text
                                      ↓
              Score 5 categories deterministically
                                      ↓
              Majority wins → Tie-breaker = larger TAM
                                      ↓
              Gemini generates 2-sentence verdict
                                      ↓
              Return: winner, verdict, scorecard
```

---

## 2. DATA FLOW — END TO END

### Where the Data Comes From

Battle Room does NOT make any new API calls to fetch market data. It reads entirely from the **localStorage archive** — the saved Validator reports.

```
localStorage["launchmint_archive"] = [
    {
        idea: "AI-powered cash flow forecasting tool...",
        market: {
            forecast_tam: "$5.4B",    ← used for Market Size scoring
            growth: "40.0%",          ← used for Growth Rate scoring
            ...
        },
        god_mode: {
            risk_score: "MEDIUM",     ← used for Competition scoring
            ...
        }
    },
    { ... second report ... }
]
```

### What Gets Sent to /compare

```typescript
POST /compare
{
    idea_a: "AI contract negotiation co-pilot...",
    market_a: {
        forecast_tam: "$3.24B",
        growth: "12.7%",
        risk_score: "MEDIUM"
    },
    idea_b: "AI-powered cash flow forecasting tool...",
    market_b: {
        forecast_tam: "$5.4B",
        growth: "40.0%",
        risk_score: "MEDIUM"
    }
}
```

**Important:** `survival_probability` from the DS classifier is NOT stored in `RealData` (the archive type). Only TAM, growth, and risk_score are available. The execution scoring therefore uses idea text analysis instead.

---

## 3. BACKEND — /compare ENDPOINT

**File:** `backend/app/main.py`
**Route:** `POST /compare`
**Model:** `CompareRequest`

```python
class CompareRequest(BaseModel):
    idea_a: str
    market_a: dict = {}
    idea_b: str
    market_b: dict = {}
```

### Three Helper Functions

**`_parse_tam(val) → float`**
Converts TAM strings to float in billions.
```
"$5.4B"   → 5.4
"$850M"   → 0.85   (million ÷ 1000)
"$2.1T"   → 2100   (trillion × 1000)
"$3.24B"  → 3.24
```
Uses regex `(\d+(?:\.\d+)?)` to extract the number, then checks the suffix character.

**`_parse_pct(val) → float`**
Extracts numeric value from growth % and risk scores. Also maps text risk tiers to numbers:
```
"MEDIUM"   → 5.0
"LOW"      → 2.0
"HIGH"     → 7.5
"CRITICAL" → 9.0
"40.0%"    → 40.0
"7/10"     → 7.0
```
Why text mapping: `god_mode.risk_score` stores `"MEDIUM"` not `"5/10"`. Without this mapping, both ideas would show `Risk 0.0/10` — meaningless comparison.

**`_execution_score(idea) → float`**
Scores execution feasibility 0–10 from the idea text alone (no API call):
```python
score = 5.0  # base

# B2B signals → +1.5 (clearer monetisation path)
if any(k in idea for k in ["saas", "enterprise", "legal", "accounting", ...]):
    score += 1.5

# AI signals → +1.0 (current investor tailwind)
if any(k in idea for k in ["ai", "ai-powered", "machine learning", ...]):
    score += 1.0

# Specificity → +0.5 (more than 6 words = focused idea)
if len(idea.split()) > 6:
    score += 0.5
```
Max score: 10.0

---

## 4. SCORING LOGIC — ALL 5 CATEGORIES

Each category produces `{ a: string, b: string, winner: "A" | "B" }`.

### Category 1: Market Size
```python
'market_size': {
    'a': f"${tam_a}B TAM",
    'b': f"${tam_b}B TAM",
    'winner': 'A' if tam_a >= tam_b else 'B'
}
```
**Logic:** Larger TAM wins. Bigger market = higher revenue ceiling = better investment.

**Example:** $5.4B vs $3.24B → B wins

---

### Category 2: Growth Rate
```python
'growth_rate': {
    'a': f"{growth_a}% CAGR",
    'b': f"{growth_b}% CAGR",
    'winner': 'A' if growth_a >= growth_b else 'B'
}
```
**Logic:** Higher CAGR wins. Faster-growing markets are easier to capture share in.

**Example:** 12.7% vs 40.0% → B wins

---

### Category 3: Competition
```python
'competition': {
    'a': f"Risk {risk_a}/10",
    'b': f"Risk {risk_b}/10",
    'winner': 'A' if risk_a <= risk_b else 'B'   # LOWER risk wins
}
```
**Logic:** Lower risk score = better competitive position. High risk means saturated market or regulatory headwinds.

**Note:** When both ideas are the same risk tier (e.g. both MEDIUM → both 5.0), it's a genuine tie. The ✓ goes to A by default (`<=` condition), but this is disclosed by showing both values as equal.

---

### Category 4: Execution
```python
'execution': {
    'a': f"Score {exec_a}/10",
    'b': f"Score {exec_b}/10",
    'winner': 'A' if exec_a >= exec_b else 'B'
}
```
**Logic:** Uses `_execution_score()` — pure text analysis of the idea string. B2B + AI + specificity = higher execution score.

**Why text analysis instead of DS data:** The DS classifier's `survival_probability` is not persisted to the localStorage archive (`RealData` type). Text analysis is a deterministic, reproducible proxy that works from data that IS available.

---

### Category 5: Investor Appeal
```python
inv = (max(tam, 0.1) × 0.4) + (max(growth, 0.1) × 0.3) + ((10 - risk) × 0.3)

'investor_appeal': {
    'a': f"Index {inv_a}",
    'b': f"Index {inv_b}",
    'winner': 'A' if inv_a >= inv_b else 'B'
}
```
**Logic:** Weighted composite score — captures all three data signals in one number.
- TAM contributes 40% (market size is the biggest investor filter)
- Growth contributes 30% (VCs want fast-growing markets)
- Safety (10 - risk) contributes 30% (lower risk = higher conviction)

**Example:** 
- Cash Flow: (5.4 × 0.4) + (40.0 × 0.3) + (5.0 × 0.3) = 2.16 + 12.0 + 1.5 = **15.66**
- Contract: (3.24 × 0.4) + (12.7 × 0.3) + (5.0 × 0.3) = 1.30 + 3.81 + 1.5 = **6.61**

---

## 5. WINNER DETERMINATION & TIE-BREAKER

```python
wins_a = sum(1 for c in scorecard.values() if c['winner'] == 'A')
wins_b = sum(1 for c in scorecard.values() if c['winner'] == 'B')

if wins_a > wins_b:
    winner = 'A'
elif wins_b > wins_a:
    winner = 'B'
else:
    # Tie-breaker: larger TAM wins
    winner = 'A' if tam_a >= tam_b else 'B'
```

**Why TAM as tie-breaker?**
TAM is the single most objective, externally verifiable data point. If two ideas win equal categories, the one targeting a larger market has a higher ceiling — this aligns with how investors actually think.

**Majority wins:** 3 out of 5 categories is a win. No partial credit, no weighted average — clean majority decision like a panel of judges.

---

## 6. VERDICT GENERATION — GEMINI

Gemini is used for **only** the 2-sentence narrative verdict. The winner is already decided before Gemini is called.

```python
verdict_prompt = (
    f'You are a brutal startup investment analyst. '
    f'In exactly 2 sentences explain why "{w_idea}" beats "{l_idea}".\n'
    f'Winner — TAM: {tam}, Growth: {growth}, Risk: {risk}\n'
    f'Loser  — TAM: {tam}, Growth: {growth}, Risk: {risk}\n'
    f'Be specific, reference actual numbers, no fluff. Exactly 2 sentences.'
)
```

### Post-Processing Chain
```python
# 1. Strip escaped quotes Gemini sometimes returns
clean_verdict = verdict.replace('\\"', '"').replace("\\'", "'")

# 2. Strip JSON wrapper if Gemini returns {"explanation": "..."}
try:
    parsed = json.loads(clean_verdict)
    if isinstance(parsed, dict):
        clean_verdict = next(v for v in parsed.values() if isinstance(v, str))
except:
    pass
```

**Why two post-processing steps?**
- Gemini sometimes escapes quotes in strings: `\"idea name\"`
- Gemini sometimes wraps the answer in JSON: `{"explanation": "..."}`
Both are Gemini formatting habits that break the UI. The chain handles both cases.

**Fallback if Gemini fails:**
```python
verdict = f'"{w_idea}" wins on stronger market fundamentals — larger TAM and better growth trajectory make it the clear investment priority.'
```
Static fallback always produces a meaningful sentence — never shows an error to the user.

---

## 7. FRONTEND — DeltaAnalysis.tsx

**File:** `frontend/features/delta-analysis/DeltaAnalysis.tsx`
**207 lines — no external dependencies beyond `api` and `RealData` type**

### Key State Variables
```typescript
selectedIds:   string[]     // idea strings of selected reports (max 2)
battleResult:  any | null   // response from /compare
loading:       boolean      // BATTLING... spinner
error:         string | null // "Battle failed. Try again."
```

### Archive Cards
Each saved report shows:
- Idea name (truncated to 2 lines via `line-clamp-2`)
- TAM from `report.market?.forecast_tam`
- Growth from `report.market?.growth`
- Risk from `report.god_mode?.risk_score`
- Slot number badge (1 or 2) when selected
- Delete button (hover reveal, stops event propagation)

### Scorecard Header Truncation
```typescript
// First 4 words of idea name — more readable than raw character slice
idea.split(' ').slice(0, 4).join(' ') + '…'
// "AI-powered cash flow forecas..." → "AI-powered cash flow forecasting…"
```

### Retry Button
```tsx
{error && (
    <div className="flex flex-col items-center gap-2">
        <p className="text-red-400 text-sm">{error}</p>
        <button onClick={runBattle} className="...">
            ↻ Retry Battle
        </button>
    </div>
)}
```
Calls `runBattle()` directly — no need to re-select both ideas.

### Empty State
```tsx
{archive.length < 2 ? (
    <div>Not Enough Data — go validate 2 ideas first</div>
) : (
    // full battle UI
)}
```

---

## 8. DESIGN DECISIONS

**Q: Why is Battle Room coupled to Validator's archive?**
A: By design. Battle Room is a comparison tool — it needs pre-validated data to compare. Requiring ideas to go through Validator first ensures the comparison uses real market data (TAM, growth, risk) rather than user-typed guesses.

**Q: Why deterministic scoring instead of asking Gemini to pick the winner?**
A: Three reasons. (1) Reproducibility — same two ideas always produce the same winner. (2) Explainability — users can see exactly which category each idea won and why. (3) Reliability — if Gemini times out, the winner is still determined correctly; only the verdict text falls back, not the result.

**Q: Why 5 categories specifically?**
A: Odd number prevents ties in the majority vote. The 5 categories cover the 3 core investment filters: market opportunity (size + growth), risk profile (competition), and execution viability (execution + investor appeal composite).

**Q: Why is investor_appeal a composite and not a standalone data point?**
A: No single data point captures investor appeal — it's a function of market size, growth velocity, and risk tolerance together. The weighted composite (40% TAM, 30% growth, 30% safety) mirrors how seed investors actually weight these factors in practice.

**Q: Why TAM as tie-breaker instead of growth rate?**
A: TAM is more objective and externally verifiable (market research reports cite it). Growth rate can be disputed or vary by source. If two ideas are otherwise equal, the one in a larger market has a fundamentally higher ceiling.

**Q: What happens if market data is missing?**
A: `_parse_tam()` and `_parse_pct()` both return `0.0` as default. `_execution_score()` returns a base of 5.0. The comparison still runs — just with neutral values for missing fields. The battle never crashes.

---

## 9. COMMON INTERVIEW QUESTIONS & ANSWERS

**Q: How does Battle Room use data science?**
A: The scoring is data-driven in two ways. First, the TAM, growth, and risk values are parsed from real market research data that was fetched during Validator's Serper/Exa search pipeline. Second, the execution score uses text feature extraction — keyword matching for B2B signals, AI signals, and idea specificity — which mirrors the feature engineering approach used in the XGBoost classifier. The `_execution_score` function is essentially a lightweight rule-based classifier.

**Q: Explain the _parse_tam function.**
A: It uses regex to extract the numeric part of a TAM string, then applies a unit multiplier based on the suffix character. `$5.4B` → extracts `5.4`, suffix is `B` (no conversion). `$850M` → extracts `850`, suffix is `M`, divides by 1000 to normalize to billions → `0.85`. `$2.1T` → extracts `2.1`, suffix is `T`, multiplies by 1000 → `2100`. The result is always in billions for consistent comparison. Edge cases: `TH` (thousand) is excluded from the trillion check, `MI`/`MO` are excluded from the million check to avoid false matches.

**Q: Why did you choose a weighted composite for investor appeal rather than a simpler approach?**
A: A single metric would miss important trade-offs. A startup in a huge but slow-growing market (high TAM, low growth) has very different investor appeal than one in a small but exploding market (low TAM, high growth). The weighted composite — 40% TAM, 30% growth, 30% safety — captures these interactions. The weights reflect real investor prioritization: market size is the biggest filter at seed stage, growth signals timing fit, and risk modulates conviction.

**Q: How do you handle Gemini returning inconsistent output formats?**
A: Two-layer post-processing. First, strip escaped quotes (`\"` → `"`) which Gemini adds when the input prompt contains quoted strings. Second, try to parse the output as JSON and extract the first string value — this handles cases where Gemini wraps the answer in `{"explanation": "..."}` or `{"verdict": "..."}`. If both layers pass through without changes, the raw text is used as-is. If Gemini fails entirely, a static fallback sentence is returned. The UI always gets a clean string regardless of what Gemini does.

**Q: What's the relationship between Validator and Battle Room at the data level?**
A: Validator generates `RealData` objects and persists them to `localStorage["launchmint_archive"]`. Battle Room reads from the same localStorage key. No direct API dependency — Battle Room is a consumer of Validator's output, not a caller of Validator's endpoints. This means Battle Room works even if the backend is offline, as long as the archive has at least 2 reports. The only backend call Battle Room makes is `POST /compare` for the scoring and verdict.

---

## 10. PROCESS — ISSUES FACED, FIXES APPLIED & PATH BEYOND CEILING

This section documents every problem encountered while building Battle Room — in the order they appeared, what each one broke, how it was fixed, and what ceiling the fixes collectively reached.

---

### ISSUE 1 — /compare Endpoint Returned 404 (Battle Room Never Worked)

**What was happening:**
Every click of the BATTLE button immediately showed "Battle failed. Try again." The browser console showed `POST /compare → 404 Not Found`. The endpoint simply did not exist — Battle Room was built on the frontend but the backend handler was never implemented.

**What it was affecting:**
- Battle Room was completely non-functional
- The entire tab was dead weight in the portfolio

**How it was fixed:**
Built the complete `POST /compare` endpoint in `backend/app/main.py` from scratch:
- Added `CompareRequest` Pydantic model
- Implemented 3 helper functions (`_parse_tam`, `_parse_pct`, `_execution_score`)
- Implemented 5-category deterministic scorecard
- Implemented majority-wins logic with TAM tie-breaker
- Wired Gemini verdict generation with static fallback
- Added `call_gemini_fast` to the import from `llm_engine.py`

**Rating after fix:** Dead → 7/10

---

### ISSUE 2 — Risk 0.0/10 for Both Ideas in Scorecard

**What was happening:**
The scorecard showed `Risk 0.0/10` for both Idea A and Idea B on every comparison. The Competition category winner was always A by default (tie-breaking `<=` condition). Risk data appeared absent even when both ideas had valid risk scores.

**Root cause:**
`god_mode.risk_score` in the archive stores `"MEDIUM"` (a text string), not a number. The original `_parse_pct()` function tried to extract a number from "MEDIUM" using regex, found none, and returned `0.0`. Both ideas scored 0.0 — a tie, resolved to A by the `<=` condition.

**What it was affecting:**
- Competition category was meaningless (always tied at 0.0)
- Investor appeal composite was wrong (uses risk in its formula)
- Winner determination could be wrong in tight matchups

**How it was fixed:**
Added text-to-number mapping in `_parse_pct()`:
```python
risk_map = {
    'LOW': 2.0, 'MINIMAL': 2.0, 'VERY LOW': 2.0,
    'MEDIUM': 5.0, 'MODERATE': 5.0,
    'HIGH': 7.5, 'ELEVATED': 7.5,
    'CRITICAL': 9.0, 'EXTREME': 9.0, 'VERY HIGH': 9.0,
}
if s in risk_map:
    return risk_map[s]
```
The function now checks for text tiers before attempting regex extraction.

**Rating after fix:** 7/10 → 7.5/10

---

### ISSUE 3 — Escaped Quotes in Verdict (`\"idea name\"`)

**What was happening:**
The Gemini verdict was displaying with escaped backslash-quotes: `\"AI-powered cash flow forecasting tool\" wins because...` These appeared as literal characters in the UI, not as clean quote marks.

**Root cause:**
The verdict prompt passes the idea names in double quotes: `explain why "{w_idea}" beats "{l_idea}"`. When Gemini echoes back those idea names, it escapes the quotes in its response: `\"AI-powered...\"`.

**What it was affecting:**
- Verdict text looked broken/unparsed in the winner banner
- Presentation quality drop — visible to anyone in a demo

**How it was fixed:**
```python
clean_verdict = verdict.strip().replace('\\"', '"').replace("\\'", "'")
```
Applied before the JSON check so the string is clean regardless of what follows.

**Rating after fix:** Presentation quality maintained at 7.5/10

---

### ISSUE 4 — JSON Wrapper in Verdict (`{"explanation": "..."}`)

**What was happening:**
On certain prompts, Gemini returned the verdict wrapped in a JSON object:
```json
{"explanation": "\"AI-powered cash flow forecasting tool\" wins because it operates in a $5.4B TAM growing at 40%..."}
```
The UI displayed the raw JSON string, not the inner text.

**Root cause:**
Gemini sometimes defaults to structured output even when not asked. The prompt context (with named fields like "Winner — TAM: ... Growth: ...") resembles a structured data extraction task, which triggers Gemini's JSON response mode.

**What it was affecting:**
- Winner banner showed raw JSON syntax
- Any investor or interviewer seeing this would immediately mark it as a bug

**How it was fixed:**
Added JSON unwrapping as the second post-processing layer:
```python
import json as _json
try:
    parsed = _json.loads(clean_verdict)
    if isinstance(parsed, dict):
        clean_verdict = next((v for v in parsed.values() if isinstance(v, str)), clean_verdict)
except Exception:
    pass
```
This tries to parse the cleaned verdict as JSON. If it succeeds and is a dict, it extracts the first string value. If parsing fails, the original string is used as-is. Two-layer chain: escaped quotes first, then JSON unwrap.

**Rating after fix:** 7.5/10 — all output formatting correct

---

### ISSUE 5 — Scorecard Column Headers Truncated Badly

**What was happening:**
Scorecard headers were showing raw character-sliced idea names: `"AI-powered cash flow forecas"` — cutting mid-word, making headers look broken.

**Root cause:**
Original code used `.slice(0, 20)` character truncation. Characters 19-20 of a long idea string often land inside a word.

**What it was affecting:**
- Column headers in scorecard were ugly and unprofessional
- Visual quality of the most important section

**How it was fixed:**
```typescript
idea.split(' ').slice(0, 4).join(' ') + '…'
```
Word-boundary truncation (first 4 words) always ends cleanly: `"AI-powered cash flow forecasting…"` instead of `"AI-powered cash flow forecas"`.

**Rating after fix:** Visual polish improvement — maintained at 7.5/10

---

### ISSUE 6 — No Retry on Battle Failure

**What was happening:**
When a battle failed (network error, Gemini timeout), the error message appeared but there was no way to retry without re-selecting both ideas from scratch. Users had to click idea A, then idea B, then BATTLE again — three clicks to recover from a one-time error.

**What it was affecting:**
- Poor UX on any Gemini rate-limit event (common on free tier)
- Live demo: a failure during a portfolio walkthrough required a visible multi-step recovery

**How it was fixed:**
Added a retry button directly below the error message:
```tsx
{error && (
    <div className="flex flex-col items-center gap-2">
        <p className="text-red-400 text-sm">{error}</p>
        <button onClick={runBattle} className="...">
            ↻ Retry Battle
        </button>
    </div>
)}
```
`runBattle()` re-uses the already-selected `selectedIds` — selection state is preserved on failure. One click to retry.

**Rating after fix:** UX resilience — maintained at 7.5/10

---

### CURRENT CEILING & WHY

**Current rating: 7.5/10**

The ceiling is set by the combination of:

| Constraint | Impact |
|---|---|
| `survival_probability` not in `RealData` type | Execution category uses text heuristics instead of ML classifier output |
| Gemini free tier rate limits | Verdict quality varies; occasional 429 errors force static fallback |
| Only 5 comparison categories | No technical moat, funding stage, or team signal |
| No visual comparative charts | Numbers only — no radar chart or bar visualization |
| 2-idea limit | Can't compare 3+ ideas for portfolio-level analysis |

---

### WHAT PUSHES THE RATING BEYOND THE CEILING

**1. Persist `survival_probability` to Archive → 8.5/10**
The DS classifier's `survival_probability` output is not stored in the `RealData` TypeScript type. Adding it requires:
- Update `RealData` interface in `frontend/types.ts` to include `survival_probability?: number`
- Update Validator's `saveToArchive` to include the DS insights field
- Replace `_execution_score()` text heuristic in `/compare` with actual classifier output
This turns the Execution category from a keyword-matching approximation into a real ML prediction.

**2. Paid Gemini (Flash or Pro) → 8/10**
- No rate limits → verdict is always Gemini-generated, never static fallback
- Gemini Pro can receive fuller market context → richer, more specific 2-sentence verdicts
- 429 errors disappear from the error log entirely

**3. Radar Chart Visualization → 8/10**
Replace the text scorecard table with a visual radar/spider chart:
- X-axis: 5 categories
- Two lines: Idea A (emerald) and Idea B (cyan)
- Makes the winner visually obvious at a glance
- Portfolio-grade presentation for investor demo mode

**4. 3-Way Comparison → 8.5/10**
Current: strictly 2 ideas. Extend to 3:
- Select up to 3 ideas from archive
- Run pairwise comparisons (A vs B, A vs C, B vs C)
- Aggregate wins to determine overall champion
- More useful for founders who have 3 serious candidates

**5. Trend-Based Investor Appeal → 9/10**
Current investor_appeal formula is static (TAM × 0.4 + growth × 0.3 + safety × 0.3).
Improvement: add a **timing score** — ideas in sectors with current VC trend alignment (AI infrastructure, climate tech, health AI in 2025–2026) get a +1.5 bonus. This would require a quarterly-updated sector trend table but would dramatically improve the signal quality of the investor appeal category.

**6. Export / Share Battle Results → 8/10**
Add a "Share this battle" button that generates a shareable URL or PDF snapshot of the scorecard. Useful for founder-to-investor communication and for portfolio demo mode.

---

---

## 10. ROLE-SPECIFIC INTERVIEW QUICK REFERENCE

### If you are interviewing for Applied Data Scientist

Lead with these 3 stories:
1. **_execution_score() as a rule-based classifier** — "The execution score function is essentially a lightweight feature-based classifier — keyword signals for B2B, AI, and idea specificity map to a numeric output. Same pattern as XGBoost feature engineering, just without the training step."
2. **_parse_tam() regex design** — "Parsing `$5.4B` vs `$850M` vs `$2.1T` requires unit-aware regex. I normalize everything to billions for consistent comparison. The edge cases — `TH` excluded from trillion match, `MI`/`MO` excluded from million match — are examples of how real data is messy."
3. **Investor appeal weights** — "TAM 40%, growth 30%, safety 30% — these weights reflect how seed investors actually prioritize. TAM is the biggest filter, growth signals timing, risk modulates conviction. A startup in a $50B growing 5% market has different appeal than one in a $2B growing 80% market."

### If you are interviewing for Forward Deployed Engineer

Lead with these 3 stories:
1. **Gemini output post-processing** — "Gemini returns escaped quotes and sometimes wraps text in JSON. I strip both deterministically before showing the verdict. The lesson: never trust LLM output formatting in production."
2. **Static fallback verdict** — "If Gemini fails entirely, a static sentence is generated from the parsed data fields. The user always sees a verdict — never an error in place of a result."
3. **Archive-based architecture** — "Battle Room makes zero API calls to fetch data — it reads from localStorage. This means it works even if the backend is offline. The only backend call is /compare for scoring and verdict. Offline resilience by design."

---

## 11. FORWARD DEPLOYED ENGINEER — INTERVIEW Q&A

**Q: A client says "Battle Room picked the wrong winner — Idea B is clearly better." How do you respond?**

A: First, walk through the scorecard with them — show which 3 of 5 categories their preferred idea lost and why. The scoring is transparent and deterministic, so you can explain exactly what happened: "Idea A won Market Size because $5.4B > $3.24B, it won Growth Rate because 40% > 12.7%, and those two wins plus the Investor Appeal composite gave it the majority." If the client disagrees with the weights, that's a valid product conversation — the current 40/30/30 weighting was designed for seed investors. If their use case is "we're already funded and optimizing for execution," the weights should change. The scoring is not a black box — it's five explicit formulas the client can audit.

**Q: The client wants to compare 3 ideas, not just 2. How do you implement this?**

A: Pairwise round-robin comparison. For 3 ideas (A, B, C), run three /compare calls: A vs B, A vs C, B vs C. Each call returns a winner. Tally the wins: the idea with 2 wins is the champion, the idea with 0 wins is eliminated. If each wins one (circular: A beats B, B beats C, C beats A) — a genuine triangle — fall back to highest investor_appeal composite score as the tiebreaker. Frontend change: allow up to 3 selections, fire 3 parallel POST /compare calls, display a 3-column scorecard with aggregate win counts. Backend change: none required — /compare already handles any two ideas independently.

**Q: How do you add a "share battle results" feature for client demos?**

A: Two approaches. Quick (1 day): encode the battle result as a base64 URL parameter — the frontend reads the URL on load, skips the battle step, and renders the scorecard directly. This works without any backend changes and the URL is shareable. Proper (3 days): add a POST /save_battle endpoint that stores the result in a short UUID → JSON map (Redis or file-based), returns a short URL like `/battle/abc123`. Frontend hits GET /battle/abc123 to retrieve it. The short URL approach is more reliable (no URL length limits) and lets you add analytics — how many times was each result viewed. For a portfolio project, the base64 approach is sufficient and impressive for demos.

**Q: A client's risk scores are showing 0.0/10 in the scorecard. How do you debug this?**

A: This is the exact Issue 2 that was fixed in development. Root cause: `god_mode.risk_score` stores the string "MEDIUM" (or "HIGH"), not a number. The `_parse_pct()` function tries regex extraction on the string, finds no digits, returns 0.0. The fix is the text-to-number mapping in `_parse_pct()`. To diagnose in production: (1) Add a log line: `logger.debug(f"risk_raw={val}, risk_parsed={result}")`. (2) Check what value is actually stored in localStorage for `god_mode.risk_score` — open DevTools → Application → Local Storage → look at the archive entry. (3) If the value is "MEDIUM" and the map doesn't have "MEDIUM", check for case differences — localStorage might store "medium" lowercase while the map keys are uppercase. Fix: normalize to `.upper()` before the map lookup.

**Q: How would you add a "team quality" signal to the scoring?**

A: This requires a new input field and a new scoring category. Frontend: add a text area "Describe your founding team" to the archive card. Backend: add `team_a: str` and `team_b: str` to `CompareRequest`. Add `_team_score(team_description) → float` that keyword-matches for: domain expertise signals (+1.5: "10 years in", "former", "PhD", "ex-Google"), founding team size signals (+0.5: "co-founder"), and previous startup experience (+1.0: "founded", "exited", "YC"). Update the scorecard to 6 categories — maintaining the odd number for majority voting is important (ties are impossible with 5 or 7 categories, possible with 6). If 6 categories are kept, add a secondary tie-breaker after TAM: highest team score. The cleaner solution is to go to 7 categories. This maintains the no-tie guarantee.

**Q: A client asks why you use localStorage instead of a database. How do you justify it?**

A: For a portfolio project with a single user, localStorage is the right choice — zero infrastructure, zero cost, works offline, instant read/write. For a multi-user production system, the answer changes immediately: localStorage is per-browser, per-device, and gets cleared when users clear cache. A proper system would use: (1) a backend database (PostgreSQL or Firestore) to store reports server-side, (2) user accounts for report ownership, (3) a GET /reports/{user_id} endpoint for retrieving the archive. The current architecture was explicitly designed for portfolio demonstration — it's a conscious trade-off, not an oversight. If I were building this for production, the archive would be the first thing to move to a server-side database.

**Q: The BATTLING... spinner appears and then immediately shows "Battle failed." A client is watching. What do you say?**

A: Stay calm — this is why the retry button exists. "The AI verdict generator hit a brief rate limit — let me retry, it'll be back in a moment." Click ↻ Retry Battle. While retrying, explain the architecture: "The winner is already determined by math — that part is instant. The AI writes a two-sentence explanation of why the winner wins, and that part occasionally hits a quota limit." This framing turns a failure into a demonstration of the system's resilience — the data is always there, only the narrative generation is affected. If the retry also fails, show the scorecard manually — "Here's exactly why Idea A won: larger TAM at $5.4B versus $3.24B, faster growth rate at 40% versus 12.7%, and a higher combined investor appeal index."

**Q: How does Battle Room fit into a client's investment workflow?**

A: The natural workflow is: validate 5-10 ideas with the Validator tab (30 minutes), save the best 4-5 to archive, then run Battle Room comparisons to narrow to 2 finalists. The key value is objectivity — the scorecard uses market data that was already verified during validation, not the client's intuition. For an investor, this workflow replaces a 2-hour debate about "which idea do we pursue" with a 5-minute structured comparison. The Gemini verdict gives them a sentence to use in their thesis. For a founder, it's a forcing function — you have to actually validate the ideas before you can battle them.

---

## 12. PRODUCTION SCENARIOS & DEBUGGING PLAYBOOK

### Scenario A: "Battle failed" on every attempt

**Symptoms:** Every click of BATTLE immediately shows "Battle failed. Try again." with no network request appearing in DevTools.

**Root cause options:**
1. Frontend is not sending both idea strings — check `selectedIds.length < 2` guard
2. Backend `/compare` is returning 500 — check for import error in `main.py` (did `call_gemini_fast` import succeed?)
3. CORS issue — `/compare` endpoint is in `main.py` but the CORS middleware might not cover it if mounted differently

**Debug steps:**
1. Open DevTools → Network → click BATTLE → look for the POST /compare request
2. If no request appears: JavaScript error before the fetch — check Console tab
3. If request appears with 500: read the backend error log — likely an import error or Pydantic validation failure
4. If request appears with 404: the `/compare` route is not registered — check `main.py` for `@app.post("/compare")`

---

### Scenario B: "Investor Appeal Index shows 0.0 for both ideas"

**Symptoms:** Investor Appeal card shows "Index 0.0" for both A and B, with A always winning (tie → A by `>=` condition).

**Root cause:** Both `_parse_tam()` and `_parse_pct()` returned 0.0, making `inv = (0.1 × 0.4) + (0.1 × 0.3) + (10 × 0.3) = 0.04 + 0.03 + 3.0 = 3.07` — wait, 10 - 0 = 10, so safety contributes 3.0 and everything else is near-zero. Both ideas get the same value.

**Actual root cause:** TAM values are stored in a format `_parse_tam()` can't parse — e.g. "5.4 billion" instead of "$5.4B".

**Debug steps:**
1. Log the raw TAM string: `logger.debug(f"tam_a_raw={market_a.get('forecast_tam')}")`
2. Check the localStorage archive — what format does `forecast_tam` actually store?
3. Update `_parse_tam()` to handle "X billion" format: `re.search(r'(\d+\.?\d*)\s*billion', val.lower())`

---

### Scenario C: "Verdict shows raw JSON: {'explanation': '...'}"

**Symptoms:** The winner verdict card shows literal JSON text instead of clean prose.

**Root cause:** The Gemini JSON-unwrapping post-processing is failing. Either:
1. The JSON has nested structure: `{"verdict": {"text": "..."}}`
2. The `json.loads()` call is raising an exception that's being silently swallowed

**Debug steps:**
1. Add logging before and after the post-processing chain:
```python
logger.debug(f"verdict_raw={verdict[:200]}")
# ... post-processing ...
logger.debug(f"verdict_clean={clean_verdict[:200]}")
```
2. If the structure is `{"verdict": {"text": "..."}}`, update the unwrapper:
```python
def _extract_str(obj):
    if isinstance(obj, str): return obj
    if isinstance(obj, dict): return _extract_str(next(iter(obj.values())))
    return str(obj)
```

---

## 13. STAKEHOLDER COMMUNICATION SCRIPTS

### Explaining to a Non-Technical Founder

> "Battle Room compares two ideas across five dimensions — market size, growth rate, competition level, execution difficulty, and investor appeal. The winner is whoever wins the majority, like a panel of five judges. It's not the AI picking a favourite — it's math applied to the data we already collected when we validated each idea. The AI writes one sentence explaining why, but the actual decision is deterministic."

### Explaining the Weights to a VC

> "Investor appeal is weighted 40% market size, 30% growth rate, 30% inverse risk. Those weights mirror how seed investors actually filter — TAM is the first filter, growth signals whether you're entering at the right moment, and risk tolerance determines conviction. A startup in a $50B market growing 5% loses to one in a $5B market growing 80% on the growth dimension but may win on TAM. The composite captures both."

### Explaining to a Hiring Manager (DS Position)

> "The scoring logic is rule-based, not ML. But the design decisions are all data-science thinking: normalizing TAM to a common unit (billions) for comparison, handling the B/M/T suffix parsing, text-based feature extraction for execution score. The `_execution_score()` function is essentially a hand-coded rule-based classifier — same concept as XGBoost feature engineering, just with explicit rules instead of learned weights. I could replace it with a trained model if I had labeled execution outcome data."

### Explaining to a Hiring Manager (FDE Position)

> "The key design decision in Battle Room is: the winner is determined before Gemini is ever called. The scoring is pure Python math — no LLM involvement. Gemini only writes the 2-sentence narrative. If Gemini fails entirely, a static fallback sentence is generated from the data. This means a Gemini outage degrades the narrative quality slightly but never breaks the core feature. That's the reliability principle I apply across the whole system."

---

*Document updated: 2026-05-19 — covers Applied Data Scientist + Forward Deployed Engineer interview preparation*
*System: LaunchMintAI v1 — Applied DS Portfolio Project*
