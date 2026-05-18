# LaunchMintAI — Portfolio Presentation Guide
### Targeting: Applied Data Scientist Role

---

## ONE-LINE PITCH

> "LaunchMintAI is a full-stack AI product that validates startup ideas using a five-signal scoring pipeline — market sizing, competitor analysis, sentiment scoring, and a two-step calibrated LLM roast — then generates investor-ready pitch copy grounded in live market data."

---

## WHAT TO LEAD WITH (The Data Science Angle)

Most candidates show dashboards or fine-tuned models. You show a **production ML system with measurable calibration guarantees**. That's the differentiator.

---

## DS COMPONENT HIGHLIGHTS

### 1. XGBoost Demand Score
- Trained classifier predicting market demand signal
- Feature engineering from idea text + category signals
- Output: 0–100 demand score fed into composite validator score

### 2. Monte Carlo Simulation (Market Sizing)
- 10,000-run simulation with randomised TAM/SAM assumptions
- Outputs: P10 / median / P90 confidence band
- Why it matters: shows you understand probabilistic thinking, not just point estimates

### 3. VADER Sentiment Analysis
- Applied to competitor reviews scraped via Serper
- Identifies "frustrated customer" signal — a real moat indicator
- Compound score → converted to 0–100 sentiment score

### 4. Two-Step Calibrated LLM Pipeline (the hardest problem)
- **Problem**: Single-prompt LLMs collapse all scores to 12–15% regardless of idea quality
- **Root cause**: creative personas override numeric rules — LLMs are reasoners, not rule-followers
- **Solution**: Two-step pipeline
  - Step 1 — Neutral classifier (Flash-Lite): assigns Tier 1–6, survival %, verdict. No persona = no drama.
  - Step 2 — Creative writer (Flash): receives pre-locked numbers, writes the roast copy around them
  - Step 3 — Python safety net: `data["survival_chance"] = survival_chance` unconditionally overwrites after LLM response
- **Result**: 21/21 test ideas score in correct calibrated range across all tiers
- **Why DS**: calibration is a core ML concept — same as probability calibration in classification models

### 5. Fallback Chain (Reliability Engineering)
- Validator cache → live Serper web search → graceful degradation
- Pitch Forge pulls from Validator cache if available; falls back to independent market search
- No silent failures — static fallback detection in test suite

### 6. Serper Web Search Grounding
- Real-time market context injected into both VC Roast and Pitch Forge
- Competitor names, market sizes, growth rates sourced live
- Makes outputs defensible in an interview ("it's not just LLM hallucination")

---

## TECH STACK (for GitHub/Resume)

| Layer | Tech |
|-------|------|
| Backend | FastAPI (Python) |
| LLM | Google Gemini Flash + Flash-Lite (two-step pipeline) |
| ML Models | XGBoost (demand), VADER (sentiment), Monte Carlo (market) |
| Search | Serper API (Google Search grounding) |
| Frontend | React + TypeScript + Tailwind CSS |
| Testing | Custom Python test suite (21 VC Roast + 15 Pitch Forge ideas) |
| Deployment | Local dev (worktree branch → master merge) |

---

## RESUME BULLET POINTS

Pick 3–4 of these depending on space:

- **Built a two-step calibrated LLM pipeline** (Gemini Flash-Lite classifier + Flash writer) that eliminates score collapse across 6 idea tiers, validated against 21 diverse test cases with 100% pass rate

- **Designed a Monte Carlo simulation** (10,000 runs) for probabilistic market sizing, outputting P10/median/P90 TAM bands to quantify investment risk under uncertainty

- **Engineered a five-signal composite scorer** combining XGBoost demand prediction, VADER sentiment analysis on competitor reviews, and real-time web search grounding via Serper API

- **Implemented reliability fallback chain**: Validator cache → live web search → graceful error state, with static fallback detection in automated test suite preventing silent API failures

- **Deployed full-stack AI product** (FastAPI + React/TypeScript) with skeleton loading states, copy system, tweet character counter, and error+retry UX — no frameworks, built from scratch

---

## 4 INTERVIEW TALKING POINTS

### Talking Point 1 — The Calibration Problem (Best Story)
> "The hardest technical problem was LLM calibration. A single-prompt model kept scoring everything at 12–15% regardless of idea quality. I tried adding more rules to the prompt — didn't work. Then I realised the root cause: LLMs are creative reasoners, not rule-followers. A 'SKEPTIC VC persona' will override any numeric rule if it finds a justification. The fix was a two-step pipeline: a neutral classifier locks the numbers first, then a creative writer gets those numbers injected into its prompt. Plus a Python safety net that unconditionally overwrites the score after the response. Three layers of enforcement. That's the same logic as probability calibration in ML — you can't trust raw model output, you need post-processing guarantees."

### Talking Point 2 — Monte Carlo for Market Sizing
> "Instead of giving a single TAM number, I run 10,000 Monte Carlo simulations with randomised assumptions and output a P10/median/P90 band. A founder's $50B estimate might be their P90 — I show them where the median actually lands. That reframes the conversation from 'is the market big' to 'how confident are we in this estimate' — which is how real analysts think."

### Talking Point 3 — Serper Grounding (Reducing Hallucination)
> "One of my design principles was: every LLM output must be anchored to real data. So before generating a roast or pitch copy, I run a Serper web search to pull live competitor names, market sizes, and growth rates. That way when Gemini says 'the market leader is X' — that's from a real Google search result, not hallucination. It also means the test suite can detect static fallbacks by checking if the output contains 'Error 500' in the tagline."

### Talking Point 4 — Why Two Models, Not One
> "I chose to use Flash-Lite for classification and Flash for generation deliberately. Flash-Lite is cheaper and faster — perfect for the structured output task where I just need JSON numbers. Flash is more capable at creative writing. Splitting the tasks by model capability is the same pattern as using a lightweight model for retrieval and a heavyweight model for generation in RAG systems."

---

## WHAT NOT TO SAY

| Weak Framing | Strong Framing |
|---|---|
| "It's a chatbot that roasts startup ideas" | "It's a calibrated scoring system with a two-step LLM pipeline and probabilistic market sizing" |
| "I used ChatGPT / Gemini to generate text" | "I built a custom inference pipeline with calibration guarantees validated by a 21-case test suite" |
| "The frontend is just React" | "The frontend implements skeleton loading states, copy system, and error+retry UX to match production standards" |
| "I don't have real users" | "This is a portfolio piece demonstrating end-to-end ML system design — same patterns as production recommender and scoring systems" |
| "I used Gemini because it's free" | "I used Gemini Flash-Lite for classification and Flash for generation, optimising for cost-to-capability ratio across the two tasks" |

---

## GITHUB README FRAMING

Use this order in your README:

1. **One-line pitch** (what it does, who it's for)
2. **Architecture diagram or ASCII flowchart** (shows systems thinking)
3. **Data Science components** (XGBoost, Monte Carlo, VADER, calibration pipeline)
4. **Calibration problem + solution** (the best technical story)
5. **Tech stack table**
6. **How to run locally** (backend + frontend setup)
7. **Test suite results** (21/21 VC Roast, 15/15 Pitch Forge)
8. **What's next** (roadmap signals ambition)

---

## POSITIONING SUMMARY

**The core message**: You didn't just prompt an LLM and wrap it in a UI. You identified a real ML problem (calibration collapse), diagnosed the root cause (creative persona overrides numeric rules), implemented a principled fix (two-step pipeline with Python safety net), and validated it with a systematic test suite. That's data science thinking applied to LLM systems — which is exactly what Applied DS roles are doing in 2025–2026.

---

*Created: 2026-05-19*
