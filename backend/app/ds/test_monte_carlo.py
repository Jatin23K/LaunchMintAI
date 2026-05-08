"""
Phase 2 Validation — Monte Carlo
"""
from monte_carlo import simulate

test_cases = [
    {"idea": "AI Legal Assistant",    "sector": 6},
    {"idea": "Fintech Platform",      "sector": 1},
    {"idea": "Social Network",        "sector": 9},
]

print("\n" + "="*60)
print("PHASE 2 VALIDATION — MONTE CARLO TEST")
print("="*60)

for tc in test_cases:
    result = simulate(sector=tc["sector"])
    print(f"\nIdea   : {tc['idea']} (sector {tc['sector']})")
    print(f"  Bear : {result['bear']['runway_months']} months runway")
    print(f"  Base : {result['base']['runway_months']} months runway")
    print(f"  Bull : {result['bull']['runway_months']} months runway")
    print(f"  Break-even probability : {result['breakeven_probability']}")
    print(f"  LTV:CAC ratio          : {result['ltv_cac_ratio']}")
    print(f"  Simulations run        : {result['simulations_run']}")

print("\n" + "="*60)
print("VALIDATION COMPLETE")
print("="*60)
