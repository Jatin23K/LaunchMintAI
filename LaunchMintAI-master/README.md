# LaunchMintAI — Brutal Startup Intelligence Engine

> Stop building shit nobody wants.

LaunchMintAI is a production-grade research engine combining dual-layer search grounding, parallel agentic analysis, and an applied ML intelligence layer to validate startup ideas before a single line of product code is written.

![LaunchMintAI Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

![Golden Test](https://img.shields.io/badge/Golden%20Test-50%2F50%20100%25-brightgreen)
![AUC-ROC](https://img.shields.io/badge/AUC--ROC-0.8170-blue)
![F1 Score](https://img.shields.io/badge/F1%20Score-0.7183-blue)
![Stress Test](https://img.shields.io/badge/Stress%20Test-50%2F50-brightgreen)
![Avg Latency](https://img.shields.io/badge/Avg%20Latency-386ms-yellow)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688)
![React](https://img.shields.io/badge/React-19-61DAFB)

---

## What It Does

Most startup validators give you vibes. LaunchMintAI gives you data.

- Pulls **real TAM/CAGR numbers** from McKinsey, Gartner, Statista via Tavily search grounding
- Runs your idea through **20+ specialized analysis modules** in parallel
- Runs an **XGBoost survival classifier** (trained on 2,000 synthetic startups) to predict 5-year survival probability
- Runs **10,000 Monte Carlo simulations** to generate Bear/Base/Bull financial scenarios
- Scrapes **competitor review databases** and scores customer pain using VADER NLP
- Has a **dedicated Skeptic Agent** that cross-references all numbers against source text — throws HTTP 422 if it can't ground the data after 3 retries

---

## Core Intelligence Modules

| Module | What It Does |
|--------|-------------|
| **Validator** | TAM/SAM/SOM extraction, CAGR grounding, adversarial audit, DS Intelligence Layer |
| **War Room** | 6-layer forensic competitor analysis: funding, management, product, tech stack, sentiment, kill strategy |
| **VC Roast** | Ruthless fatal flaw analysis. If your idea survives the roast, it might survive the market |
| **Pitch Forge** | High-conversion taglines, elevator pitches, cold email hooks, value propositions |
| **Delta Analysis** | Strategic comparison between 2 ideas from your archive |

---

## DS Intelligence Layer

The applied ML layer that separates LaunchMintAI from a simple GPT wrapper.

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
| Training Data | 2,000 synthetic startups (12 features) |
| AUC-ROC | **0.8170** |
| F1 Score | **0.7183** |
| Accuracy | 73% |
| Monte Carlo Runs | 10,000 per idea |
| VADER KB | 14 curated competitors |

---

## Eval Layer

A production-grade proof layer — not just a demo.

```
backend/app/ds/eval/
├── dataset.jsonl          50 labeled ideas across 11 domains
├── golden.test.py         Correctness test  →  50/50, 100%
├── benchmark.py           Performance test  →  386ms avg, P95 596ms
├── generate_charts.py     4 evaluation charts
├── EVAL_REPORT.md         Full evaluation report with error analysis
├── results/               JSON + TXT output files
└── charts/                PNG charts (accuracy, survival, rule breakdown, grid)
```

**Domain coverage:** SaaS · AI/ML · FinTech · HealthTech · EdTech · E-Commerce · Consumer · MarketPlace · DeepTech · GreenTech · Web3

**Stress test:** 50 cases across 5 tiers — Basic, Edge, Extreme, Catastrophic (SQL injection / XSS / path traversal), Regression

---

## Extension System

20+ specialized analysis modules built on a plugin architecture:

`market_research` · `competitor_deepdive` · `strategy_war_room` · `business_model` · `financial_projection` · `gtm_strategy` · `roadmap_generator` · `risk_scanner` · `decision_simulator` · `fundraising_intelligence` · `legal_compliance` · `hiring_team` · `metrics_kpi` · `people_analysis` · `user_persona` · `product_storytelling` · `vision_north_star` · `document_intelligence`

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite 6 + Tailwind CSS + Framer Motion |
| Backend | FastAPI (Python 3.10+) + Pydantic |
| LLM | Google Gemini 2.0 Flash (multi-key rotation + failover) |
| Search | Tavily AI (waterfall strategy: McKinsey → BCG → Gartner → Statista first) |
| ML | XGBoost + scikit-learn + VADER NLP |
| Simulation | NumPy Monte Carlo (10K runs) |
| Vector DB | ChromaDB (long-term intelligence persistence) |
| UI Effects | Framer Motion + Lucide Icons + NeuralBackground canvas |

---

## Architecture

### Search Grounding (Waterfall Strategy)
1. **Tier 1 Authority** — McKinsey, BCG, Gartner, Statista prioritized first
2. **AI Judge** — every search result semantically audited by a separate LLM pass to filter SEO garbage
3. **Math Fallback** — if source has Forecast + CAGR but no Current TAM, back-calculates deterministically
4. **Scale Integrity Protocol** — mandatory trillion→billion normalization, explicit scope extraction
5. **Validation Gate** — throws HTTP 422 if primary numbers can't be grounded after 3 retries

### Multi-Agent Pipeline
```
Idea Input
    │
    ├── Validator Agent    → Market data + adversarial audit
    ├── Skeptic Agent      → Cross-references numbers against source text
    ├── DS Pipeline        → XGBoost + Monte Carlo + VADER (parallel)
    └── Extension Hub      → 20+ specialized modules (on-demand)
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Gemini API key (free tier works)
- Tavily API key (free tier: 1,000 searches/month)

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
```

Create `backend/.env`:
```env
GEMINI_API_KEY=your_key
GEMINI_API_KEY_2=optional_rotation_key
TAVILY_API_KEY=your_key
```

Start the server:
```bash
python -m app.main
```

### Frontend Setup
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the app:
```bash
npm run dev
```

---

## Running the Eval Layer

```bash
# Golden test (correctness)
cd backend/app/ds/eval
python golden.test.py

# Benchmark (performance metrics)
python benchmark.py

# Generate evaluation charts
python generate_charts.py

# Full model evaluation (AUC, F1, confusion matrix)
cd backend/app/ds
python evaluate.py

# Stress test suite (50 cases, 5 tiers)
python test_ds_stress.py
```

---

## Project Structure

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for the full annotated file tree.

---

## Disclaimer

LaunchMintAI provides strategic insights based on public data signals and synthetic ML models. It does not replace terminal-velocity execution or the founder's grit. Use it to build better, move faster, and fail less.
