"""
Layer 2: XGBoost Startup Survival Classifier & SHAP Explainability Engine
Trains a production XGBoost model on 189,970 historical startups with 5-fold CV,
computes SHAP feature attributions, and exports the serialized model artifact.
"""

import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
import numpy as np
import pandas as pd
import joblib
from pathlib import Path

from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.metrics import (
    roc_auc_score, average_precision_score, precision_recall_curve,
    f1_score, precision_score, recall_score, brier_score_loss
)
import xgboost as xgb
import shap
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Setup paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
ARTIFACTS_DIR = BASE_DIR / "app" / "models" / "artifacts"
EDA_PLOTS_DIR = BASE_DIR / "data" / "eda_plots"

ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
EDA_PLOTS_DIR.mkdir(parents=True, exist_ok=True)

# Day-Zero Pre-Seed Observable Features (100% Leak-Free)
DAY_ZERO_NUMERICAL_FEATURES = [
    'founder_team_size',
    'is_tier_1_hub',
    'competitor_cohort_density'
]

# Legacy V1 Leaked Features (Retained strictly for baseline ablation comparison)
V1_LEAKED_FEATURES = [
    'funding_rounds',
    'log_funding_usd',
    'log_avg_round_size_usd',
    'time_to_first_funding_days',
    'founder_team_size',
    'milestone_count',
    'competitor_cohort_density',
    'is_tier_1_hub',
    'has_funding'
]

# Production uses strictly Day-Zero features
NUMERICAL_FEATURES = DAY_ZERO_NUMERICAL_FEATURES

MACRO_VERTICALS = [
    'SaaS & Enterprise', 'FinTech & Commerce', 'AI & Data Intelligence',
    'HealthTech & Bio', 'Consumer Web & Media', 'Hardware & DeepTech',
    'CleanTech & Energy', 'EdTech', 'Security & Infrastructure',
    'Mobile & Social', 'Marketplace & Logistics', 'Other'
]

def prepare_features(df, use_day_zero=True):
    """Encodes categorical and numerical features into clean feature matrix X, y."""
    num_cols = DAY_ZERO_NUMERICAL_FEATURES if use_day_zero else V1_LEAKED_FEATURES
    X_num = df[num_cols].copy()
    
    # One-hot encode macro verticals with consistent columns
    for vert in MACRO_VERTICALS:
        col_name = f"vertical_{vert.lower().replace(' & ', '_').replace(' ', '_')}"
        X_num[col_name] = (df['macro_vertical'] == vert).astype(int)
        
    y = df['is_success'].values
    feature_names = list(X_num.columns)
    return X_num, y, feature_names

def train():
    print("=" * 75, flush=True)
    print("🚀 LAYER 2: TRAINING XGBOOST STARTUP SURVIVAL CLASSIFIER", flush=True)
    print("=" * 75, flush=True)

    parquet_path = PROCESSED_DIR / "startups_features.parquet"
    if not parquet_path.exists():
        print(f"❌ Error: {parquet_path} not found!", flush=True)
        sys.exit(1)

    df = pd.read_parquet(parquet_path)
    print(f"📥 Loaded {len(df):,} startup records.", flush=True)

    # Prepare features and labels
    X, y, feature_names = prepare_features(df)
    print(f"   Feature Matrix Shape: {X.shape} ({len(feature_names)} features)", flush=True)

    # Stratified 80/20 Train-Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"   Train set: {len(X_train):,} | Test set: {len(X_test):,}", flush=True)

    # Calculate class weight to handle 9.11:1 imbalance
    neg_count = int(np.sum(y_train == 0))
    pos_count = int(np.sum(y_train == 1))
    scale_pos_weight = float(neg_count / max(1, pos_count))
    print(f"   Class Imbalance Weight (scale_pos_weight): {scale_pos_weight:.2f}", flush=True)

    # Initialize XGBoost Classifier
    model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        min_child_weight=3,
        gamma=0.1,
        scale_pos_weight=scale_pos_weight,
        eval_metric='aucpr',
        random_state=42,
        tree_method='hist'
    )

    # 1. 5-Fold Stratified Cross-Validation on Training Set
    print("\n🔄 Running 5-Fold Stratified Cross-Validation...", flush=True)
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_roc_scores = []
    cv_pr_scores = []

    for fold, (train_idx, val_idx) in enumerate(skf.split(X_train, y_train), 1):
        X_tr, y_tr = X_train.iloc[train_idx], y_train[train_idx]
        X_val, y_val = X_train.iloc[val_idx], y_train[val_idx]
        
        fold_model = xgb.XGBClassifier(
            n_estimators=200, max_depth=6, learning_rate=0.05,
            subsample=0.85, colsample_bytree=0.85,
            scale_pos_weight=scale_pos_weight, eval_metric='aucpr',
            random_state=42, tree_method='hist'
        )
        fold_model.fit(X_tr, y_tr, verbose=False)
        val_proba = fold_model.predict_proba(X_val)[:, 1]
        
        fold_roc = roc_auc_score(y_val, val_proba)
        fold_pr = average_precision_score(y_val, val_proba)
        cv_roc_scores.append(fold_roc)
        cv_pr_scores.append(fold_pr)
        print(f"   Fold {fold}/5 -> ROC-AUC: {fold_roc:.4f} | PR-AUC: {fold_pr:.4f}", flush=True)

    print(f"   Mean CV ROC-AUC:  {np.mean(cv_roc_scores):.4f} (+/- {np.std(cv_roc_scores):.4f})", flush=True)
    print(f"   Mean CV PR-AUC:   {np.mean(cv_pr_scores):.4f} (+/- {np.std(cv_pr_scores):.4f})", flush=True)

    # 2. Fit on Full Training Set
    print("\n⚡ Fitting final model on full training set (300 trees)...", flush=True)
    model.fit(
        X_train, y_train,
        eval_set=[(X_train, y_train), (X_test, y_test)],
        verbose=False
    )

    # 3. Evaluate on Unseen Test Set
    print("Evaluating on Holdout Test Set...", flush=True)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    # Calculate optimal threshold by maximizing F1 score
    precisions, recalls, thresholds = precision_recall_curve(y_test, y_pred_proba)
    f1_scores = 2 * (precisions * recalls) / np.clip(precisions + recalls, 1e-8, None)
    best_idx = np.argmax(f1_scores)
    optimal_threshold = float(thresholds[best_idx]) if best_idx < len(thresholds) else 0.5
    
    y_pred_optimal = (y_pred_proba >= optimal_threshold).astype(int)

    test_roc_auc = roc_auc_score(y_test, y_pred_proba)
    test_pr_auc = average_precision_score(y_test, y_pred_proba)
    test_f1 = f1_score(y_test, y_pred_optimal)
    test_precision = precision_score(y_test, y_pred_optimal)
    test_recall = recall_score(y_test, y_pred_optimal)
    test_brier = brier_score_loss(y_test, y_pred_proba)

    print("\n" + "=" * 75, flush=True)
    print("📈 HOLDOUT TEST EVALUATION BENCHMARK RESULTS", flush=True)
    print("=" * 75, flush=True)
    print(f"ROC-AUC (Discrimination):             {test_roc_auc:.4f}", flush=True)
    print(f"PR-AUC (Precision-Recall AUC):        {test_pr_auc:.4f}", flush=True)
    print(f"Optimal F1 Score (Threshold={optimal_threshold:.3f}):    {test_f1:.4f}", flush=True)
    print(f"Precision @ Optimal Threshold:        {test_precision:.4f}", flush=True)
    print(f"Recall @ Optimal Threshold:           {test_recall:.4f}", flush=True)
    print(f"Brier Calibration Loss:               {test_brier:.4f}", flush=True)
    print("-" * 75, flush=True)

    # 4. SHAP Feature Explainability
    print("\n🧠 Computing SHAP TreeExplainer Feature Attributions...", flush=True)
    explainer = shap.TreeExplainer(model)
    X_shap_sample = X_test.iloc[:1500]
    shap_values = explainer.shap_values(X_shap_sample)

    # Export SHAP Feature Importance Plot
    plt.style.use('dark_background')
    fig = plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values, X_shap_sample, feature_names=feature_names, show=False, max_display=12)
    plt.title("XGBoost Survival Model: SHAP Feature Importance (TreeExplainer)", fontsize=12, fontweight='bold', pad=12)
    plt.tight_layout()
    shap_plot_path = EDA_PLOTS_DIR / "05_shap_feature_importance.png"
    plt.savefig(shap_plot_path, dpi=200, bbox_inches='tight')
    plt.close()
    print(f"   Saved SHAP Feature Importance Plot: {shap_plot_path}", flush=True)

    # 5. Package & Save Production Model Artifact Bundle
    model_bundle = {
        "model": model,
        "feature_names": feature_names,
        "numerical_features": NUMERICAL_FEATURES,
        "macro_verticals": MACRO_VERTICALS,
        "optimal_threshold": optimal_threshold,
        "metrics": {
            "roc_auc": round(float(test_roc_auc), 4),
            "pr_auc": round(float(test_pr_auc), 4),
            "f1_score": round(float(test_f1), 4),
            "precision": round(float(test_precision), 4),
            "recall": round(float(test_recall), 4),
            "brier_score": round(float(test_brier), 4),
            "total_training_samples": len(X_train)
        }
    }

    artifact_path = ARTIFACTS_DIR / "xgboost_survival_model.joblib"
    joblib.dump(model_bundle, artifact_path)
    print(f"\n💾 Production Model Artifact Bundle Saved to:\n   -> {artifact_path}", flush=True)
    print("=" * 75, flush=True)
    print("✅ Layer 2 XGBoost Training & SHAP Pipeline Complete!", flush=True)

    return model_bundle

if __name__ == '__main__':
    train()
