# NEXT STEPS — Resume After Rate Limit Resets (12 PM)

## WHERE WE ARE RIGHT NOW
- ✅ VC Roast — fully done, tested (21/21), UI tested, frozen
- ✅ VC_ROAST_EXPLAINER.md — written and frozen
- ✅ test_vc_roast.py — frozen
- 🔄 Pitch Forge — backend + frontend fixes done, test script ready but rate-limited
- ⏳ Everything below is pending

---

## STEP 1 — Run Pitch Forge Test Script
**Wait for rate limit to reset (12 PM), then:**
```powershell
cd "C:\Users\Jatin\Documents\APP\LaunchMintAI\.claude\worktrees\vc-roast-pitchforge"
python test_pitch_forge.py
```
- 15 ideas across T1–T5 tiers
- 15s delay between each request
- ~4 minutes total run time
- Check for: static fallbacks, jargon, tweet ≤280 chars, all 5 fields present

---

## STEP 2 — UI Test for Pitch Forge
After test script passes, open `http://localhost:3000` → Forge tab.

Test checklist:
- [ ] Skeleton loads while processing (amber-tinted banner + 4 card outlines)
- [ ] Tagline appears in amber banner
- [ ] 4 cards: Elevator Pitch, Value Prop, Viral Tweet, Subject Line
- [ ] Hover any card → copy icon appears top-right
- [ ] Click copy → icon changes to checkmark for 2 seconds
- [ ] Viral Tweet card shows `{count}/280 chars` at bottom
- [ ] Suggestion chip auto-submits without clicking GENERATE
- [ ] Stop backend → error message "Forge failed. The copywriter walked out."
- [ ] ↻ Retry Forge button retries same idea without retyping
- [ ] New Deck button → back to input, clears everything

---

## STEP 3 — Write PITCH_FORGE_EXPLAINER.md
Similar structure to VC_ROAST_EXPLAINER.md. Sections to cover:
1. What is Pitch Forge?
2. System Architecture Overview
3. Single-Step LLM Pipeline (why no classifier needed — no calibration problem)
4. Web Search Grounding (Serper → market context)
5. Validator Cache Integration (how it pulls market_size, growth_rate, top_competitor)
6. Every Output Field Explained (tagline, elevator_pitch, value_prop, tweet, subject)
7. Frontend — Skeleton, Copy System, Tweet Counter, Error+Retry
8. Process — Issues fixed and how
9. Rating: current 7.5/10, ceiling 7.5/10, beyond ceiling roadmap
10. Common Interview Q&A

---

## STEP 4 — Freeze Pitch Forge Files
```powershell
$base = "C:\Users\Jatin\Documents\APP\LaunchMintAI\.claude\worktrees\vc-roast-pitchforge"
attrib +R "$base\frontend\features\pitch-forge\PitchForge.tsx"
attrib +R "$base\PITCH_FORGE_EXPLAINER.md"
attrib +R "$base\test_pitch_forge.py"
attrib +R "$base\NEXT_STEPS.md"
```

---

## STEP 5 — Freeze Shared Files
These were NOT frozen earlier because Pitch Forge work was pending.
Now both tabs are done → freeze them:
```powershell
$base = "C:\Users\Jatin\Documents\APP\LaunchMintAI\.claude\worktrees\vc-roast-pitchforge"
attrib +R "$base\backend\app\services\llm_engine.py"
attrib +R "$base\frontend\types.ts"
```

---

## STEP 6 — Merge Worktree Branch to Master
```powershell
# From the worktree directory
git add .
git commit -m "feat: VC Roast + Pitch Forge — two-step pipeline, calibration fix, skeleton UI, error+retry"

# Switch to master and merge
git checkout master
git merge vc-roast-pitchforge
git push origin master
```

---

## STEP 7 — Clean Up Worktree
After merge is confirmed on master:
```powershell
git worktree remove "C:\Users\Jatin\Documents\APP\LaunchMintAI\.claude\worktrees\vc-roast-pitchforge"
```

---

## FINAL STATE AFTER ALL STEPS

| File | Status |
|------|--------|
| frontend/features/vc-roast/VCRoast.tsx | 🔒 Frozen |
| frontend/features/pitch-forge/PitchForge.tsx | 🔒 Frozen |
| backend/app/services/llm_engine.py | 🔒 Frozen |
| frontend/types.ts | 🔒 Frozen |
| VC_ROAST_EXPLAINER.md | 🔒 Frozen |
| PITCH_FORGE_EXPLAINER.md | 🔒 Frozen |
| test_vc_roast.py | 🔒 Frozen |
| test_pitch_forge.py | 🔒 Frozen |
| NEXT_STEPS.md | 🔒 Frozen |
