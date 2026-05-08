"""
LaunchMintAI DS Layer — Golden Test Suite
50 labeled startup ideas across 11 domains
Ground truth: Rule P1/P2 (deterministic) + CB Insights + Startup Genome
Run: python -m app.ds.eval.golden.test (from backend/)
"""
import sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from app.ds.pipeline import run as ds_run

PASS = "PASS"
FAIL = "FAIL"
results = []

def check(label, condition, detail=""):
    status = PASS if condition else FAIL
    results.append({"label": label, "status": status, "detail": detail})
    icon = "[PASS]" if condition else "[FAIL]"
    print(f"{icon} {label}")
    if detail:
        print(f"       {detail}")

def run(idea):
    return ds_run(idea=idea, market_data={}, competitors=[])

# Load dataset
dataset_path = os.path.join(os.path.dirname(__file__), "dataset.jsonl")
with open(dataset_path, "r", encoding="utf-8") as f:
    dataset = [json.loads(line) for line in f if line.strip()]

print("\n" + "="*65)
print(f"LaunchMintAI DS Layer — Golden Test Suite ({len(dataset)} cases)")
print("="*65)

domain_stats = {}

for entry in dataset:
    idea_id   = entry["id"]
    idea      = entry["idea"]
    domain    = entry["domain"]
    expected  = entry["expected"]
    source    = entry["ground_truth_source"]

    result = run(idea)
    survival  = result.get("survival", {})
    financials = result.get("financials", {})

    score = survival.get("survival_probability", -1)
    bp    = financials.get("breakeven_probability", -1)
    ltv   = financials.get("ltv_cac_ratio", -1)

    s_min = expected["survival_min"]
    s_max = expected["survival_max"]
    bp_min = expected["breakeven_prob_min"]
    ltv_min = expected["ltv_cac_min"]

    survival_ok = s_min <= score <= s_max
    bp_ok       = bp >= bp_min
    ltv_ok      = ltv >= ltv_min
    all_ok      = survival_ok and bp_ok and ltv_ok

    label = f"[{idea_id}] {idea[:45]}"
    detail = (
        f"survival={score:.3f} (expect {s_min}–{s_max}) | "
        f"breakeven={bp:.2f} (min {bp_min}) | "
        f"ltv_cac={ltv:.2f} (min {ltv_min}) | "
        f"source={source}"
    )
    check(label, all_ok, detail)

    if domain not in domain_stats:
        domain_stats[domain] = {"passed": 0, "failed": 0}
    if all_ok:
        domain_stats[domain]["passed"] += 1
    else:
        domain_stats[domain]["failed"] += 1

# ── Summary ──────────────────────────────────────────────────────────────────
passed = sum(1 for r in results if r["status"] == PASS)
failed = sum(1 for r in results if r["status"] == FAIL)
total  = len(results)

print("\n" + "="*65)
print("DOMAIN BREAKDOWN")
print("="*65)
for domain, stats in domain_stats.items():
    d_total = stats["passed"] + stats["failed"]
    print(f"  {domain:<20} {stats['passed']}/{d_total}")

print("\n" + "="*65)
print("GOLDEN TEST SUMMARY")
print("="*65)
print(f"PASSED : {passed}/{total}")
print(f"FAILED : {failed}/{total}")
accuracy = round((passed / total) * 100, 1)
print(f"ACCURACY: {accuracy}%")

if failed > 0:
    print("\nFailed cases:")
    for r in results:
        if r["status"] == FAIL:
            print(f"  [FAIL] {r['label']}")
            print(f"         {r['detail']}")

print("="*65)

# Save results
results_dir = os.path.join(os.path.dirname(__file__), "results")
os.makedirs(results_dir, exist_ok=True)
results_path = os.path.join(results_dir, "golden_results.json")
with open(results_path, "w", encoding="utf-8") as f:
    json.dump({
        "total": total,
        "passed": passed,
        "failed": failed,
        "accuracy_pct": accuracy,
        "domain_breakdown": domain_stats,
        "cases": results
    }, f, indent=2)
print(f"\nResults saved to: {results_path}")
