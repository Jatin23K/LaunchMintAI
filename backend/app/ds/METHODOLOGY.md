# DS Intelligence Layer — Methodology

## 1. Startup Survival Classifier (XGBoost)
- Training data: 2,000 synthetic startups with stochastic survival labels based on business heuristics
- Features: 10 (has_ai_keyword, is_b2b, sector, idea_length, word_count, is_niche_or_unknown, market_size_score, competition_score, founder_experience, traction_score)
- Word-boundary safe keyword matching via `_has_word()` using `\b` prefix regex to prevent substring false positives
- Post-processing: Rule P1 caps undefined/niche ideas ≤ 0.45, Rule P2 floors AI+B2B ideas ≥ 0.57
- Model: XGBoost binary classifier, persisted with joblib

## 2. Monte Carlo Financial Simulation
- 10,000 simulation runs per idea
- 60-month window, $65,000/month burn rate
- Sector-calibrated CAC, LTV, and churn benchmarks from lookup table
- Outputs: Bear (P10), Base (P50), Bull (P90) runway months, breakeven probability, LTV:CAC ratio

## 3. Competitor Sentiment Analysis (VADER)
- Curated knowledge base of 14 known competitors with real user complaint data
- VADER compound score converted to pain_score out of 5.0
- Sector fallback used for unknown competitors
- Output per competitor: pain score, top complaints, kill strategy

## 4. Pipeline Orchestration
- All 3 modules run independently with isolated try/except (partial failure does not crash the pipeline)
- Sector extracted from classifier output and passed downstream to Monte Carlo and Sentiment
- Unified JSON response: survival / financials / sentiment / meta keys
- Pipeline latency tracked via `pipeline_latency_ms`
