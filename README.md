# LaunchMintAI — Brutal Startup Intelligence Engine

> Stop building shit nobody wants.

LaunchMintAI is a production-grade research engine combining dual-layer search grounding, parallel agentic analysis, a calibrated two-step LLM pipeline, and an applied ML intelligence layer to validate startup ideas before a single line of product code is written.


[![Live Demo](https://img.shields.io/badge/Live%20Demo-launch--mint--ai.vercel.app-brightgreen)](https://launch-mint-ai.vercel.app)
[![DS Eval Pipeline](https://github.com/Jatin23K/LaunchMintAI/actions/workflows/ds-eval.yml/badge.svg)](https://github.com/Jatin23K/LaunchMintAI/actions/workflows/ds-eval.yml)
![Golden Test](https://img.shields.io/badge/Golden%20Test-50%2F50%20100%25-brightgreen)
![VC Roast Test](https://img.shields.io/badge/VC%20Roast%20Test-21%2F21%20100%25-brightgreen)
![Pitch Forge Test](https://img.shields.io/badge/Pitch%20Forge%20Test-30%2F30%20100%25-brightgreen)
![AUC-ROC](https://img.shields.io/badge/AUC--ROC-0.8170-blue)
![F1 Score](https://img.shields.io/badge/F1%20Score-0.7183-blue)
![Stress Test](https://img.shields.io/badge/Stress%20Test-50%2F50-brightgreen)
![Avg Latency](https://img.shields.io/badge/Avg%20Latency-386ms-yellow)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.128-009688)
![React](https://img.shields.io/badge/React-19-61DAFB)
![License](https://img.shields.io/badge/License-MIT-green)

---

## What It Does

Most startup validators give you vibes. LaunchMintAI gives you data.

- Pulls **real TAM/CAGR numbers** from McKinsey, Gartner, Statista via Serper + Tavily search grounding
- Runs your idea through **20+ specialized analysis modules** in parallel
- Runs an **XGBoost survival classifier** trained on 2,000 synthetic startups to predict 5-year survival probability
- Runs **10,000 Monte Carlo simulations** to generate Bear/Base/Bull financial scenarios
- Scores **competitor customer pain** using VADER NLP on a curated 14-competitor knowledge base
- Roasts your idea with a **two-step calibrated LLM pipeline** — neutral classifier locks the score, creative writer delivers the verdict, Python overwrites unconditionally
- Generates **investor-ready pitch copy** grounded in live market data from web search

---

## 4 Core Tabs

| Tab | What It Does |
|-----|-------------|
| **Validator** | TAM/SAM/SOM extraction, CAGR grounding, adversarial audit, DS Intelligence Layer + full forensic competitor analysis (kill strategies, SWOT, funding intel) |
| **VC Roast** | Ruthless fatal flaw analysis with calibrated survival scoring across 6 idea tiers — two-step LLM pipeline prevents score collapse, validated 21/21 across diverse idea types |
| **Pitch Forge** | High-conversion taglines, elevator pitches, cold email hooks, value propositions — seeded with real market numbers from the Validator cache or live web search |
| **Battle Room** | Compare Arena — pit two validated ideas head-to-head across 5 dimensions, AI declares a winner |

---

## DS Intelligence Layer

The applied ML layer that separates LaunchMintAI from a GPT wrapper.

```
User Idea
    │
    ▼
┌───────────────────────────────────────────┐
│              DS Pipeline                  │
│           (parallel threads)              │
├─────────────┬─────────────┬───────────────┤
│ XGBoost     │ Monte Carlo │  VADER NLP    │
│ Classifier  │ Simulation  │  Sentiment    │
│             │             │               │
│ survival %  │ Bear/Base/  │ pain_score    │
│ risk_tier   │ Bull runway │ kill_strategy │
│ conf_band   │ breakeven   │ top_complaints│
└─────────────┴─────────────┴───────────────┘
    │
    ▼
/ds_insights endpoint (FastAPI)
    │
    ▼
DSInsights UI (3 real-time cards)
```

### Model Performance

| Metric | Value |
|--------|-------|
| Algorithm | XGBoost Binary Classifier |
| Training Data | 2,000 synthetic startups · 10 features |
| AUC-ROC | **0.8170** |
| F1 Score | **0.7183** |
| Accuracy | 73% |
| Monte Carlo Runs | 10,000 per idea |
| VADER Competitor KB | 14 curated competitors |

---

## VC Roast — Two-Step Calibrated LLM Pipeline

The hardest engineering problem in this project: **LLM calibration**.

A single-prompt model collapsed all scores to 12–15% regardless of idea quality. The root cause: creative personas override numeric rules — LLMs are reasoners, not rule-followers. Adding more rules to the prompt didn't fix it.

**The fix: a two-step pipeline with three enforcement layers.**

```
User Idea
    │
    ├──► [Parallel]
    │       ├── Serper Web Search (live competitor data)
    │       └── Flash-Lite Classifier (neutral, no persona)
    │               └── Tier 1–6 · survival % · verdict locked
    │
    ▼
Flash Roaster (creative writer)
    └── Receives pre-locked numbers via prompt injection
    └── Writes fatal flaw analysis, kill shot, investment verdict
    │
    ▼
Python Safety Net
    └── data["survival_chance"] = survival_chance  ← unconditional overwrite
```

**Three enforcement layers:**
1. **Classifier prompt** — neutral tone, no persona, structured JSON output with Tier 1–6 classification
2. **Roaster prompt** — receives `{tier}`, `{survival_chance}`, `{verdict}` pre-injected; cannot override them
3. **Python code** — unconditionally overwrites the score after the LLM response, regardless of what the model wrote

**Result:** 21/21 test ideas score in the correct calibrated range across all 6 tiers. Ideas are deliberately different from prompt examples — proving generalisation, not memorisation.

| Tier | Example | Survival Range |
|------|---------|---------------|
| T1 — Consumer clone | Dating app for gamers | 5–15% |
| T2 — Thin B2B feature | Social media scheduler | 12–25% |
| T3 — Vertical SaaS | PT clinic management | 21–40% |
| T4 — Enterprise AI | Mortgage doc automation | 41–60% |
| T5 — Category challenger | AI vs QuickBooks | 55–72% |
| T6 — Platform play | Full OS replacement | 65–85% |

---

## Pitch Forge — Market-Grounded Copy Generation

Pitch Forge generates five investor-ready outputs from a single idea:

| Field | What It Is |
|-------|-----------|
| `tagline` | ≤10-word hook (≤10 words enforced in test suite) |
| `elevator_pitch` | 2–3 sentence pitch for founders |
| `value_proposition` | Customer-facing benefit statement |
| `tweet_thread_hook` | ≤280-char viral opener (character counter in UI) |
| `cold_email_subject` | High open-rate subject line |

**Market grounding fallback chain:**
1. Pulls `market_size`, `growth_rate`, `top_competitor` from Validator cache (if idea was already validated)
2. Falls back to live Serper web search for independent market context
3. Graceful degradation if both unavailable — no silent failures

**Test suite:** 30 ideas across 5 tiers (T1 consumer → T5 platform replacement), validated for static fallback detection, jargon-free copy, tweet length, and field completeness.

---

## Eval Layer

A proof layer — not just a demo.

```
backend/app/ds/eval/
├── dataset.jsonl       50 labeled ideas · 11 domains · ground-truth sourced
├── golden.test.py      Correctness  →  50/50  100%
├── benchmark.py        Performance  →  386ms avg · P95 596ms
├── generate_charts.py  4 evaluation charts (PNG)
├── EVAL_REPORT.md      Full report with error analysis
├── results/            JSON + TXT outputs
└── charts/             Accuracy · Survival · Rule breakdown · Grid
```

**Domains:** SaaS · AI/ML · FinTech · HealthTech · EdTech · E-Commerce · Consumer · MarketPlace · DeepTech · GreenTech · Web3

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 · TypeScript · Vite 6 · Tailwind CSS · Framer Motion |
| Backend | FastAPI 0.128 · Python 3.10+ · Pydantic |
| LLM (Primary) | Google Gemini 2.5 Flash — creative generation, full reports |
| LLM (Classifier) | Google Gemini 2.5 Flash-Lite — neutral tier classification (cheaper, faster) |
| Search | Serper (Google grounding) · Tavily AI (McKinsey → BCG → Gartner waterfall) |
| ML | XGBoost 2.0 · scikit-learn · VADER NLP |
| Simulation | NumPy Monte Carlo (10K runs) |
| Vector DB | ChromaDB (long-term intelligence persistence) |
| Key Management | 6-key rotation pool per provider with automatic failover |

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Gemini API key — [aistudio.google.com](https://aistudio.google.com) (free tier works)
- Serper API key — [serper.dev](https://serper.dev) (free: 2,500 searches/month)
- Tavily API key — [tavily.com](https://tavily.com) (free: 1,000 searches/month, optional)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
cp .env.example .env           # then fill in your API keys
python -m app.main
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env           # set VITE_API_BASE_URL
npm run dev
```

### Run the Test Suites
```bash
# DS correctness test (50/50)
cd backend/app/ds/eval && python golden.test.py

# DS performance benchmark
python benchmark.py

# Full model evaluation (AUC, F1, confusion matrix)
cd backend/app/ds && python evaluate.py

# DS stress test (50 cases, 5 tiers)
python test_ds_stress.py

# VC Roast calibration test (21 ideas, all tiers)
python test_vc_roast.py

# Pitch Forge output quality test (30 ideas, 5 tiers)
python test_pitch_forge.py
```

---

## CI/CD

GitHub Actions runs on every push to `master`:
1. **DS Golden Test** — validates all 50 eval cases pass
2. **DS Stress Test** — runs 50-case stress suite (only if golden passes)
3. **Frontend Build** — verifies Vite build succeeds

See [`.github/workflows/ds-eval.yml`](.github/workflows/ds-eval.yml)

---

## Project Structure

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for the full annotated file tree.

---

## License

MIT — see [LICENSE](LICENSE)
