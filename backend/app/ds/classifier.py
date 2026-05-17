"""
Startup Success Classifier — Phase 1
XGBoost binary classifier trained on synthetic startup data.
"""

import os
import re
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List

from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    roc_auc_score, f1_score,
    precision_score, recall_score
)

def _has_word(text: str, keywords: list) -> bool:
    """
    Prefix word-boundary match.
    \b before keyword prevents 'ai' matching inside 'blockchain'.
    No trailing \b allows plural/compound forms:
      'business' matches 'businesses', 'businessman'
      'legal' matches 'legal', 'legally'
    """
    for kw in keywords:
        pattern = r'\b' + re.escape(kw)
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False

# ── Paths ──────────────────────────────────────────────────────────────────
DS_DIR    = Path(__file__).parent
MODEL_PATH = DS_DIR / "models" / "startup_classifier.pkl"

# ── Sector Keyword Map ─────────────────────────────────────────────────────
SECTOR_MAP = {
    0: ["ai", "machine learning", "llm", "gpt", "neural", "deep learning"],
    1: ["fintech", "finance", "payment", "banking", "insurance"],
    2: ["health", "medical", "healthcare", "biotech", "pharma"],
    3: ["education", "edtech", "learning", "tutoring"],
    4: ["saas", "software", "platform", "api", "developer", "tool"],
    5: ["ecommerce", "marketplace", "retail", "shopping"],
    6: ["legal", "compliance", "law", "contract"],
    7: ["logistics", "delivery", "transport", "supply chain"],
    8: ["real estate", "proptech", "property", "housing"],
    9: ["other"]
}

AI_KEYWORDS         = ["ai", "artificial intelligence", "machine learning",
                        "ml", "llm", "gpt", "neural", "deep learning", "nlp"]
B2B_KEYWORDS        = ["saas", "enterprise", "b2b", "business", "api",
                        "platform", "developer", "crm", "erp", "tool"]
B2C_KEYWORDS        = ["consumer", "app", "social", "marketplace",
                        "retail", "shopping", "delivery"]
REGULATORY_SECTORS  = ["health", "medical", "legal", "finance",
                        "banking", "insurance", "pharma"]

WINNERS = {
    6: ["Ironclad", "Harvey AI", "Clio"],
    1: ["Stripe", "Plaid", "Brex"],
    2: ["Oscar Health", "Ro", "Noom"],
    0: ["OpenAI", "Anthropic", "Cohere"],
    4: ["Notion", "Linear", "Figma"],
    3: ["Duolingo", "Coursera", "Quizlet"],
    5: ["Shopify", "Klaviyo", "Gorgias"],
    7: ["Flexport", "project44", "Samsara"],
    8: ["Opendoor", "Compass", "Loft"],
    9: ["YC alumni", "a16z portfolio", "Sequoia-backed"]
}

LOSERS = {
    6: ["Atrium", "UpCounsel"],
    1: ["Wonga", "Dave"],
    2: ["Theranos", "Forward Health"],
    0: ["Stability AI (challenges)", "Jasper (declining)"],
    4: ["Quibi", "Clubhouse"],
    3: ["Udacity (pivoted)", "Outschool"],
    5: ["Fab.com", "Jet.com"],
    7: ["Shypdirect", "Bringg"],
    8: ["Cadre", "RealtyShares"],
    9: ["Single-feature apps", "Copycat products"]
}


# ── Feature Extractor ──────────────────────────────────────────────────────

def extract_sector(idea: str) -> int:
    idea_lower = idea.lower()
    for sector_id, keywords in SECTOR_MAP.items():
        if sector_id == 9:
            continue
        if _has_word(idea_lower, keywords):
            return sector_id
    return 9


def feature_extractor(idea: str, market_data: dict = None) -> dict:
    """
    Maps raw idea string + optional market JSON into a 9-feature vector.
    All features are numeric for XGBoost compatibility.
    """
    if market_data is None:
        market_data = {}

    idea_lower = idea.lower()

    # 1. Market size (TAM in billions)
    raw_size = market_data.get("current_tam") or market_data.get("size", "")
    try:
        market_size_b = float(re.sub(r"[^\d.]", "", str(raw_size)))
        if market_size_b > 10000:          # trillion listed as million — normalize
            market_size_b = market_size_b / 1000
    except (ValueError, TypeError):
        market_size_b = 5.0     # conservative default

    # 2. Market growth (CAGR %)
    raw_growth = market_data.get("growth", "")
    try:
        market_growth_pct = float(re.sub(r"[^\d.]", "", str(raw_growth)))
    except (ValueError, TypeError):
        market_growth_pct = 8.0  # conservative default

    # 3. Competition level  1=low 2=medium 3=high
    n_competitors = len(market_data.get("competitors", []))
    if n_competitors >= 3:
        competition_level = 3
    elif n_competitors == 2:
        competition_level = 2
    else:
        competition_level = 1

    # 4. AI keyword presence
    has_ai_keyword  = int(_has_word(idea_lower, AI_KEYWORDS))

    # 5-6. B2B / B2C flags
    is_b2b          = int(_has_word(idea_lower, B2B_KEYWORDS))
    is_b2c          = int(_has_word(idea_lower, B2C_KEYWORDS))

    # 7. Regulatory risk
    regulatory_risk = int(_has_word(idea_lower, REGULATORY_SECTORS))

    # 8. Idea word count (signal for specificity)
    idea_word_count = len(idea.split())

    # 9. Sector encoded
    sector_encoded = extract_sector(idea)
    is_niche_or_unknown = int(sector_encoded == 9)

    return {
        "market_size_b":     market_size_b,
        "market_growth_pct": market_growth_pct,
        "competition_level": competition_level,
        "has_ai_keyword":    has_ai_keyword,
        "is_b2b":            is_b2b,
        "is_b2c":            is_b2c,
        "regulatory_risk":   regulatory_risk,
        "idea_word_count":   idea_word_count,
        "sector_encoded":    sector_encoded,
        "is_niche_or_unknown": is_niche_or_unknown,
    }


# ── Synthetic Data Generator ───────────────────────────────────────────────

def generate_synthetic_data(n_samples: int = 3000) -> pd.DataFrame:
    """
    Generates realistic synthetic startup training data.
    Label = 1 (success/acquired), 0 (failure/closed).
    Rules based on real startup outcome research.
    """
    np.random.seed(42)
    rows = []

    for _ in range(n_samples):
        sector       = np.random.randint(0, 10)
        market_size  = np.random.exponential(scale=25)        # most markets < $50B
        growth_pct   = np.random.uniform(2, 45)
        competition  = np.random.choice([1, 2, 3], p=[0.2, 0.45, 0.35])
        has_ai       = np.random.choice([0, 1], p=[0.55, 0.45])
        is_b2b       = np.random.choice([0, 1], p=[0.35, 0.65])
        is_b2c       = 1 - is_b2b
        reg_risk     = int(sector in [1, 2, 6])
        word_count   = np.random.randint(3, 12)

        # ── Success probability formula ──────────────────────────────────
        # Grounded in startup research heuristics
        score = 0.30                                   # base rate

        # Large, fast-growing markets reward entrants
        score += min(market_size / 200, 0.15)
        score += min(growth_pct / 150, 0.10)

        # B2B has higher success rates than B2C
        score += 0.08 if is_b2b else -0.04

        # AI is currently a tailwind
        score += 0.13 if has_ai else 0.0

        # High competition is a headwind
        score -= (competition - 1) * 0.06

        # Regulatory risk reduces survival odds
        score -= 0.02 if reg_risk else 0.0

        # Penalty for ideas with no recognizable sector or business model
        if sector == 9 and not is_b2b and not is_b2c:
            score -= 0.18

        # Unknown/niche sectors are harder to underwrite
        score -= 0.06 if sector == 9 else 0.0

        # Specificity (more words = more focused idea)
        score += 0.01 if word_count > 5 else -0.01

        # Clamp to [0.05, 0.95]
        score = float(np.clip(score, 0.05, 0.95))

        # Stochastic label from probability
        label = int(np.random.random() < score)

        rows.append({
            "market_size_b":     round(market_size, 2),
            "market_growth_pct": round(growth_pct, 2),
            "competition_level": competition,
            "has_ai_keyword":    has_ai,
            "is_b2b":            is_b2b,
            "is_b2c":            is_b2c,
            "regulatory_risk":   reg_risk,
            "idea_word_count":   word_count,
            "sector_encoded":    sector,
            "is_niche_or_unknown": int(sector == 9),
            "label":             label,
        })

    return pd.DataFrame(rows)


# ── Trainer ────────────────────────────────────────────────────────────────

FEATURE_COLS = [
    "market_size_b", "market_growth_pct", "competition_level",
    "has_ai_keyword", "is_b2b", "is_b2c", "regulatory_risk",
    "idea_word_count", "sector_encoded", "is_niche_or_unknown",
]

def train_and_save() -> XGBClassifier:
    print("[CLASSIFIER] No saved model found. Training now...")
    df = generate_synthetic_data(n_samples=3000)

    X = df[FEATURE_COLS]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="logloss",   # use_label_encoder removed: deprecated+removed in XGBoost 2.x
        random_state=42,
    )
    model.fit(X_train, y_train)

    # ── Evaluation ───────────────────────────────────────────────────────
    y_prob = model.predict_proba(X_test)[:, 1]
    y_pred = model.predict(X_test)

    auc  = roc_auc_score(y_test, y_prob)
    f1   = f1_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec  = recall_score(y_test, y_pred)

    print("=" * 50)
    print("--- [CLASSIFIER] TRAINING RESULTS")
    print(f"   AUC-ROC   : {auc:.4f}")
    print(f"   F1 Score  : {f1:.4f}")
    print(f"   Precision : {prec:.4f}")
    print(f"   Recall    : {rec:.4f}")
    print(f"   Train size: {len(X_train)} | Test size: {len(X_test)}")
    print("=" * 50)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"[CLASSIFIER] Model saved -> {MODEL_PATH}")
    return model


def load_model() -> XGBClassifier:
    if os.path.exists(str(MODEL_PATH)):
        print("[CLASSIFIER] Loading saved model from pkl...")
        return joblib.load(MODEL_PATH)
    return train_and_save()


# ── Predictor ──────────────────────────────────────────────────────────────

_model: XGBClassifier = None   # module-level cache — only loads once per process

def predict(idea: str, market_data: dict = None) -> Dict:
    """
    Main entry point.
    Input : idea string + optional market_data dict from /analyze
    Output: survival prediction dict
    """
    global _model
    if _model is None:
        _model = load_model()

    features = feature_extractor(idea, market_data)
    X = pd.DataFrame([features])[FEATURE_COLS]

    raw_prob  = float(_model.predict_proba(X)[0][1])
    prob      = raw_prob if not (raw_prob != raw_prob) else 0.40  # NaN guard → default 40%

    # ── Post-processing Override (Rule P1) ────────────────────────
    # Deterministic cap for ideas with no recognizable sector,
    # no business model signal, and no AI keyword.
    # These are structurally undefined ideas — model cannot score reliably.
    # Same pattern as TLDR Shield D1-D7 rules.
    is_undefined_idea = (
        features["sector_encoded"] == 9
        and features["has_ai_keyword"] == 0
        and features["is_b2b"] == 0
        and features["is_b2c"] == 0
    )
    if is_undefined_idea:
        prob = min(prob, 0.28)

    # ── Post-processing Override (Rule P2) ────────────────────────
    # Floor boost for high-confidence B2B AI ideas in a recognized sector.
    # These have strong structural signals that the synthetic model
    # underweights due to training data distribution.
    is_strong_ai_b2b = (
        features["has_ai_keyword"] == 1
        and features["is_b2b"] == 1
        and features["sector_encoded"] != 9
    )
    if is_strong_ai_b2b:
        prob = max(prob, 0.57)
    # ─────────────────────────────────────────────────────────────
    # ─────────────────────────────────────────────────────────────

    ci_low    = round(max(0.0, prob - 0.13), 2)
    ci_high   = round(min(1.0, prob + 0.13), 2)

    # Risk tier
    if prob >= 0.70:
        risk_tier = "Low"
    elif prob >= 0.50:
        risk_tier = "Medium"
    elif prob >= 0.30:
        risk_tier = "High"
    else:
        risk_tier = "Critical"

    # Risk factors
    risk_factors: List[str] = []
    if features["competition_level"] == 3:
        risk_factors.append("Saturated market — 3+ established competitors")
    if features["regulatory_risk"]:
        risk_factors.append("High regulatory exposure in this sector")
    if not features["is_b2b"]:
        risk_factors.append("B2C markets have lower average survival rates")
    if features["market_growth_pct"] < 8:
        risk_factors.append("Slow-growth market limits revenue ceiling")
    if not risk_factors:
        risk_factors.append("No critical risk flags detected")

    sector = features["sector_encoded"]

    # Explain which rules fired
    rule_applied = "none"
    if is_undefined_idea:
        rule_applied = "P1_cap (undefined niche → ≤0.28)"
    elif is_strong_ai_b2b:
        rule_applied = "P2_floor (AI+B2B → ≥0.57)"

    feature_explanation = {
        "sector": ["AI", "Fintech", "Healthcare", "EdTech", "SaaS",
                   "E-Commerce", "LegalTech", "Logistics", "RealEstate", "Other"][sector],
        "is_b2b": bool(features.get("is_b2b")),
        "has_ai_keyword": bool(features.get("has_ai_keyword")),
        "rule_applied": rule_applied,
        "confidence_band_method": "fixed ±0.13 margin (not calibrated)",
        "training_note": "Model trained on 2,000 synthetic startups with heuristic labels",
    }

    return {
        "survival_probability": round(prob, 2),
        "confidence_band":      [ci_low, ci_high],
        "risk_tier":            risk_tier,
        "top_risk_factors":     risk_factors[:3],
        "similar_winners":      WINNERS.get(sector, WINNERS[9])[:2],
        "similar_losers":       LOSERS.get(sector, LOSERS[9])[:2],
        "model_version":        "xgb_v1",
        "features_used":        features,
        "feature_explanation":  feature_explanation,
    }
