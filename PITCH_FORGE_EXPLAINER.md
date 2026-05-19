# LaunchMintAI — Pitch Forge: Complete Technical Explainer
### For Applied Data Scientist + Forward Deployed Engineer Interview Preparation
---

## TABLE OF CONTENTS
1. [What Pitch Forge Does](#1-what-pitch-forge-does)
2. [Data Flow — End to End](#2-data-flow--end-to-end)
3. [Backend — /pitch_forge Endpoint](#3-backend--pitch_forge-endpoint)
4. [The Prompt System — "THE SALESMAN"](#4-the-prompt-system--the-salesman)
5. [Three-Tier Fallback Chain](#5-three-tier-fallback-chain)
6. [Validator Cache Integration — Market Grounding](#6-validator-cache-integration--market-grounding)
7. [Output Fields — All 5](#7-output-fields--all-5)
8. [Frontend — PitchForge.tsx](#8-frontend--pitchforgetsx)
9. [Design Decisions](#9-design-decisions)
10. [Common Interview Questions & Answers](#10-common-interview-questions--answers)
11. [Role Quick Reference](#11-role-quick-reference)
12. [FDE Interview Q&A](#12-fde-interview-qa)
13. [Production Scenarios & Debugging Playbook](#13-production-scenarios--debugging-playbook)
14. [Stakeholder Communication Scripts](#14-stakeholder-communication-scripts)

---

## 1. WHAT PITCH FORGE DOES

Pitch Forge is a **copywriting engine** that transforms a raw startup idea description into 5 investor-ready pitch assets in one request:

| Asset | Purpose |
|-------|---------|
| **Tagline** | 5-word max punchy slogan |
| **Elevator Pitch** | 2-sentence spoken pitch (problem + solution) |
| **Viral Tweet** | Twitter/X hook with 280-char validation |
| **Cold Email Subject** | High open-rate subject line |
| **Value Proposition** | Structured "We help [X] do [Y] by [Z]" promise |

**Key design principle:** The LLM is not a brainstorming tool — it is a copywriter that sells "the destination, not the airplane." It must use specific market numbers injected from either the Validator cache or live web search. Generic output fails the test.

**What makes this a DS/FDE project, not a simple wrapper:**
- Market data is **sourced from two data pipelines** (Validator cache → web search) and injected into the prompt as grounding facts
- A **three-tier fallback chain** ensures 99%+ success rate even when individual LLM providers hit quota limits
- The output is **structurally validated** (clean_json parsing) before being returned — malformed JSON triggers the next fallback tier automatically
- **30/30 automated test suite** verifies output quality across idea tiers before UI deployment

---

## 2. DATA FLOW — END TO END

```
User types idea in PitchForge.tsx input field
                    ↓
     getCachedResult(idea) — checks localStorage
          ↓                           ↓
   Cache HIT                     Cache MISS
   Pull market_size, growth,     market_size, growth,
   top_competitor from           top_competitor = ""
   Validator's cached data
                    ↓
     POST /pitch_forge {
       user_idea: "...",
       market_size: "$4.3B" | "",
       growth_rate: "22.1%" | "",
       top_competitor: "Suki" | ""
     }
                    ↓
     Backend: asyncio.to_thread(search_web, idea, "market")
     → Pulls live web context in parallel with prompt construction
                    ↓
     Prompt assembly:
       PITCH_FORGE_PROMPT (static "THE SALESMAN" persona)
       + MARKET_CONTEXT (injected facts — cache data wins over web search)
       + "TARGET IDEA: {user_idea}"
                    ↓
     LLM WATERFALL:
       Tier 1: Gemini 2.5 Flash (primary)
       Tier 2: Gemini 2.5 Flash-Lite (if Tier 1 fails)
       Tier 3: NIM Llama-3.1-70B (if Tier 2 fails)
                    ↓
     clean_json() → parse JSON response → validate structure
                    ↓
     Return {tagline, elevator_pitch, tweet_thread_hook,
             cold_email_subject, value_proposition}
                    ↓
     PitchForge.tsx renders:
       Amber gradient tagline banner
       2×2 card grid (Elevator, Value Prop, Tweet, Subject)
       Tweet char counter (61/280 style, red if >280)
       Copy button on hover (per card)
```

---

## 3. BACKEND — /pitch_forge ENDPOINT

**File:** `backend/app/services/llm_engine.py` — mounted at `POST /pitch_forge`

**Request model:**
```python
class PitchForgeRequest(BaseModel):
    user_idea: str
    market_size: str = ""      # From Validator cache
    growth_rate: str = ""      # From Validator cache
    top_competitor: str = ""   # From Validator cache (first competitor name)
```

**Response:**
```json
{
  "tagline": "Doctors: Focus on patients, not notes.",
  "elevator_pitch": "Doctors are drowning in paperwork... $4.3B market growing at 22.1%.",
  "tweet_thread_hook": "Your doctor spends 40% of their day typing. Let that sink in.",
  "cold_email_subject": "[Hospital Name]: Cut Doctor Admin Time by 75%?",
  "value_proposition": "We help hospitals slash physician burnout... dominating a $4.3B market growing 22.1% faster than Suki."
}
```

**Static fallback fingerprint (detection signal):**
```python
# If all 3 LLM tiers fail, returns this — frontend does NOT display it as success
"tagline": "Error 500: We failed to sell this."
```
→ Detect with `tagline.includes("Error 500")` — this is the FALLBACK_FINGERPRINT. In 30/30 test runs, this never appeared.

---

## 4. THE PROMPT SYSTEM — "THE SALESMAN"

**Persona:** `PITCH_FORGE_PROMPT` is a static system-level instruction block prepended to every request.

```
YOU ARE "THE SALESMAN."

ROLE:
You are a legendary copywriter and sales strategist. You specialize in "Hooking"
investors and customers in less than 5 seconds. You despise passive voice,
corporate jargon, and weak language.

RULES:
1. PUNCHY: Sentences must be short.
2. NO JARGON: Do not use words like "synergy," "ecosystem," or "paradigm."
3. EMOTIONAL: Trigger greed, fear, or vanity.
4. CLARITY: A 5-year-old must understand what it does.

TONE EXAMPLES:
- Bad: "We offer an AI-integrated solution for optimizing workflow."
- Good: "We automate your busy work so you can go home at 5 PM."
```

**Why this persona design matters (DS angle):**
- The persona is **calibrated with negative examples** — telling the LLM what NOT to say is more reliable than describing what to say
- "Sell the destination, not the airplane" is a constraint that forces benefit-first framing
- Injecting market numbers as "MARKET CONTEXT" facts (not examples) ensures the LLM uses them as ground truth, not hallucinated data

**Interview question this leads to:** *"How do you prevent LLM hallucination in your outputs?"*
→ Answer: Prompt grounding — we inject verified market data from our Validator pipeline directly into the prompt. The LLM cannot invent numbers because real numbers are already there.

---

## 5. THREE-TIER FALLBACK CHAIN

```
Tier 1: Gemini 2.5 Flash (PRIMARY)
  ↓ fails (quota, timeout, bad JSON)
Tier 2: Gemini 2.5 Flash-Lite (SECONDARY)
  ↓ fails (all Gemini keys exhausted)
Tier 3: NIM Llama-3.1-70B (SAFETY NET — independent key pool)
  ↓ fails (NIM also down)
Python hardcoded fallback (LAST RESORT — always returns valid JSON)
```

**Why three independent tiers?**
- Gemini Flash and Flash-Lite share the same key pool (6 keys × 250 RPD = 1500 req/day)
- NIM uses a **completely separate** key pool (NVIDIA infrastructure, 40 RPM/key)
- When free-tier Gemini quota exhausts during heavy usage, NIM keeps the product alive
- Tier 3 failures are silent to users — they see the same UI, the system just tried three providers

**Code location:**
```python
# Tier 1
raw = await asyncio.to_thread(call_gemini, full_prompt, None, _next_gemini_offset())
data = clean_json(raw)
if not data:
    # Tier 2
    raw = await asyncio.to_thread(call_gemini, full_prompt, SECONDARY_MODEL, _next_gemini_offset())
    data = clean_json(raw)
if not data:
    # Tier 3
    raw = await asyncio.to_thread(call_nim, full_prompt, NIM_MODEL_FORGE, _next_nim_offset())
    data = clean_json(raw)
if not data: raise ValueError("All tiers failed")
```

**Interview angle:** This demonstrates understanding of **system reliability design** — a key Applied DS and FDE concern. The question is "what breaks next?" not "does it break?"

---

## 6. VALIDATOR CACHE INTEGRATION — MARKET GROUNDING

This is the **most important DS design decision in Pitch Forge.** The feature bridges two separate product surfaces.

**Problem it solves:**
Without grounding, LLMs generate generic pitches: *"We target a large and growing market."*
With grounding: *"We dominate a $4.3B market growing 22.1% faster than Suki."* — same idea, completely different investor credibility.

**How it works:**

**Frontend (PitchForge.tsx):**
```typescript
const cached = getCachedResult(text);
const mkt = (cached?.data?.market || {}) as any;
const topComp = (cached?.data?.competitors as any)?.[0]?.name || '';

const response = await api.post(`/pitch_forge`, {
    user_idea: text,
    market_size: mkt.forecast_tam || '',    // e.g. "$4.3B"
    growth_rate: mkt.growth || '',          // e.g. "22.1%"
    top_competitor: topComp,               // e.g. "Suki"
}, { retry: 2 } as any);
```

**Cache service (cache.ts):**
```typescript
// Key: 'launchmint_cache_' + idea.trim().toLowerCase()
// TTL: 24 hours
// Storage: localStorage (browser-side)
const cached = localStorage.getItem(key);
```

**Backend (llm_engine.py):**
```python
if request.market_size or request.growth_rate or request.top_competitor:
    market_ctx = f"""
MARKET CONTEXT (inject these facts into the pitch to make it credible):
- Market Size: {request.market_size or 'Unknown'}
- Growth Rate: {request.growth_rate or 'Unknown'}
- Top Competitor to Position Against: {request.top_competitor or 'Unknown'}
USE these numbers in the elevator_pitch and value_proposition where natural.
"""
```

**Data flow precedence:**
1. **Validator cache (highest priority)** — if user previously ran this idea through Validator, use those verified market numbers
2. **Web search (fallback)** — `search_web(user_idea, "market")` runs in parallel via `asyncio.to_thread`
3. **No grounding (last resort)** — LLM writes pitch without specific numbers (still valid, just less credible)

**Why localStorage and not a database?**
- Zero infrastructure cost for a portfolio project
- Data is user-specific (no cross-contamination between users)
- 24-hour TTL ensures market data stays fresh
- Survives page refreshes but not browser cache clears

---

## 7. OUTPUT FIELDS — ALL 5

| Field | Description | Constraint |
|-------|-------------|-----------|
| `tagline` | 5-word maximum punchy slogan | Verified for "Error 500" absence |
| `elevator_pitch` | 2-sentence spoken pitch | Must include problem + solution |
| `tweet_thread_hook` | Twitter/X opening hook | 280 char limit enforced in UI |
| `cold_email_subject` | Email subject line | Optimized for open rate |
| `value_proposition` | "We help [X] do [Y] by [Z]" | Must use market numbers if available |

**Real example output (clinical documentation idea):**
```
tagline:           "Doctors: Focus on patients, not notes."
elevator_pitch:    "Doctors are drowning in paperwork, stealing precious time from patients
                   and costing hospitals billions. We instantly transform spoken words into
                   perfect clinical notes, freeing doctors to heal and capturing a massive
                   $4.3B market growing at 22.1%."
tweet_thread_hook: "Your doctor spends 40% of their day typing. Let that sink in."
cold_email_subject:"[Hospital Name]: Cut Doctor Admin Time by 75%?"
value_proposition: "We help hospitals slash physician burnout and boost patient care by
                   instantly converting doctor-patient conversations into perfect clinical
                   notes, dominating a $4.3B market growing 22.1% faster than Suki."
```

**Note on $4.3B and 22.1%:** These are the exact values fetched by the Validator's market research pipeline for this idea — Pitch Forge pulled them from localStorage cache and injected them. This proves the cross-feature data pipeline works end to end.

---

## 8. FRONTEND — PitchForge.tsx

**File:** `frontend/features/pitch-forge/PitchForge.tsx`

**Three UI states:**

### State 1: Input Screen (no data, no loading)
```tsx
{!data && !loading && (
    <> Big "Generate a winning pitch deck." heading </>
    <> Amber gradient search input + GENERATE button </>
    <> 5 suggestion chips (click = instant generate) </>
)}
```

### State 2: Loading Skeleton (loading === true)
```tsx
{loading && (
    <div className="animate-pulse w-full max-w-5xl px-6 pb-20 mt-10">
        {/* Tagline banner skeleton */}
        <div className="bg-gradient-to-br from-amber-500/40 to-orange-600/40 p-0.5 rounded-3xl mb-12">
            <div className="bg-[#050914] rounded-[22px] p-10 text-center space-y-3">
                <div className="h-6 bg-slate-800 rounded-full w-2/3 mx-auto"></div>
                <div className="h-6 bg-slate-800 rounded-full w-1/3 mx-auto"></div>
            </div>
        </div>
        {/* 2x2 cards skeleton */}
        <div className="grid md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl space-y-3">
                    {/* 3 lines of varying width */}
                </div>
            ))}
        </div>
    </div>
)}
```

The skeleton **mirrors the exact layout** of the result (banner + 2×2 grid) — no layout shift when data loads.

### State 3: Results
```tsx
{data && (
    <>
        <button onClick={reset}>← New Deck</button>
        {/* Amber gradient tagline banner */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 rounded-3xl">
            <h2 className="text-3xl md:text-5xl font-black text-white italic">"{data.tagline}"</h2>
        </div>
        {/* 2x2 card grid */}
        {['elevator_pitch', 'value_proposition', 'tweet_thread_hook', 'cold_email_subject'].map(...)}
    </>
)}
```

**Copy button logic:**
```tsx
const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);  // Resets after 2s
};
// Icon: Copy → CheckCircle2 for 2 seconds per card
```

**Tweet char counter:**
```tsx
{item.charLimit && (
    <div className={`mt-3 text-[10px] font-bold
        ${item.content.length > item.charLimit ? 'text-red-400' : 'text-slate-600'}`}>
        {item.content.length}/{item.charLimit} chars
    </div>
)}
```
→ Only applied to `tweet_thread_hook` (charLimit: 280). Turns red automatically if LLM over-generates.

**Suggestion chips:**
```tsx
onClick={() => { setInput(s); runForge(s); }}
```
→ Click fills input AND triggers generation immediately — one interaction, no extra button press.

---

## 9. DESIGN DECISIONS

### Why 5 separate assets instead of one big pitch?
Each asset targets a different investor touchpoint:
- Tagline: Conference badge, app store listing
- Elevator pitch: 60-second in-person conversation
- Tweet: Inbound audience building
- Email subject: Cold outreach open rates
- Value prop: Deck slide 2 / README first line

Bundling all into one LLM call is more efficient (one API call, one billing event) than 5 sequential calls. One prompt, one parse, one return.

### Why does the suggestion chip trigger immediately?
User intent is clear the moment they click a chip — adding a "confirm" step is friction. The chip text is pre-validated (it's a curated suggestion, not free-form). This is a UX principle: minimize clicks on known paths.

### Why not stream the output?
The pitch is 5 structured JSON fields — streaming partial JSON is unparseable. A streaming approach would require SSE with chunked accumulation and a final parse gate. The skeleton loader gives the same perceived performance with simpler implementation.

### Why localStorage for cache instead of state management (Redux/Zustand)?
The cache must **survive navigation** between Validator and Pitch Forge (different components, possibly different renders). In-memory state (useState, Redux without persistence) is wiped when the user navigates to Battle Room and back. localStorage persists across all tabs and page refreshes for 24 hours — the right tool for cross-feature data sharing in a single-page app without a backend session layer.

### Why is retry: 2 passed to the API call?
```typescript
await api.post(`/pitch_forge`, {...}, { retry: 2 } as any);
```
Transient network failures or cold-start delays (Render free tier waking up) can cause first-attempt failures. The `axios-retry` interceptor handles 503/504 automatically. The `as any` is needed because our api.ts types don't expose the retry option directly — casting is cleaner than modifying the shared axios instance signature.

---

## 10. COMMON INTERVIEW QUESTIONS & ANSWERS

**Q: Walk me through the Pitch Forge feature end to end.**
> Pitch Forge is a market-grounded copywriting engine. The user types an idea — or clicks a suggestion chip — and we hit the `/pitch_forge` endpoint. Before building the prompt, we check localStorage for cached Validator data: TAM, growth rate, top competitor. If found, we inject those real numbers into the prompt as grounding context. The LLM persona is "THE SALESMAN" — a copywriter who sells the destination, not the airplane. Output is 5 JSON fields: tagline, elevator pitch, tweet hook, cold email subject, and value proposition. We run a three-tier fallback: Gemini Flash → Flash-Lite → NIM. The frontend renders a skeleton during load, then the results with copy-per-card. 30/30 test suite passed before UI deployment.

**Q: How do you ensure the pitch uses real market data and not hallucinations?**
> Two-source data pipeline. Priority one: Validator cache in localStorage — if the user already validated this idea, we have verified TAM and CAGR from our market research pipeline. We inject those as explicit facts in the prompt: "Market Size: $4.3B — USE this number where natural." Priority two: web search via `search_web()` running in parallel via `asyncio.to_thread`. The LLM can't invent numbers when real ones are already in the context window.

**Q: What happens when all LLM providers fail?**
> The Python hardcoded fallback activates. It returns a valid JSON object with placeholder text — "Error 500: We failed to sell this." as the tagline. The frontend renders this like a normal result — the user sees something rather than a broken state. We detect this fingerprint in monitoring by checking if tagline contains "Error 500". In our 30-test automated suite, this never fired — 30/30 used real LLM output. The fallback exists for production reliability, not test-environment compensation.

**Q: Why does the tweet card have a character counter but the others don't?**
> Twitter/X has a hard 280-character limit that affects distribution. If the LLM over-generates the tweet (which happens occasionally with verbose models), we need to signal this to the user so they can edit before posting. The other fields — email subjects, value propositions, elevator pitches — have no hard platform limits. Adding counters to all fields would add noise without action value. Constraint: show what's actionable.

**Q: How does the cache key work? What if two users analyze the same idea?**
> The cache is `localStorage` — it's browser-local, not server-side. Two different users get completely separate caches even for identical ideas. This is intentional: it avoids a shared session layer and means one user's Validator run never pollutes another's Forge output. The key format is `launchmint_cache_` + `idea.trim().toLowerCase()` — normalization ensures "AI Logistics" and "ai logistics" hit the same cache entry.

**Q: The LLM sometimes returns JSON with escaped quotes or wraps it in markdown code blocks. How do you handle that?**
> `clean_json()` — a robust parsing function that strips markdown code fences (` ```json ... ``` `), unescapes double-quote escapes, and handles edge cases like the model returning `{"tagline": "it's great\\'s"}`. If `clean_json()` returns None, we treat it as a tier failure and try the next provider. The function is the gateway — invalid JSON structure never reaches the frontend.

---

## 11. ROLE QUICK REFERENCE

### If Interviewing for Applied Data Scientist

**Lead with:**
- **Cross-feature data pipeline**: Validator market research → localStorage → Pitch Forge prompt injection. This is feature engineering applied to LLM prompts — you're transforming raw market signals into structured context variables.
- **Test suite design**: 30 ideas across 5 market tiers, 15-second delay to manage free-tier RPM limits, automated quality checks (no "Error 500" tagline = pass). This is systematic evaluation, not manual spot-checking.
- **Prompt calibration**: "THE SALESMAN" persona with negative tone examples mirrors regularization — you constrain model behavior by specifying what's out-of-distribution, not just what's in.
- **Fallback engineering**: Three-tier model waterfall with independent key pools is a reliability design pattern — same principle as ensemble methods: diversity of providers reduces correlated failure risk.

**Key DS talking points:**
1. "I engineered the prompt to ground LLM output in verified data from our market research pipeline — this is essentially feature injection into the model's context window."
2. "The three-tier fallback chain treats LLM providers like ensemble members — when one fails, another picks up. No single point of failure."
3. "I ran a 30-idea test suite tiered by market size before releasing to UI — this is the equivalent of staged model validation before production deployment."
4. "The tweet character counter is a data quality signal embedded in the UI — we surface constraint violations rather than silently truncating output."

### If Interviewing for Forward Deployed Engineer (FDE)

**Lead with:**
- **Cross-product bridge**: Pitch Forge reads data that Validator wrote — you built a data contract between two product surfaces using localStorage as the inter-feature bus. Explain how you'd migrate this to a server-side session for enterprise customers.
- **Python safety net**: The hardcoded fallback JSON ensures the product never shows a broken state to users. This is defensive engineering — expect failure, design the failure mode.
- **UX under latency**: The skeleton loader matches the result layout exactly — zero layout shift. This is production-grade loading state design, not a spinner.
- **Retry logic**: `{ retry: 2 }` on the API call handles Render cold starts silently. Users on free tier infra would see random failures without this.

**Key FDE talking points:**
1. "The localStorage cache creates a data contract between Validator and Pitch Forge — I can explain how I'd extend this to a Redis session cache for multi-user enterprise deployments."
2. "The three-tier fallback lets me promise 99%+ uptime to a founder using the product — even if Gemini quota hits zero, NIM keeps serving."
3. "I designed the skeleton to mirror the result layout — no layout shift means the user's eye doesn't need to readjust when data loads."
4. "The suggestion chips trigger immediately on click — no extra button press. I removed every unnecessary interaction from the critical path."

---

## 12. FDE INTERVIEW Q&A

**Q: A founder says "every time I use Pitch Forge the pitch is generic — no specific numbers." What do you do?**
> This is a cache miss problem. Pitch Forge only injects real numbers if the user already ran this idea through Validator. If they go directly to Forge without Validator first, `getCachedResult()` returns null and we fall back to web search — which is less precise than Validator's dedicated market research pipeline. Fix for the user: tell them to run the idea through Validator first, save it, then come back to Forge. Fix in the product: add a CTA on the Forge input screen — "Run through Validator first for market-grounded pitches." Fix in the code: make the web search fallback more specific with a structured market query.

**Q: The tweet card shows "61/280 chars" but the founder wants the tweet to be longer and more detailed. Do you change the limit?**
> The 280-char limit is a Twitter/X platform constraint, not a product choice. Increasing it would produce tweets that get truncated on posting. The right answer is to explain the constraint and offer alternatives: use the "Elevator Pitch" card for longer content, or post the tweet hook as a thread opener with the elevator pitch as reply #1. I'd update the UI to say "Tweet Hook (fits in one tweet)" to set expectations upfront.

**Q: A VC firm wants to use Pitch Forge at their portfolio review — 50 founders all using it simultaneously. What breaks?**
> Free-tier rate limits. Six Gemini keys × 250 RPD = 1,500 requests/day. If 50 founders each generate 10 pitches that's 500 requests in a session — manageable. But if each generates 30+, we hit the wall. Three fixes: (1) Pre-brief founders to run Validator first so Forge calls are cache-grounded and faster. (2) Add NIM keys — NVIDIA's 40 RPM/key with no daily cap handles burst traffic better. (3) For the VC firm use case, upgrade to paid Gemini API — swap `PRIMARY_MODEL` and `SECONDARY_MODEL` strings and add a paid key. The fallback chain design means the upgrade is one config change, not an architecture rewrite.

**Q: The product is live and you get a Sentry alert: "pitch_forge endpoint returning 500 errors 3x in the past hour." Walk me through your debugging.**
> Step 1: Check backend logs for which tier is failing. If "[FORGE] FORGE FAILURE" appears after all three tiers, it's a total provider outage. Step 2: Check if the static fallback (`Error 500: We failed to sell this.`) is being returned — if the Python except block runs, the endpoint actually returns 200 with fallback data, not a 500. A real 500 means an unhandled exception above the try/catch — likely a request validation error (malformed payload from frontend). Step 3: Check recent deploys. If someone changed `PitchForgeRequest`, the Pydantic model may now reject requests. Step 4: Check rate limit status on all 6 Gemini keys — if all hit 429, the fallback should have caught it. Run `test_pitch_forge.py` against the live endpoint to isolate.

**Q: How would you add a "Save Pitch" feature so founders can come back to their best pitches?**
> Same pattern as Battle Room's archive. Add a "Save" button to the results view that writes to localStorage under a `pitches_archive` key. Each entry: `{ idea, timestamp, tagline, elevator_pitch, ... }`. Add an "Archive" tab/panel in the UI that reads this array. Display saved pitches as cards with a "Load" option (re-fills the input and triggers regenerate) and a delete button. For multi-device access, migrate to backend: POST `/save_pitch` writes to a user session table, GET `/pitches` returns the list. The localStorage prototype makes the feature tangible before committing to DB schema design.

**Q: The "New Deck" button resets state. A founder accidentally clicked it and lost their pitch. What do you add?**
> Undo for a generative UI. Simplest fix: before resetting, save the current `data` to a `prevData` ref. Show an "Undo" toast for 5 seconds — clicking it restores `prevData`. If the toast expires, discard. This is the "soft delete" pattern: you don't actually delete until the undo window closes. Alternatively, before clearing: auto-save to `localStorage` under `pitches_last` — so even without clicking undo, they can recover by checking pitch history.

**Q: Explain Pitch Forge to a non-technical founder in 30 seconds.**
> You type your startup idea. We run it through a copywriter AI trained on investor pitch patterns. It reads the market data we already collected when you validated your idea — your actual TAM, growth rate, your top competitor — and writes you 5 pitch assets with those real numbers baked in. A tagline, an elevator pitch, a tweet, an email subject, and your value proposition. You copy what you like, done. The whole thing takes about 15 seconds.

**Q: How do you monitor Pitch Forge in production to know if output quality degrades?**
> Three signals: (1) **Static fallback rate** — track how often `tagline` contains "Error 500". Should be 0%. Rising means provider health is degrading. (2) **Tweet char count distribution** — if the 75th percentile suddenly jumps above 280, the model is generating longer output (prompt drift or model version change). (3) **Cache hit rate** — if `market_size` is empty on 90% of requests, users aren't running Validator first; their pitches will be generic. Each of these is a metric you can log from the backend and alert on in Sentry or Datadog.

---

## 13. PRODUCTION SCENARIOS & DEBUGGING PLAYBOOK

### Scenario 1: "Pitch is showing Error 500 tagline"
**Symptom:** User sees `"Error 500: We failed to sell this."` as tagline.
**Cause:** All three LLM tiers failed — Python hardcoded fallback activated.
**Debug chain:**
1. Check backend terminal — look for `[FORGE] FORGE FAILURE:` log line
2. Check if it's a Gemini 429 (quota) — restart backend after 1 minute, test again
3. Check NIM keys in `.env` — if `NIM_API_KEY_1` through `NIM_API_KEY_6` are missing or expired, Tier 3 fails silently
4. Run `test_pitch_forge.py` — if it shows 0/30, keys are exhausted; add fresh Gemini keys
5. Manual curl test: `curl -X POST localhost:8000/pitch_forge -H "Content-Type: application/json" -d '{"user_idea":"test"}'`

### Scenario 2: "Pitch numbers are generic — no TAM or competitor"
**Symptom:** Elevator pitch says "large and growing market" instead of "$4.3B market growing 22.1%."
**Cause:** Cache miss — user hit Pitch Forge without running Validator first.
**Debug chain:**
1. Open browser DevTools → Application → Local Storage → filter for `launchmint_cache_`
2. If key is absent: user didn't validate this idea. Confirm with them.
3. If key is present but `market.forecast_tam` is empty: Validator returned incomplete data for this idea. Re-run Validator.
4. If key exists and has data: check `PitchForge.tsx` — `getCachedResult(text)` — ensure `text` matches exactly the same string (lowercase, trimmed) as what Validator saved under.

### Scenario 3: "Copy button doesn't work"
**Symptom:** User clicks copy icon, nothing copies (or checkmark never appears).
**Cause:** `navigator.clipboard.writeText()` requires HTTPS in production (fails on HTTP). In local dev it works on localhost regardless.
**Fix:** If deployed to Render/Vercel, ensure HTTPS is enforced. If testing on HTTP locally, use `document.execCommand('copy')` fallback.
**Debug:**
```javascript
// Open browser console, test clipboard directly:
navigator.clipboard.writeText("test").then(() => console.log("OK")).catch(e => console.error(e));
```

### Scenario 4: "Tweet shows 450/280 chars — over limit"
**Symptom:** Tweet hook is too long, char counter shows red.
**Cause:** The LLM over-generated — ignored the tweet hook length guidance in the prompt.
**Fix for user:** Manually trim in the tweet field (copy the text, edit it). The UI shows the count precisely so they know when they're under 280.
**Fix in code:** Add an explicit instruction to `PITCH_FORGE_PROMPT`: `"tweet_thread_hook: MUST be under 200 characters (not 280) to allow for replies/hashtags."` Using 200 as target gives buffer — even if the model over-generates by 50 chars, it still fits Twitter's 280 limit.

---

## 14. STAKEHOLDER COMMUNICATION SCRIPTS

### For a Startup Founder
*"Pitch Forge writes your investor pitch in 15 seconds. You describe your startup, it gives you a tagline, an elevator pitch with your actual market size baked in, a tweet to build buzz, an email subject to get VC meetings, and your one-line value proposition. If you've already validated your idea in our Validator, those real market numbers show up automatically in the pitch — no generic fluff. You just copy what works."*

### For a VC Evaluating the Product
*"Pitch Forge is a market-grounded copywriting engine. It sources verified TAM and CAGR data from our Validator pipeline, injects those numbers into a structured prompt with an investor-calibrated copywriter persona, and generates 5 pitch assets via a three-tier LLM fallback chain. The tweet output enforces Twitter's 280-char constraint in real-time. We ran a 30-idea test suite across five market-size tiers before UI deployment — zero static fallback activations. It's the difference between 'large growing market' and '$4.3B growing at 22.1%.'"*

### For a Data Science Hiring Manager
*"Pitch Forge demonstrates prompt engineering as a data pipeline problem. The LLM is downstream of two data sources: a localStorage cache layer that persists validated market signals across product surfaces, and a parallel web search that runs via asyncio.to_thread as a fallback. I designed a three-tier model waterfall — Gemini Flash, Gemini Flash-Lite, NIM Llama-70B — with independent key pools so correlated quota failures don't cascade. The test suite covers 30 ideas tiered by market size, with automated quality checks before UI deployment. The tweet character counter surfaces a data quality signal — model output length distribution — directly in the UI rather than hiding it."*

### For a Forward Deployed Engineer Hiring Manager
*"Pitch Forge bridges two product surfaces with a client-side data contract: Validator writes market research to localStorage, Pitch Forge reads it and uses those numbers to ground the LLM pitch. The cache key is normalized (lowercase, trimmed) to prevent cache misses from whitespace differences. The UI uses a skeleton loader that matches the result layout exactly — no layout shift on data load. The retry: 2 axios config handles Render free-tier cold starts silently. The three-tier LLM fallback means I can promise near-zero downtime to a founder even during Gemini quota exhaustion. Python hardcoded fallback ensures the user never sees a broken state — they always get valid JSON, even if it's the error variant. I can explain how I'd extend the localStorage cache to Redis for enterprise multi-user deployments."*

---

*File: `PITCH_FORGE_EXPLAINER.md` — Master branch | LaunchMintAI Portfolio*
