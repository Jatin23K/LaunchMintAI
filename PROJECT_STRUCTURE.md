# LaunchMintAI — Project Structure

```
LaunchMintAI/
│
├── .github/
│   └── workflows/
│       └── ds-eval.yml               # CI/CD: golden test + stress test + frontend build
│
├── backend/                          # FastAPI Backend
│   ├── .env.example                  # Template — copy to .env and fill keys
│   ├── requirements.txt              # Pinned dependencies
│   ├── requirements_ds.txt           # DS-specific dependencies (XGBoost, VADER, etc.)
│   ├── railway.toml                  # Railway deployment config
│   └── app/
│       ├── main.py                   # FastAPI entry point + CORS + all endpoints
│       │
│       ├── models/
│       │   └── schemas.py            # Pydantic request/response models
│       │
│       ├── services/                 # Core Intelligence Services
│       │   ├── __init__.py
│       │   ├── llm_engine.py         # Gemini Flash + multi-key rotation + all endpoints
│       │   │                         # /analyze, /war_room, /vc_roast, /pitch_forge, /compare
│       │   ├── market_search.py      # Tavily 3-tier waterfall search
│       │   ├── database.py           # SQLite + SQLModel persistence
│       │   ├── vector_db.py          # ChromaDB long-term intelligence
│       │   ├── ocr_engine.py         # Document OCR pipeline
│       │   └── scraper_engine.py     # Web scraping layer
│       │
│       ├── extensions/               # Plugin Architecture (18 modules)
│       │   ├── market_research/      # TAM/SAM/SOM + CAGR grounding
│       │   ├── competitor_deepdive/  # 6-layer forensic competitor analysis
│       │   ├── strategy_war_room/    # Art-of-War kill strategies
│       │   ├── business_model/       # Revenue model + canvas
│       │   ├── financial_projection/ # 3-year financial modeling
│       │   ├── gtm_strategy/         # Go-to-market playbook
│       │   ├── roadmap_generator/    # 90-day product roadmap
│       │   ├── risk_scanner/         # Risk matrix + mitigations
│       │   ├── decision_simulator/   # Scenario decision trees
│       │   ├── fundraising_intelligence/ # Investor fit + pitch strategy
│       │   ├── legal_compliance/     # Compliance checklist
│       │   ├── hiring_team/          # Hiring plan + org chart
│       │   ├── metrics_kpi/          # KPI framework
│       │   ├── people_analysis/      # Founder + team analysis
│       │   ├── user_persona/         # User persona generation
│       │   ├── product_storytelling/ # Narrative + positioning
│       │   ├── vision_north_star/    # Long-term vision framing
│       │   └── document_intelligence/ # PDF/doc parsing + analysis
│       │
│       └── ds/                       # DS Intelligence Layer ★
│           ├── classifier.py         # XGBoost survival classifier (train + predict)
│           ├── monte_carlo.py        # 10K-run Bear/Base/Bull financial simulation
│           ├── sentiment.py          # VADER competitor pain analysis (14-company KB)
│           ├── pipeline.py           # Orchestrator (parallel threads)
│           ├── evaluate.py           # Model eval: AUC, F1, confusion matrix
│           ├── METHODOLOGY.md        # DS methodology documentation
│           ├── models/
│           │   ├── startup_classifier.pkl  # Trained XGBoost model
│           │   └── confusion_matrix.png    # Evaluation artifact
│           ├── test_ds_stress.py     # 50-case stress test (5 tiers)
│           └── eval/                 # Eval Proof Layer ★★
│               ├── dataset.jsonl     # 50 labeled ideas · 11 domains · ground-truth sourced
│               ├── golden.test.py    # Correctness → 50/50, 100%
│               ├── benchmark.py      # Performance → 386ms avg, P95 596ms
│               ├── generate_charts.py # 4 evaluation charts (PNG)
│               ├── EVAL_REPORT.md    # Full report with error analysis + domain breakdown
│               ├── results/
│               │   ├── golden_results.json
│               │   ├── benchmark_results.json
│               │   └── benchmark_results.txt
│               └── charts/
│                   ├── chart1_accuracy_by_domain.png
│                   ├── chart2_survival_by_domain.png
│                   ├── chart3_rule_breakdown.png
│                   └── chart4_accuracy_grid.png
│
├── frontend/                         # React 19 + TypeScript + Vite 6
│   ├── .env.example                  # Template — copy to .env
│   ├── vercel.json                   # Vercel SPA routing config
│   ├── index.html
│   ├── index.tsx                     # React entry point
│   ├── index.css                     # Global styles
│   ├── App.tsx                       # Root: 4-tab navigation + global state
│   ├── types.ts                      # All TypeScript interfaces
│   ├── config.ts                     # API base URL + environment config
│   ├── vite.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   │
│   ├── services/                     # Frontend Service Layer
│   │   ├── api.ts                    # Axios client + retry logic
│   │   ├── cache.ts                  # Validator result cache (used by Forge)
│   │   └── geminiService.ts          # Direct Gemini calls (client-side)
│   │
│   ├── components/                   # Shared UI Components
│   │   ├── NeuralBackground.tsx      # Animated particle canvas
│   │   ├── HUD.tsx                   # Left/Right tactical HUD overlays
│   │   ├── DSInsights.tsx            # DS Intelligence Layer UI (3 cards)
│   │   ├── ForensicReport.tsx        # War Room forensic report UI
│   │   ├── AnalysisHeader.tsx        # Shared analysis header
│   │   ├── ErrorBoundary.tsx         # React error boundary
│   │   ├── HistoryDrawer.tsx         # Analysis history drawer
│   │   ├── RiskBadge.tsx             # Risk tier badge component
│   │   ├── AgentCard.tsx
│   │   ├── AgentPipeline.tsx
│   │   ├── AgentStatus.tsx
│   │   ├── FeatureCards.tsx
│   │   ├── Navbar.tsx
│   │   └── tools/
│   │       └── CompetitorDeepDive.tsx
│   │
│   └── features/                     # 4 Core Tab Modules
│       ├── validator/
│       │   └── Validator.tsx         # Startup validation + DS layer + War Room intel
│       │                             # Fires /analyze + /ds_insights + /war_room in parallel
│       ├── vc-roast/
│       │   └── VCRoast.tsx           # VC skeptic — Tavily-grounded competitor intel injected
│       ├── pitch-forge/
│       │   └── PitchForge.tsx        # Pitch generator — seeded with Validator cache data
│       └── delta-analysis/
│           └── DeltaAnalysis.tsx     # Battle Room: Compare Arena — 2 ideas vs /compare API
│
├── INTERVIEW.md                      # Complete DS interview prep for this project
├── PROJECT_STRUCTURE.md              # This file
├── README.md                         # Project overview + DS eval results + setup guide
├── .gitignore
└── LICENSE                           # MIT
```

---

## Tab Architecture

| Tab | Backend Endpoints | Grounding |
|-----|------------------|-----------|
| **Validator** | `/analyze` + `/ds_insights` + `/war_room` (parallel) | Tavily waterfall search |
| **VC Roast** | `/vc_roast` | Tavily competitor search injected into prompt |
| **Pitch Forge** | `/pitch_forge` | Validator cache (TAM, growth, top competitor) |
| **Battle Room** | `/compare` | Market data from both saved Validator results |

---

## DS Intelligence Layer Architecture

```
User Idea (string)
        │
        ▼
┌─────────────────────────────────────────────┐
│              pipeline.py                    │
│         (parallel threads)                  │
├──────────────┬──────────────┬───────────────┤
│              │              │               │
▼              ▼              ▼               │
classifier.py  monte_carlo.py sentiment.py   │
(XGBoost)      (Monte Carlo)  (VADER NLP)    │
│              │              │               │
▼              ▼              ▼               │
survival_prob  Bear/Base/Bull  pain_scores    │
risk_tier      runway_months   kill_strategy  │
confidence_band breakeven_prob top_complaints │
└──────────────┴──────────────┴───────────────┘
                      │
                      ▼
              /ds_insights (FastAPI)
                      │
                      ▼
              DSInsights.tsx
        (SurvivalCard + MonteCarloCard + SentimentCard)
```

---

## Eval Layer Results

| Metric | Result |
|--------|--------|
| Golden Test Accuracy | 50/50 — 100% |
| AUC-ROC | 0.8170 |
| F1 Score | 0.7183 |
| Stress Test | 50/50 — 5 tiers |
| Avg Pipeline Latency | 386ms |
| P95 Latency | 596ms |
| Dataset | 50 ideas × 11 domains |
