"""
LaunchMintAI DS Layer — Pipeline Benchmark
Measures performance metrics across all 50 labeled startup ideas:
latency per idea, avg survival score per domain, rule coverage.
Distinct from golden.test.py (correctness) — this measures performance.
Run: python app/ds/eval/benchmark.py (from backend/)
"""
import sys, os, json, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from app.ds.pipeline import run as ds_run

dataset_path = os.path.join(os.path.dirname(__file__), "dataset.jsonl")
with open(dataset_path, "r", encoding="utf-8") as f:
    dataset = [json.loads(line) for line in f if line.strip()]

print("\n" + "="*65)
print(f"LaunchMintAI DS Layer — Pipeline Benchmark ({len(dataset)} ideas)")
print("="*65)

results   = []
domain_stats = {}
latencies = []

for entry in dataset:
    idea_id  = entry["id"]
    idea     = entry["idea"]
    domain   = entry["domain"]
    expected = entry["expected"]
    source   = entry["ground_truth_source"]

    t0 = time.time()
    result = ds_run(idea=idea, market_data={}, competitors=[])
    latency_ms = (time.time() - t0) * 1000
    latencies.append(latency_ms)

    survival   = result.get("survival", {})
    financials = result.get("financials", {})

    score = survival.get("survival_probability", -1)
    bp    = financials.get("breakeven_probability", -1)
    ltv   = financials.get("ltv_cac_ratio", -1)
    tier  = survival.get("risk_tier", "Unknown")
    band  = survival.get("confidence_band", [0, 0])

    s_min  = expected["survival_min"]
    s_max  = expected["survival_max"]
    bp_min = expected["breakeven_prob_min"]
    ltv_min = expected["ltv_cac_min"]

    survival_ok = s_min <= score <= s_max
    bp_ok       = bp >= bp_min
    ltv_ok      = ltv >= ltv_min
    all_ok      = survival_ok and bp_ok and ltv_ok

    status = "PASS" if all_ok else "FAIL"
    print(f"[{idea_id}] {idea[:48]}")
    print(f"       survival={score:.3f} | tier={tier} | bp={bp:.2f} | ltv={ltv:.2f} | {latency_ms:.0f}ms")

    results.append({
        "id": idea_id,
        "idea": idea,
        "domain": domain,
        "ground_truth_source": source,
        "actual": {
            "survival_probability": round(score, 4),
            "risk_tier": tier,
            "confidence_band": band,
            "breakeven_probability": round(bp, 4),
            "ltv_cac_ratio": round(ltv, 4),
            "latency_ms": round(latency_ms, 1)
        },
        "expected": expected,
        "status": status
    })

    if domain not in domain_stats:
        domain_stats[domain] = {"passed": 0, "failed": 0, "scores": [], "latencies": []}
    domain_stats[domain]["scores"].append(score)
    domain_stats[domain]["latencies"].append(latency_ms)
    if all_ok:
        domain_stats[domain]["passed"] += 1
    else:
        domain_stats[domain]["failed"] += 1

# ── Aggregate metrics ─────────────────────────────────────────
passed    = sum(1 for r in results if r["status"] == "PASS")
failed    = sum(1 for r in results if r["status"] == "FAIL")
total     = len(results)
accuracy  = round((passed / total) * 100, 1)
avg_lat   = round(sum(latencies) / len(latencies), 1)
p50_lat   = round(sorted(latencies)[len(latencies)//2], 1)
p95_lat   = round(sorted(latencies)[int(len(latencies)*0.95)], 1)
avg_score = round(sum(r["actual"]["survival_probability"] for r in results) / total, 3)

print("\n" + "="*65)
print("DOMAIN BREAKDOWN")
print("="*65)
for domain, stats in domain_stats.items():
    d_total = stats["passed"] + stats["failed"]
    avg_s   = round(sum(stats["scores"]) / len(stats["scores"]), 3)
    avg_l   = round(sum(stats["latencies"]) / len(stats["latencies"]), 0)
    print(f"  {domain:<22} {stats['passed']}/{d_total}   avg_survival={avg_s}   avg_latency={avg_l}ms")

print("\n" + "="*65)
print("PERFORMANCE METRICS")
print("="*65)
print(f"ACCURACY         : {accuracy}%  ({passed}/{total} passed)")
print(f"AVG SURVIVAL     : {avg_score}")
print(f"AVG LATENCY      : {avg_lat}ms")
print(f"P50 LATENCY      : {p50_lat}ms")
print(f"P95 LATENCY      : {p95_lat}ms")

if failed > 0:
    print("\nFailed cases:")
    for r in results:
        if r["status"] == "FAIL":
            print(f"  [FAIL] [{r['id']}] {r['idea']}")
            print(f"         survival={r['actual']['survival_probability']} (expected {r['expected']['survival_min']}–{r['expected']['survival_max']})")

print("="*65)

# ── Save results ──────────────────────────────────────────────
results_dir = os.path.join(os.path.dirname(__file__), "results")
os.makedirs(results_dir, exist_ok=True)

benchmark_data = {
    "total": total,
    "passed": passed,
    "failed": failed,
    "accuracy_pct": accuracy,
    "avg_survival_probability": avg_score,
    "avg_latency_ms": avg_lat,
    "p50_latency_ms": p50_lat,
    "p95_latency_ms": p95_lat,
    "domain_breakdown": {
        d: {
            "passed": s["passed"],
            "failed": s["failed"],
            "total": s["passed"] + s["failed"],
            "avg_survival": round(sum(s["scores"]) / len(s["scores"]), 3),
            "avg_latency_ms": round(sum(s["latencies"]) / len(s["latencies"]), 1)
        }
        for d, s in domain_stats.items()
    },
    "cases": results
}

json_path = os.path.join(results_dir, "benchmark_results.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(benchmark_data, f, indent=2)

txt_path = os.path.join(results_dir, "benchmark_results.txt")
with open(txt_path, "w", encoding="utf-8") as f:
    f.write("LaunchMintAI DS Layer — Pipeline Benchmark Results\n")
    f.write("Dataset : 50 startup ideas across 11 domains\n")
    f.write("Pipeline: XGBoost classifier + Monte Carlo + VADER sentiment\n\n")
    f.write("="*65 + "\n")
    f.write("PERFORMANCE METRICS\n")
    f.write("="*65 + "\n\n")
    f.write(f"ACCURACY         : {accuracy}%  ({passed}/{total} passed)\n")
    f.write(f"AVG SURVIVAL     : {avg_score}\n")
    f.write(f"AVG LATENCY      : {avg_lat}ms\n")
    f.write(f"P50 LATENCY      : {p50_lat}ms\n")
    f.write(f"P95 LATENCY      : {p95_lat}ms\n\n")
    f.write("="*65 + "\n")
    f.write("DOMAIN BREAKDOWN\n")
    f.write("="*65 + "\n\n")
    for domain, stats in domain_stats.items():
        d_total = stats["passed"] + stats["failed"]
        avg_s   = round(sum(stats["scores"]) / len(stats["scores"]), 3)
        avg_l   = round(sum(stats["latencies"]) / len(stats["latencies"]), 0)
        f.write(f"  {domain:<22} {stats['passed']}/{d_total}   avg_survival={avg_s}   avg_latency={avg_l}ms\n")
    f.write("\n" + "="*65 + "\n")
    f.write("PER-CASE RESULTS\n")
    f.write("="*65 + "\n\n")
    for r in results:
        f.write(f"[{r['status']}] [{r['id']}] {r['idea']}\n")
        f.write(f"       survival={r['actual']['survival_probability']} | tier={r['actual']['risk_tier']} | bp={r['actual']['breakeven_probability']} | ltv={r['actual']['ltv_cac_ratio']} | {r['actual']['latency_ms']}ms\n")
        f.write(f"       source: {r['ground_truth_source']}\n\n")

print(f"\nResults saved to : {json_path}")
print(f"Text report saved: {txt_path}")
