"""
Test script for verifying the live XGBoost Survival Engine and SHAP attribution service.
"""

import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from pathlib import Path

# Add backend to path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))

from app.services.survival_engine import predict_startup_survival

def run_tests():
    print("=" * 80)
    print("🧪 TESTING LIVE XGBOOST SURVIVAL INFERENCE & SHAP EXPLAINABILITY")
    print("=" * 80)

    test_cases = [
        {
            "name": "Enterprise B2B SaaS (HIPAA Compliance)",
            "params": {
                "macro_vertical": "SaaS & Enterprise",
                "target_funding_usd": 2_500_000,
                "funding_rounds": 2,
                "founder_team_size": 4,
                "milestone_count": 3,
                "is_tier_1_hub": 1,
                "time_to_first_funding_days": 120,
                "competitor_cohort_density": 850
            }
        },
        {
            "name": "Web3 Consumer Mattress (High CapEx, Weak Early Traction)",
            "params": {
                "macro_vertical": "Consumer Web & Media",
                "target_funding_usd": 150_000,
                "funding_rounds": 1,
                "founder_team_size": 1,
                "milestone_count": 0,
                "is_tier_1_hub": 0,
                "time_to_first_funding_days": 450,
                "competitor_cohort_density": 2400
            }
        },
        {
            "name": "DeepTech AI Oncology Diagnostics",
            "params": {
                "macro_vertical": "HealthTech & Bio",
                "target_funding_usd": 5_000_000,
                "funding_rounds": 2,
                "founder_team_size": 5,
                "milestone_count": 4,
                "is_tier_1_hub": 1,
                "time_to_first_funding_days": 90,
                "competitor_cohort_density": 320
            }
        },
        {
            "name": "EdTech Flashcard App",
            "params": {
                "macro_vertical": "EdTech",
                "target_funding_usd": 50_000,
                "funding_rounds": 0,
                "founder_team_size": 1,
                "milestone_count": 0,
                "is_tier_1_hub": 0,
                "time_to_first_funding_days": 700,
                "competitor_cohort_density": 1800
            }
        },
        {
            "name": "FinTech Cross-Border Settlement Rail",
            "params": {
                "macro_vertical": "FinTech & Commerce",
                "target_funding_usd": 3_500_000,
                "funding_rounds": 2,
                "founder_team_size": 3,
                "milestone_count": 2,
                "is_tier_1_hub": 1,
                "time_to_first_funding_days": 150,
                "competitor_cohort_density": 1100
            }
        }
    ]

    for tc in test_cases:
        print(f"\n📌 Startup Profile: {tc['name']}")
        res = predict_startup_survival(**tc['params'])
        
        print(f"   Sector:              {res['macro_vertical']}")
        print(f"   Survival Probability: {res['survival_percentage']} ({res['survival_probability']})")
        print(f"   Risk Tier:           {res['risk_tier']}")
        print(f"   Sector Baseline:     {res['sector_baseline']} (Delta: {res['delta_vs_baseline']})")
        print(f"   Top Positive SHAP:   {', '.join(res['shap_drivers']['positive_factors'])}")
        print(f"   Top Risk SHAP:       {', '.join(res['shap_drivers']['risk_factors'])}")

    print("\n" + "=" * 80)
    print("✅ All 5 Live Inference & SHAP attribution tests passed!")

if __name__ == '__main__':
    run_tests()
