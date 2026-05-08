"""
Phase 1 Validation — run this to confirm classifier works.
"""
from classifier import predict

test_cases = [
    {"idea": "AI Legal Assistant for Small Businesses",  "market": {}},
    {"idea": "Social Network for Teenagers",             "market": {}},
    {"idea": "SaaS CRM for Plumbers",                   "market": {}},
    {"idea": "Blockchain for Toasters",                  "market": {}},
    {"idea": "Fintech Payment Platform for Freelancers", "market": {}},
]

print("\n" + "="*60)
print("PHASE 1 VALIDATION — CLASSIFIER TEST")
print("="*60)

for tc in test_cases:
    result = predict(tc["idea"], tc["market"])
    print(f"\nIdea   : {tc['idea']}")
    print(f"  Score: {result['survival_probability']} "
          f"[{result['confidence_band'][0]} – {result['confidence_band'][1]}]")
    print(f"  Tier : {result['risk_tier']}")
    print(f"  Risks: {result['top_risk_factors']}")

print("\n" + "="*60)
print("VALIDATION COMPLETE")
print("="*60)
