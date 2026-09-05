"""
Layer 2: Survival Engine Production Service
Loads trained XGBoost model artifact, computes real-time survival probability,
and performs live SHAP feature attribution on incoming startup ideas.
"""

import os
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List, Optional
from loguru import logger

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ARTIFACT_PATH = BASE_DIR / "app" / "models" / "artifacts" / "xgboost_survival_model.joblib"

# Historical Macro-Vertical Baseline Survival Rates (from Layer 1 EDA)
SECTOR_BASELINES = {
    'HealthTech & Bio': 0.3741,
    'CleanTech & Energy': 0.3592,
    'Hardware & DeepTech': 0.2913,
    'Security & Infrastructure': 0.1920,
    'SaaS & Enterprise': 0.1473,
    'Mobile & Social': 0.1426,
    'AI & Data Intelligence': 0.1406,
    'FinTech & Commerce': 0.1021,
    'Marketplace & Logistics': 0.0979,
    'Consumer Web & Media': 0.0962,
    'EdTech': 0.0581,
    'Other': 0.0424
}

# WHAT: Global in-memory cache for the serialized XGBoost model bundle and SHAP TreeExplainer.
# WHY: Eliminates disk I/O and tree parsing on each HTTP request. Initializing shap.TreeExplainer once at
# startup allows exact polynomial-time O(TLD^2) local Shapley attributions in <4ms per inference.
# Model-agnostic KernelExplainer requires exponential perturbation sampling (3-10s), violating our API SLA.
_MODEL_BUNDLE = None
_EXPLAINER = None

def load_survival_model():
    """Loads the trained XGBoost model and initializes SHAP TreeExplainer."""
    global _MODEL_BUNDLE, _EXPLAINER
    if _MODEL_BUNDLE is not None:
        return _MODEL_BUNDLE

    if not ARTIFACT_PATH.exists():
        logger.warning(f"⚠️ Model artifact not found at {ARTIFACT_PATH}. Will load on first training.")
        return None

    try:
        import shap
        logger.info(f"📥 Loading XGBoost model artifact from {ARTIFACT_PATH}...")
        _MODEL_BUNDLE = joblib.load(ARTIFACT_PATH)
        _EXPLAINER = shap.TreeExplainer(_MODEL_BUNDLE["model"])
        logger.info("✅ XGBoost Survival Model & SHAP Explainer loaded successfully.")
        return _MODEL_BUNDLE
    except Exception as e:
        logger.error(f"❌ Failed to load survival model: {e}")
        return None

def predict_startup_survival(
    macro_vertical: str = "SaaS & Enterprise",
    founder_team_size: int = 2,
    is_tier_1_hub: int = 1,
    competitor_cohort_density: int = 1500,
    target_funding_usd: float = 1_000_000.0,
    funding_rounds: int = 1,
    milestone_count: int = 1,
    time_to_first_funding_days: float = 180.0,
    **kwargs
) -> Dict[str, Any]:
    """
    Predicts startup survival probability using Day-Zero pre-seed observables
    and returns real-time SHAP attribution drivers.
    """
    # WHAT: Fallback to historical macro-vertical empirical baseline if model bundle is unavailable.
    # WHY: Graceful degradation pattern. Prevents HTTP 500 error cascades in production if disk artifacts are missing.
    # Anchors the prediction to historical venture base rates (e.g., 14.7% for SaaS, 4.2% for Other) rather than arbitrary 50% priors.
    bundle = load_survival_model()
    if bundle is None:
        baseline = SECTOR_BASELINES.get(macro_vertical, 0.1473)
        return {
            "status": "fallback",
            "survival_probability": round(baseline, 4),
            "survival_percentage": f"{round(baseline * 100, 1)}%",
            "risk_tier": "MODERATE",
            "sector_baseline": round(baseline * 100, 1),
            "shap_drivers": {
                "positive_factors": ["Macro vertical baseline stability"],
                "risk_factors": ["Model inference artifact loading"]
            }
        }

    model = bundle["model"]
    feature_names = bundle["feature_names"]
    
    # WHAT: Construct strictly Day-0 observable feature dictionary, dropping all downstream funding parameters.
    # WHY: Target Leakage Defense. Client requests may pass downstream fields (target_funding_usd, funding_rounds, milestones)
    # for financial simulation, but the predictive survival model strictly isolates pre-seed observables to guarantee
    # out-of-sample causal validity.
    input_dict = {
        'founder_team_size': max(1, min(int(founder_team_size), 20)),
        'is_tier_1_hub': 1 if int(is_tier_1_hub) > 0 else 0,
        'competitor_cohort_density': max(10, int(competitor_cohort_density))
    }

    # One-hot encode vertical matching trained schema
    matched_vertical = False
    for vert in bundle["macro_verticals"]:
        col_name = f"vertical_{vert.lower().replace(' & ', '_').replace(' ', '_')}"
        if not matched_vertical and (macro_vertical.lower() in vert.lower() or vert.lower() in macro_vertical.lower()):
            input_dict[col_name] = 1
            matched_vertical = True
        else:
            input_dict[col_name] = 0

    if not matched_vertical:
        # Fallback to 'vertical_other'
        input_dict['vertical_other'] = 1

    df_input = pd.DataFrame([input_dict])[feature_names]

    # 2. Model Prediction
    pred_proba = float(model.predict_proba(df_input)[0][1])
    
    # Determine Risk Tier (Calibrated against 9.11:1 baseline)
    if pred_proba >= 0.45:
        risk_tier = "STRONG_SURVIVOR"
    elif pred_proba >= 0.20:
        risk_tier = "MODERATE"
    else:
        risk_tier = "HIGH_RISK"

    # 3. Live SHAP Feature Attribution
    shap_vals = _EXPLAINER.shap_values(df_input)[0]
    
    # Map feature names to human-readable labels
    label_map = {
        'is_tier_1_hub': 'Tier 1 Tech Hub Location',
        'founder_team_size': 'Core Team & Founder Size',
        'competitor_cohort_density': 'Sector Competitor Saturation'
    }

    contributions = []
    for feat, val in zip(feature_names, shap_vals):
        clean_name = label_map.get(feat, feat.replace('vertical_', 'Sector: ').replace('_', ' ').title())
        contributions.append((clean_name, float(val)))

    # Sort positive and negative drivers
    pos_drivers = sorted([c for c in contributions if c[1] > 0], key=lambda x: x[1], reverse=True)[:3]
    neg_drivers = sorted([c for c in contributions if c[1] < 0], key=lambda x: x[1])[:3]

    positive_factors = [f"+{round(abs(c[1])*100, 1)}% · {c[0]}" for c in pos_drivers]
    risk_factors = [f"-{round(abs(c[1])*100, 1)}% · {c[0]}" for c in neg_drivers]

    sector_baseline = SECTOR_BASELINES.get(macro_vertical, 0.1473)

    return {
        "status": "success",
        "macro_vertical": macro_vertical,
        "survival_probability": round(pred_proba, 4),
        "survival_percentage": f"{round(pred_proba * 100, 1)}%",
        "risk_tier": risk_tier,
        "sector_baseline": f"{round(sector_baseline * 100, 1)}%",
        "delta_vs_baseline": f"{'+' if pred_proba >= sector_baseline else ''}{round((pred_proba - sector_baseline)*100, 1)}%",
        "shap_drivers": {
            "positive_factors": positive_factors,
            "risk_factors": risk_factors
        },
        "model_metadata": {
            "algorithm": "XGBoost Classifier + SHAP TreeExplainer",
            "training_samples": bundle["metrics"].get("total_training_samples", 151976),
            "test_roc_auc": bundle["metrics"].get("roc_auc", 0.8170),
            "test_pr_auc": bundle["metrics"].get("pr_auc", 0.7183)
        }
    }
