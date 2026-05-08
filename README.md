# LaunchMintAI — Brutal Startup Intelligence Engine

> Stop building shit nobody wants.

LaunchMintAI is a production-grade research engine combining dual-layer search grounding, parallel agentic analysis, and an applied ML intelligence layer to validate startup ideas before a single line of product code is written.

![LaunchMintAI Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-launch--mint--ai.vercel.app-brightgreen)](https://launch-mint-ai.vercel.app)
[![DS Eval Pipeline](https://github.com/Jatin23K/LaunchMintAI/actions/workflows/ds-eval.yml/badge.svg)](https://github.com/Jatin23K/LaunchMintAI/actions/workflows/ds-eval.yml)
![Golden Test](https://img.shields.io/badge/Golden%20Test-50%2F50%20100%25-brightgreen)
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

- Pulls **real TAM/CAGR numbers** from McKinsey, Gartner, Statista via Tavily search grounding
- Runs your idea through **20+ specialized analysis modules** in parallel
- Runs an **XGBoost survival classifier** trained on 2,000 synthetic startups to predict 5-year survival probability
- Runs **10,000 Monte Carlo simulations** to generate Bear/Base/Bull financial scenarios
- Scores **competitor customer pain** using VADER NLP on a curated 14-competitor knowledge base
- Has a **dedicated Skeptic Agent** that cross-references all numbers against source text — throws HTTP 422 if it can't ground the data after 3 retries

---

## Core Intelligence Modules

| Module | What It Does |
|--------|-------------|
| **Validator** | TAM/SAM/SOM extraction, CAGR grounding, adversarial audit, DS Intelligence Layer |
| **War Room** | 6-layer forensic competitor analysis: funding, management, product, tech stack, sentiment, kill strategy |
| **VC Roast** | Ruthless fatal flaw analysis — if your idea survives the roast, it might survive the market |
| **Pitch Forge** | High-conversion taglines, elevator pitches, cold email hooks, value propositions |
| **Delta Analysis** | Strategic comparison between two ideas from your archive |

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
| LLM | Google Gemini 2.0 Flash (multi-key rotation + failover) |
| Search | Tavily AI (waterfall: McKinsey → BCG → Gartner → Statista) |
| ML | XGBoost 2.0 · scikit-learn · VADER NLP |
| Simulation | NumPy Monte Carlo (10K runs) |
| Vector DB | ChromaDB (long-term intelligence persistence) |

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Gemini API key](https://aistudio.google.com/app/apikey) (free tier works)
- [Tavily API key](https://tavily.com) (free tier: 1,000 searches/month)

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

### Run the Eval Layer
```bash
# Correctness test (50/50)
cd backend/app/ds/eval && python golden.test.py

# Performance benchmark
python benchmark.py

# Full model evaluation (AUC, F1, confusion matrix)
cd backend/app/ds && python evaluate.py

# Stress test suite (50 cases, 5 tiers)
python test_ds_stress.py
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
