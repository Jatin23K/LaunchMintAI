# LaunchMintAI: Quickstart & Developer Guide 🛠️

> **Production Edition**: 2.0.0 (Applied Data Science & Machine Learning Architecture)  
> **Backend**: FastAPI + XGBoost + NumPy Vectorized Monte Carlo + ChromaDB  
> **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS  

---

## 📌 Overview

LaunchMintAI provides forensic startup validation by replacing hallucination-prone LLM business advice with an empirical, multi-disciplinary Data Science and Machine Learning architecture:
* **Predictive ML**: Day-0 leak-free XGBoost survival classifier trained on 189,970 startups (0.8512 Holdout ROC-AUC).
* **Quantitative Simulation**: 10,000-run vectorized NumPy Monte Carlo engine computing runway ruin probability $P(\text{ruin})$ and 95% VaR.
* **Aspect NLP**: VADER Aspect-Based Sentiment Analysis scoring competitor customer friction.
* **Deterministic Grounding**: 3-tier waterfall search with regex verification achieving 95.8% faithfulness and 0.0% hallucination.

---

## 💻 Prerequisites

* **Python**: 3.10 or higher
* **Node.js**: 18.0 or higher (npm 9+)
* **Git**: Installed and configured

---

## 🚀 Step-by-Step Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Jatin23K/LaunchMintAI.git
cd LaunchMintAI
```

### 2. Backend Setup (FastAPI & ML Pipeline)
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install all dependencies (FastAPI, XGBoost, SHAP, NumPy, ChromaDB, etc.)
pip install -r requirements.txt
```

#### Environment Variables (`backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
# Required for agentic synthesis & grounded research:
GEMINI_API_KEY=your_gemini_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here

# Optional: Key rotation for high-concurrency evaluation
GEMINI_API_KEY_2=your_second_gemini_key
GEMINI_API_KEY_3=your_third_gemini_key
```

#### Verify the Pre-Trained Model
Ensure the retrained Day-0 model bundle exists at:
`backend/app/models/artifacts/xgboost_survival_model.joblib`

*(If you wish to re-train the model from scratch across the 189k Crunchbase dataset, run `python -m scripts.models.train_xgboost_survival`)*.

#### Start Backend Server
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The API documentation will be available at `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Setup (React 19 / Vite)
Open a new terminal:
```bash
cd frontend

# Install Node dependencies
npm install

# Start development server
npm run dev
```
The application will launch at `http://localhost:5173`.

---

## 🧪 Verification & Benchmark Suite

Run the automated verification suite to confirm model inference and system integrity:

```bash
# In the backend directory with venv activated:

# 1. Test Day-0 Survival Model & SHAP Explainer
python -m scripts.eval.test_survival_endpoint

# 2. Test 10,000-Iteration Vectorized Monte Carlo Simulation
python -m scripts.eval.test_monte_carlo

# 3. Run Deterministic RAG Triad Evaluation Benchmark (30 golden prompts)
python -m scripts.eval.rag_triad_benchmark
```

All benchmark figures and JSON results will output to:
* `backend/data/processed/eval_benchmark_results.json`
* `backend/data/eda_plots/05_shap_feature_importance.png`
* `backend/data/eda_plots/06_rag_triad_benchmark.png`

---

## 📖 Deep-Dive Documentation

For full architectural specifications, target leakage audits, and statistical defenses, refer to:
* [`LAUNCHMINT_DOCUMENTATION.md`](../LAUNCHMINT_DOCUMENTATION.md): Applied Data Science case study, flaw post-mortem, and senior interview guide.
* [`ARCHITECTURE_SPEC.md`](ARCHITECTURE_SPEC.md): Complete 5-layer engineering specification.
