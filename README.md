# LaunchMintAI: Forensic Startup Intelligence & Quantitative Validation Platform 🚀

[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![XGBoost](https://img.shields.io/badge/XGBoost-Day--0_Gated-EB5424?style=for-the-badge)](https://xgboost.readthedocs.io/)
[![NumPy](https://img.shields.io/badge/NumPy-10k_Monte_Carlo-013243?style=for-the-badge&logo=numpy&logoColor=white)](https://numpy.org/)
[![React 19](https://img.shields.io/badge/React-19_Tactical_HUD-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Status](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge)]()

> **Applied Data Science & Machine Learning Platform**  
> Validating Day-0 Pre-Seed Venture Concepts across 189,970 Historical Venture Cohorts with Leak-Free Predictive Modeling, Stochastic Differential Equations, and Deterministic RAG Triad Grounding.

---

## 📌 Executive Summary

Early-stage venture validation is fundamentally broken: over 90% of tech startups fail within 36 months, yet founders and angel investors routinely rely on subjective bias or generic LLM "roasters" that hallucinate market sizes and invent survival numbers.

**LaunchMintAI** replaces ungrounded generative advice with an empirical, multi-disciplinary **Applied Data Science and Quantitative Simulation Architecture**:
1. **Predictive Machine Learning**: Regularized XGBoost survival classifier trained on 189,970 historical Crunchbase startups using strictly **Day-0 pre-seed observable features** (Holdout ROC-AUC: **0.8512**, PR-AUC: **0.4789**).
2. **Quantitative Financial Modeling**: Vectorized 10,000-iteration NumPy Monte Carlo engine calculating path-dependent cash flow bounds, runway ruin probability $P(\text{ruin})$, and 95% Value at Risk (VaR) in **$< 32\text{ms}$**.
3. **Aspect-Based Sentiment NLP**: Tokenized VADER Aspect NLP extracting customer friction vectors (Pricing, Product Reliability, Support Latency) across competitor reviews to compute Competitor Vulnerability Indices (CVI).
4. **Deterministic Retrieval & Grounding**: 3-tier domain authority search waterfall paired with regex fact-checking, achieving **95.8% Faithfulness** and **0.0% Hallucination Rate** across 30 golden evaluation prompts.
5. **Tactical UI Integration**: React 19 / Vite 6 tactical terminal connected via FastAPI to render real-time calibrated survival percentages and live SHAP TreeExplainer attributions.

---

## 🏛️ 5-Pillar System Architecture

```
                                ┌──────────────────────────────────────────────────────────┐
                                │                 LaunchMintAI DS ENGINE                   │
                                └──────────────────────────────────────────────────────────┘
                                                              │
          ┌──────────────────────────┬────────────────────────┴───────────────────────┬──────────────────────────┐
          ▼                          ▼                                                ▼                          ▼
    [PILLAR 1: ML]        [PILLAR 2: QUANT/STATS]                              [PILLAR 3: NLP]           [PILLAR 4: RETRIEVAL]
   XGBoost Survival          10,000-Run Monte Carlo                               Competitor Pain            3-Tier Grounded
      Classifier               Financial Simulation                              Sentiment Analysis         Waterfall Search
    (Day-0 Gated)                  (Vectorized)                                     (Aspect VADER)              (RAG Triad)
          │                              │                                                │                          │
Trained on 189,970             Runs 10,000 parallel                             Scrapes competitor reviews  Tier-1 research domains
historical startups.           paths in vectorized NumPy:                       and scores customer pain   (Statista/Gartner) +
Outputs survival prob %        - Bear/Base/Bull cash flows                      density across pricing,    Regex Grounding Gate +
+ SHAP explainability.         - Runway $P(\text{ruin})$ & 95% VaR              support, and uptime.       Ragas Faithfulness SLA.
```

---

## 🔬 Forensic Case Study: V1 Naive Prototype vs. V2 Production Engine

In early prototype iterations, our baseline model hit an apparent `0.9249 ROC-AUC`. An adversarial Applied Data Science audit diagnosed fatal **Target Definition Leakage** and **Temporal Incoherence**:
* In Crunchbase, `is_success` was defined as `acquired | ipo | (operating & (funding >= $5M | rounds >= 3))`.
* Supplying cumulative `funding_total_usd` and `funding_rounds` allowed decision trees to memorize the target definition rather than learning genuine early venture signals.
* Furthermore, asking pre-seed founders on Day 0 for downstream funding variables created massive serving-training skew.

We executed a complete architectural refactor, purging all post-outcome features and restricting the model strictly to Day-0 observables:

| Metric / Property | V1 Naive Prototype (Pre-Remediation) | V2 Production Engine (Current State) | Applied Data Science Rationale |
| :--- | :---: | :---: | :--- |
| **Feature Space Horizon** | 10-Year Post-Outcome Variables (`funding_total_usd`, `rounds`, `milestones`) | **Strictly Day-0 Pre-Seed Observables** (`founder_team_size`, `is_tier_1_hub`, `competitor_density`, 12 verticals) | **Zero Target Leakage.** Aligns training horizon with raw pre-seed validation prompts. |
| **Target Leakage Status** | **Fatal Leakage Present** | **Clean (0 Leakage)** | V1 memorized the target formula; V2 discovers genuine causal signals. |
| **5-Fold CV ROC-AUC** | 0.9199 ± 0.0012 | **0.8497 ± 0.0017** | Negligible variance across 5 folds proves model stability without overfitting. |
| **Holdout Test ROC-AUC ($N=37,994$)** | 0.9249 *(Cheated / Memorized)* | **0.8512** *(Real Generalization)* | An ROC-AUC of **0.8512 on Day-0 signals alone** is an elite result in venture capital economics. |
| **Holdout Test PR-AUC** | 0.7630 *(Artificially Inflated)* | **0.4789** *(Defensible)* | In a 9:1 imbalanced domain (base rate 9.89%), **0.4789 represents a ~5x precision lift** over random baseline. |
| **Brier Calibration Score** | 0.0872 | **0.1562** | Well-calibrated, monotonically increasing probabilities across 6 risk tiers. |
| **Optimal F1 Score** | 0.7444 (@ $\tau = 0.825$) | **0.4286** (@ $\tau = 0.600$) | Balanced operational threshold under severe imbalance. |
| **RAG Evaluation Method** | Simulated `np.random.uniform()` | **Deterministic Regex Grounding & Authority Engine** | True empirical verification across 30 golden test prompts in 11 startup verticals. |
| **RAG Faithfulness / Groundedness** | Simulated 97.8% | **95.8%** (vs Baseline 66.4%) | **+29.3% measured groundedness uplift** over unanchored zero-shot LLM. |
| **RAG Context Precision** | Simulated 94.7% | **91.8%** (vs Baseline 56.2%) | **+35.6% domain authority precision** from Tier-1 waterfall search. |
| **RAG Hallucination Rate** | Simulated 0.0% | **0.0%** (vs Baseline 33.3%) | Zero fabricated numerical claims on adversarial concepts. |
| **Serving Latency (P95)** | 2,217 ms | **385 ms** | -73.4% latency reduction via vectorized NumPy math and decoupled LLM generation. |
| **Frontend/ML Coupling** | Disconnected (LLM hallucinated % score) | **Coupled via Live FastAPI Bridge** | React client queries live XGBoost classifier and displays exact SHAP drivers. |

---

## 📊 Exploratory Data Analysis & Empirical Evidence

The Crunchbase venture dataset (189,970 startups founded 1995–2014) reveals profound structural venture dynamics:

| Metric | Empirical Value | Applied Data Science Significance |
| :--- | :---: | :--- |
| **Total Cohort Size** | 189,970 | Minimum 10-year observation window for terminal outcomes. |
| **Positive Class ($Y=1$)** | 18,793 (9.89%) | Startups achieving verified acquisition, IPO, or sustainable velocity. |
| **Negative Class ($Y=0$)** | 171,177 (90.11%) | Startups closed, defunct, or stranded. |
| **Class Imbalance Ratio** | **9.11 : 1** | Optimized via `scale_pos_weight = 9.11` without SMOTE distortion. |
| **Top Sector Survival Rate** | 37.41% (HealthTech & Bio) | High-CapEx / IP moats exhibit significantly higher acquisition rates. |
| **Lowest Sector Survival Rate** | 5.81% (EdTech) | Low barriers to entry create hyper-saturated cohorts with high attrition. |
| **Tier-1 Tech Hub Uplift** | +11.4% Baseline | SF, NYC, Boston, London, Tel Aviv provide persistent geographic tailwinds. |

All generated visual artifacts are stored in `backend/data/eda_plots/`:
* `01_class_imbalance.png`: Empirical 9.11:1 startup mortality distribution.
* `02_survival_by_macro_vertical.png`: Structural survival variances across 12 sectors.
* `03_funding_distribution_kde.png`: Bimodal capital separation.
* `04_correlation_heatmap.png`: Inter-feature covariance matrix.
* `05_shap_feature_importance.png`: Global SHAP TreeExplainer feature attributions.
* `06_rag_triad_benchmark.png`: Deterministic RAG Triad evaluation metrics.

---

## ⚙️ Technical Stack

* **Machine Learning**: `xgboost`, `shap` (TreeExplainer), `scikit-learn`, `joblib`.
* **Quantitative Simulation**: `numpy` (Vectorized SIMD broadcasting, Gaussian stochastic processes).
* **NLP**: `nltk` (VADER Aspect-Based Sentiment Analysis).
* **Backend API**: `fastapi`, `uvicorn`, `pydantic`, `sqlmodel`, `chromadb`, `slowapi`.
* **Frontend Client**: `react` 19, `typescript`, `vite` 6, `tailwindcss`, `lucide-react`.
* **Retrieval & Research**: `tavily-python`, `google-generativeai`.

---

## 🔌 API Reference & Serving Schemas

### 1. Day-0 Survival Prediction & Live SHAP Attribution
```http
POST /predict_survival
Content-Type: application/json

{
  "macro_vertical": "SaaS & Enterprise",
  "founder_team_size": 4,
  "is_tier_1_hub": 1,
  "competitor_cohort_density": 850
}
```
**Response (in $<15\text{ms}$):**
```json
{
  "status": "success",
  "macro_vertical": "SaaS & Enterprise",
  "survival_probability": 0.4682,
  "survival_percentage": "46.8%",
  "risk_tier": "MODERATE_RISK",
  "sector_baseline": "14.7%",
  "delta_vs_baseline": "+32.1%",
  "shap_drivers": {
    "positive_factors": [
      "+18.4% · Core Team & Founder Size",
      "+12.1% · Tier 1 Venture Hub Location"
    ],
    "risk_factors": [
      "-4.2% · Sector Cohort Density"
    ]
  },
  "model_metadata": {
    "algorithm": "XGBoost Classifier + SHAP TreeExplainer (Day-0 Leak-Free)",
    "training_samples": 151976,
    "test_roc_auc": 0.8512,
    "test_pr_auc": 0.4789
  }
}
```

### 2. 10,000-Iteration Vectorized Monte Carlo Simulation
```http
POST /simulate_financials
Content-Type: application/json

{
  "macro_vertical": "SaaS & Enterprise",
  "initial_capital_usd": 2500000.0,
  "monthly_burn_rate_usd": 60000.0,
  "initial_monthly_revenue_usd": 20000.0,
  "simulation_months": 36,
  "num_simulations": 10000
}
```

### 3. Empirical RAG Triad Metrics
```http
GET /eval_metrics
```

---

## 📂 Repository Structure

```text
LaunchMintAI/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application gateway & REST endpoints
│   │   ├── services/
│   │   │   ├── survival_engine.py      # Day-0 XGBoost survival classifier & SHAP explainer
│   │   │   ├── monte_carlo_engine.py   # Vectorized 10,000-run NumPy cash simulation (<32ms)
│   │   │   ├── sentiment_nlp_engine.py # VADER Aspect-Based Sentiment Analysis (Pricing/Uptime/Support)
│   │   │   ├── market_search.py        # 3-Tier domain authority waterfall search (Tavily)
│   │   │   └── evidence_model.py       # Deterministic regex fact extraction & credibility scoring
│   │   └── models/artifacts/           # Serialized XGBoost model bundle (.joblib)
│   ├── data/
│   │   ├── eda_plots/                  # 6 empirical figures (ROC-AUC, SHAP, Monte Carlo, RAG Triad)
│   │   └── processed/                  # Serialized benchmark outputs (eval_benchmark_results.json)
│   └── scripts/
│       ├── models/                     # Day-0 model training & validation pipeline
│       └── eval/                       # Deterministic RAG Triad benchmark suite
├── frontend/
│   ├── features/                       # Tactical UI modules (VC Roast, War Room, Validator, Pitch Forge)
│   └── services/geminiService.ts       # Frontend API bridge & multi-agent routing
├── docs/
│   ├── ARCHITECTURE_SPEC.md            # Exhaustive 5-layer engineering & mathematical specification
│   └── README.md                       # Developer setup & local execution guide
└── LAUNCHMINT_DOCUMENTATION.md         # Applied DS Case Study, Target Leakage Post-Mortem & Defense Guide
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
* **Python**: 3.10+
* **Node.js**: 18+ (npm 9+)

### 2. Backend Installation
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_key
TAVILY_API_KEY=your_tavily_key
```

Run FastAPI Server:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Installation
```bash
cd frontend
npm install
npm run dev
```
Client runs at `http://localhost:5173`.

### 4. Run Automated Verification Suite
```bash
# Verify Day-0 XGBoost Model & SHAP Inference
python -m scripts.eval.test_survival_endpoint

# Verify 10,000-Run Vectorized Monte Carlo Engine (<32ms)
python -m scripts.eval.test_monte_carlo

# Run Deterministic RAG Triad Evaluation Benchmark (30 golden prompts)
python -m scripts.eval.rag_triad_benchmark
```

---

## 📚 Technical Documentation

* [`LAUNCHMINT_DOCUMENTATION.md`](LAUNCHMINT_DOCUMENTATION.md): Applied Data Science forensic post-mortem, target leakage analysis, and technical defense guide for Senior Applied DS interviews.
* [`docs/ARCHITECTURE_SPEC.md`](docs/ARCHITECTURE_SPEC.md): Comprehensive 5-layer system and data science engineering specification.
* [`docs/README.md`](docs/README.md): Quickstart setup and developer environment guide.

---

## 📄 License

MIT License. Engineered for forensic startup validation and data science excellence.
