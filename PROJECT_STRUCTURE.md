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
│   ├── railway.toml                  # Railway deployment config
│   └── app/
│       ├── main.py                   # FastAPI entry point + CORS + extension registry
│       │
│       ├── services/                 # Core Intelligence Services
│       │   ├── llm_engine.py         # Gemini 2.0 Flash + multi-key rotation + /analyze endpoint
│       │   ├── market_search.py      # Tavily waterfall search strategy
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
│           ├── monte_carlo.py        # 10K-run financial simulation
│           ├── sentiment.py          # VADER competitor pain analysis
│           ├── pipeline.py           # Orchestrator (parallel execution)
│           ├── evaluate.py           # Model eval: AUC, F1, confusion matrix
│           ├── METHODOLOGY.md        # DS methodology documentation
│           ├── models/
│           │   ├── startup_classifier.pkl  # Trained XGBoost model
│           │   └── confusion_matrix.png    # Evaluation artifact
│           ├── test_ds_stress.py     # 50-case stress test (5 tiers)
│           └── eval/                 # Eval Proof Layer ★★
│               ├── dataset.jsonl     # 50 labeled ideas · 11 domains
│               ├── golden.test.py    # Correctness → 50/50, 100%
│               ├── benchmark.py      # Performance → 386ms avg, P95 596ms
│               ├── generate_charts.py # 4 evaluation charts
│               ├── EVAL_REPORT.md    # Full report with error analysis
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
│   ├── index.tsx
│   ├── App.tsx                       # Root: tab navigation + global state
│   ├── types.ts                      # All TypeScript interfaces
│   ├── vite.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   │
│   ├── components/                   # Shared UI Components
│   │   ├── NeuralBackground.tsx      # Animated particle canvas
│   │   ├── HUD.tsx                   # Left/Right tactical HUD overlays
│   │   ├── DSInsights.tsx            # DS Intelligence Layer UI (3 cards)
│   │   ├── AgentCard.tsx
│   │   ├── AgentPipeline.tsx
│   │   ├── AgentStatus.tsx
│   │   ├── FeatureCards.tsx
│   │   ├── Navbar.tsx
│   │   └── tools/
│   │       └── CompetitorDeepDive.tsx
│   │
│   └── features/                     # Feature Modules
│       ├── validator/
│       │   └── Validator.tsx         # Core startup validation + DS layer
│       ├── vc-roast/
│       │   └── VCRoast.tsx           # Ruthless VC skeptic analysis
│       ├── pitch-forge/
│       │   └── PitchForge.tsx        # High-conversion pitch generator
│       ├── war-room/
│       │   └── WarRoom.tsx           # Corporate spy / competitor intel
│       └── delta-analysis/
│           └── DeltaAnalysis.tsx     # Strategic delta between ideas
│
├── .github/workflows/ds-eval.yml    # CI/CD pipeline
├── .gitignore
├── LICENSE                          # MIT
├── README.md                        # This file
└── PROJECT_STRUCTURE.md             # This file
```

---

## DS Intelligence Layer Architecture

```
User Idea (string)
        │
        ▼
┌─────────────────────────────────────────────┐
│              pipeline.py                    │
│         (parallel execution)                │
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
│              │              │               │
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
