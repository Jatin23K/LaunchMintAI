"""
Phase 3 Validation — Sentiment Pipeline
"""
from sentiment import analyze_competitors

test_cases = [
    {"competitors": ["Clio", "Harvey AI", "Ironclad"],  "sector": 6},
    {"competitors": ["Stripe", "Plaid", "Unknown Corp"], "sector": 1},
    {"competitors": ["OpenAI", "Anthropic", "Cohere"],   "sector": 0},
]

print("\n" + "="*60)
print("PHASE 3 VALIDATION — SENTIMENT TEST")
print("="*60)

for tc in test_cases:
    results = analyze_competitors(tc["competitors"], tc["sector"])
    print(f"\nSector {tc['sector']} competitors:")
    for r in results:
        print(f"  {r['name']}")
        print(f"    Known         : {r['known']}")
        print(f"    Pain Score    : {r['pain_score']}/5.0")
        print(f"    Top Complaint : {r['top_complaints'][0]}")
        print(f"    Kill Strategy : {r['kill_strategy'][:60]}...")

print("\n" + "="*60)
print("VALIDATION COMPLETE")
print("="*60)
