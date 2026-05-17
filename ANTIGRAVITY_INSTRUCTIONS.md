# LaunchMintAI — Antigravity Update Instructions
**22 fixes across 4 phases. Do phases in order. Each phase is independent and deployable.**

---

## Context
- **Repo:** https://github.com/Jatin23K/LaunchMintAI
- **Frontend:** React 19 + TypeScript + Vite → deployed on Vercel (`https://launch-mint-ai.vercel.app`)
- **Backend:** FastAPI (Python 3.11) → deployed on Render (`https://launchmintai-backend.onrender.com`)
- **Workflow:** Never push directly to `master`. Always create a feature branch → PR → Actions must pass → merge
- **Branch naming:** `feature/phase-1-stability`, `feature/phase-2-history`, etc.

---

## Phase 1 — Stability & Crash Prevention
**Goal:** Eliminate all crash paths. Ship-blocker fixes only.
**Branch:** `feature/phase-1-stability`

### Fix 1 — React Error Boundary
**File:** Create `frontend/components/ErrorBoundary.tsx`
- Wrap the entire app in a React class error boundary
- On error: show a clean "Something went wrong — try again" screen with a "Restart" button that reloads the page
- Never white-screen the user

**File:** `frontend/App.tsx`
- Wrap `<App />` render output in `<ErrorBoundary>`

---

### Fix 2 — localStorage Safety
**File:** `frontend/App.tsx` (lines ~52-54)
- Wrap all `JSON.parse(localStorage.getItem(...))` calls in try-catch
- On parse failure: clear the corrupted key and return empty default value
- Never crash on load

---

### Fix 3 — dsLoading Never Clears on Error
**File:** `frontend/features/validator/Validator.tsx`
- In the `runAnalysis` function, find the error catch block
- Ensure `setLoading(false)` is called in ALL error paths, not just success
- Add `finally` block to guarantee loading state is always cleared

---

### Fix 4 — Classifier Model File Check
**File:** `backend/app/ds/classifier.py`
- Before `joblib.load(MODEL_PATH)`, check `os.path.exists(MODEL_PATH)`
- If missing: call `train_and_save()` automatically to regenerate it
- Log clearly: `[CLASSIFIER] Model not found — training now...`

---

### Fix 5 — Dead Code in search_web()
**File:** `backend/app/services/llm_engine.py`
- Remove the unreachable code block after the `return` statements in `search_web()` (lines ~281-292)
- Clean up the duplicate try/except block that can never be reached

---

### Fix 6 — Input Validation
**File:** `frontend/features/validator/Validator.tsx`
- Before calling `runAnalysis`, validate the input:
  - Minimum 10 characters
  - Maximum 300 characters
  - Strip leading/trailing whitespace
  - Show inline error message if validation fails, do not call backend

---

## Phase 2 — History Tab + Delta Fix
**Goal:** Make Delta tab useful. Add history access.
**Branch:** `feature/phase-2-history`

### Fix 7 — History Button (Top Right)
**Layout target:**
```
[🚀 Launchmint AI]   [Validator][Roast][Forge][War Room][Delta]   [🕐 History]
```

**File:** `frontend/App.tsx` or main layout component
- Add a clock icon button (`Clock` from lucide-react) fixed to top-right of the header
- On click: opens a right-side drawer/panel (slide in from right, ~380px wide)
- Drawer shows list of archived analyses from localStorage
- Each item shows: idea name + date + risk score badge
- Clicking an item loads that report back into the Validator view
- Drawer has a close (X) button

---

### Fix 8 — Delta Tab Needs History
**File:** `frontend/features/` — Delta feature component
- Delta tab shows "NOT ENOUGH DATA" because it has no access to past analyses
- Wire the Delta tab to read from the same localStorage archive
- Show the last 2 saved analyses as selectable items for comparison
- If fewer than 2 analyses saved: show message "Save at least 2 analyses from Validator to unlock Delta"

---

### Fix 9 — Archive Pagination
**File:** `frontend/App.tsx`
- Current archive is capped at 10 items with no way to see older ones
- Increase cap to 50 items
- In the History drawer (Fix 7), add simple pagination: show 10 per page with Prev/Next buttons

---

## Phase 3 — Performance & Reliability
**Goal:** Faster responses, no silent failures, smarter retries.
**Branch:** `feature/phase-3-performance`

### Fix 10 — API Retry Logic
**File:** `frontend/services/geminiService.ts`
- Wrap `callPythonBackend()` in a retry loop: max 2 retries on network error
- Wait 1 second between retries
- On final failure: throw a clear error with the attempt count

---

### Fix 11 — Analysis Timeout
**File:** `frontend/features/validator/Validator.tsx`
- Add a 90-second timeout to the analysis call
- If exceeded: cancel the request, show message:
  `"Analysis timed out. The backend may be waking up (cold start). Please try again."`
- Show a "Try Again" button

---

### Fix 12 — Response Caching
**File:** `frontend/services/geminiService.ts` or a new `frontend/services/cache.ts`
- Cache analysis results in `localStorage` keyed by idea text (lowercased + trimmed)
- Cache TTL: 24 hours
- Before making API call: check cache first
- If cache hit: return cached result instantly, show small "Cached result" badge
- Cache miss: call API as normal, store result in cache after success

---

### Fix 13 — Monte Carlo Fixed Seed
**File:** `backend/app/ds/monte_carlo.py`
- Remove `np.random.seed(42)` — this makes every simulation identical
- Replace with a seed derived from the idea string: `np.random.seed(int(hashlib.md5(idea.encode()).hexdigest()[:8], 16) % (2**31))`
- This keeps results deterministic per-idea but different across ideas

---

### Fix 14 — Centralize API Base URL
**File:** Create `frontend/config.ts`
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
```
- Replace every hardcoded `import.meta.env.VITE_API_BASE_URL` across all feature components with `import { API_BASE_URL } from '../../config'`
- Files to update: Validator.tsx, any WarRoom/Roast/Forge/Delta components that call the backend

---

### Fix 15 — PDF Export Robustness
**File:** `frontend/features/validator/Validator.tsx`
- The current html2canvas approach fails silently on some browsers
- Add explicit error message if PDF generation fails: `"PDF generation failed. Opening print dialog instead."`
- Add a loading spinner during PDF generation (it currently freezes the UI)
- Set a 30-second timeout on html2canvas — if it hangs, fall back to `window.print()`

---

## Phase 4 — Polish & Intelligence Upgrades
**Goal:** Data quality, UX polish, production readiness.
**Branch:** `feature/phase-4-polish`

### Fix 16 — Duplicate UI Components
**Files:** PitchForge, WarRoom, VCRoast feature components
- All three have identical input box + suggestion chips UI
- Extract to a shared component: `frontend/components/IdeaInput.tsx`
  - Props: `value`, `onChange`, `onSubmit`, `loading`, `suggestions`, `placeholder`
- Replace the duplicated code in all 3 features with `<IdeaInput />`

---

### Fix 17 — Static GIANT_INTEL Staleness Warning
**File:** `backend/app/services/llm_engine.py`
- Add a `GIANT_INTEL_UPDATED` date constant at the top: `GIANT_INTEL_UPDATED = "2025-05-09"`
- When injecting giant data, add a `data_freshness` field to the competitor object with this date
- Frontend: show a small "Data as of [date]" tooltip on competitor cards that use giant intel

---

### Fix 18 — Sentiment KB Staleness
**File:** `backend/app/ds/sentiment.py`
- Add the same `DATA_AS_OF = "2025-05-09"` constant
- Return this date in the sentiment analysis output
- Frontend DSInsights component: show "Sentiment data as of [date]" footnote

---

### Fix 19 — No Analytics
**File:** Create `frontend/services/analytics.ts`
- Simple event logger that writes to localStorage (no external service needed)
- Track: `analysis_started`, `analysis_completed`, `analysis_failed`, `pdf_exported`, `saved_to_battle_room`
- Each event: `{ event, idea, timestamp, duration_ms }`
- Expose a `getAnalytics()` function that returns all events
- This gives you data to improve the product — add a hidden `/analytics` debug route that shows the stats

---

### Fix 20 — Accessibility Pass
**Files:** All frontend components
- Add `aria-label` to all icon-only buttons (PDF export, save, close, etc.)
- Add `role="main"` to the main content area
- Ensure all interactive elements are keyboard-focusable (check `tabIndex`)
- Add `alt` text to any `<img>` tags

---

### Fix 21 — Unused Import Cleanup
**Files:** All frontend `.tsx` files
- Run: `npx eslint frontend/src --ext .tsx,.ts --rule '{"no-unused-vars": "error"}' --fix`
- Remove all unused imports flagged by ESLint
- This reduces bundle size and keeps code clean

---

### Fix 22 — Consistent API Response Naming
**Files:** `backend/app/services/llm_engine.py` + all extension files
- Audit all JSON responses for mixed camelCase/snake_case field names
- Standardize everything to `snake_case` on the backend
- Update frontend TypeScript types in `frontend/types.ts` to match
- This prevents silent field-not-found bugs

---

## Deployment Checklist (After Each Phase)

```
1. git checkout -b feature/phase-X-name
2. Make all changes for that phase
3. git add <specific files>
4. git commit -m "Phase X: description"
5. git push origin feature/phase-X-name
6. Open PR on GitHub → wait for Actions to pass ✅
7. Merge → Vercel auto-deploys frontend (~1 min)
8. Render auto-deploys backend (~3-5 min)
9. Test on https://launch-mint-ai.vercel.app
```

---

## File Map (Quick Reference)

| Area | Path |
|---|---|
| Main app shell | `frontend/App.tsx` |
| Validator feature | `frontend/features/validator/Validator.tsx` |
| Types | `frontend/types.ts` |
| API service | `frontend/services/geminiService.ts` |
| Backend main | `backend/app/main.py` |
| LLM engine | `backend/app/services/llm_engine.py` |
| Market search | `backend/app/services/market_search.py` |
| DS pipeline | `backend/app/ds/pipeline.py` |
| Classifier | `backend/app/ds/classifier.py` |
| Monte Carlo | `backend/app/ds/monte_carlo.py` |
| Sentiment | `backend/app/ds/sentiment.py` |
| Extensions dir | `backend/app/extensions/` |
| CI/CD workflow | `.github/workflows/ds-eval.yml` |
