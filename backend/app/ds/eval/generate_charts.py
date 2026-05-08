"""
LaunchMintAI DS Layer — Evaluation Chart Generator
Produces 4 charts from benchmark_results.json
Run: python app/ds/eval/generate_charts.py (from backend/)
"""
import sys, os, json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

results_path = os.path.join(os.path.dirname(__file__), "results", "benchmark_results.json")
with open(results_path, "r", encoding="utf-8") as f:
    data = json.load(f)

charts_dir = os.path.join(os.path.dirname(__file__), "charts")
os.makedirs(charts_dir, exist_ok=True)

cases   = data["cases"]
domains = data["domain_breakdown"]

# ── Chart 1: Accuracy by Domain ───────────────────────────────
print("Generating Chart 1: Accuracy by Domain...")
fig, ax = plt.subplots(figsize=(12, 6))
domain_names  = list(domains.keys())
passed_counts = [domains[d]["passed"] for d in domain_names]
total_counts  = [domains[d]["total"]  for d in domain_names]
accuracy_pcts = [round(domains[d]["passed"] / domains[d]["total"] * 100, 1) for d in domain_names]
colors = ['#10b981' if p == t else '#ef4444' for p, t in zip(passed_counts, total_counts)]
bars = ax.bar(domain_names, accuracy_pcts, color=colors, edgecolor='white', linewidth=0.5)
ax.set_ylim(0, 115)
ax.set_ylabel("Accuracy (%)", fontsize=11)
ax.set_title("DS Layer Accuracy by Domain — 50 Startup Ideas", fontsize=13, fontweight='bold')
ax.axhline(y=data["accuracy_pct"], color='#6366f1', linestyle='--', linewidth=1.5, label=f'Overall: {data["accuracy_pct"]}%')
for bar, pct in zip(bars, accuracy_pcts):
    ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 2, f'{pct}%', ha='center', va='bottom', fontsize=9, fontweight='bold')
plt.xticks(rotation=30, ha='right', fontsize=9)
plt.legend(fontsize=10)
plt.tight_layout()
plt.savefig(os.path.join(charts_dir, "chart1_accuracy_by_domain.png"), dpi=150)
plt.close()
print("  Saved: chart1_accuracy_by_domain.png")

# ── Chart 2: Avg Survival Score by Domain ────────────────────
print("Generating Chart 2: Survival Score by Domain...")
fig, ax = plt.subplots(figsize=(12, 6))
avg_scores = [domains[d]["avg_survival"] for d in domain_names]
colors2 = ['#10b981' if s >= 0.57 else '#f59e0b' if s >= 0.40 else '#ef4444' for s in avg_scores]
bars2 = ax.bar(domain_names, avg_scores, color=colors2, edgecolor='white', linewidth=0.5)
ax.axhline(y=0.57, color='#10b981', linestyle='--', linewidth=1.5, label='Rule P2 Floor (0.57)')
ax.axhline(y=0.45, color='#ef4444', linestyle='--', linewidth=1.5, label='Rule P1 Cap (0.45)')
ax.set_ylim(0, 0.85)
ax.set_ylabel("Avg Survival Probability", fontsize=11)
ax.set_title("Average Survival Score by Domain", fontsize=13, fontweight='bold')
for bar, score in zip(bars2, avg_scores):
    ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.01, f'{score}', ha='center', va='bottom', fontsize=9, fontweight='bold')
plt.xticks(rotation=30, ha='right', fontsize=9)
plt.legend(fontsize=10)
plt.tight_layout()
plt.savefig(os.path.join(charts_dir, "chart2_survival_by_domain.png"), dpi=150)
plt.close()
print("  Saved: chart2_survival_by_domain.png")

# ── Chart 3: Rule P1 vs P2 vs No-Rule ────────────────────────
print("Generating Chart 3: Post-Processing Rule Breakdown...")
fig, ax = plt.subplots(figsize=(8, 6))
rule_counts = {"P2 Applied": 0, "P1 Applied": 0, "No Rule": 0}
rule_scores = {"P2 Applied": [], "P1 Applied": [], "No Rule": []}
for case in cases:
    rule  = case["expected"].get("rule_applied", "None")
    score = case["actual"]["survival_probability"]
    if rule == "P2":
        rule_counts["P2 Applied"] += 1
        rule_scores["P2 Applied"].append(score)
    elif rule == "P1":
        rule_counts["P1 Applied"] += 1
        rule_scores["P1 Applied"].append(score)
    else:
        rule_counts["No Rule"] += 1
        rule_scores["No Rule"].append(score)
labels  = list(rule_counts.keys())
avgs    = [round(sum(rule_scores[l])/len(rule_scores[l]), 3) for l in labels]
colors3 = ['#10b981', '#ef4444', '#6366f1']
bars3   = ax.bar(labels, avgs, color=colors3, edgecolor='white', width=0.5)
ax.set_ylim(0, 0.85)
ax.set_ylabel("Avg Survival Probability", fontsize=11)
ax.set_title("Post-Processing Rules — Avg Survival Score\n(P1=cap ≤0.45 | P2=floor ≥0.57 | No Rule=model baseline)", fontsize=11, fontweight='bold')
for bar, avg, cnt in zip(bars3, avgs, [rule_counts[l] for l in labels]):
    ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.01, f'{avg}\n(n={cnt})', ha='center', va='bottom', fontsize=11, fontweight='bold')
plt.tight_layout()
plt.savefig(os.path.join(charts_dir, "chart3_rule_breakdown.png"), dpi=150)
plt.close()
print("  Saved: chart3_rule_breakdown.png")

# ── Chart 4: Per-Case Accuracy Grid ──────────────────────────
print("Generating Chart 4: Per-Case Accuracy Grid...")
fig, ax = plt.subplots(figsize=(14, 8))
n    = len(cases)
cols = 10
rows = (n + cols - 1) // cols
color_grid = np.full((rows, cols), np.nan)
for i, case in enumerate(cases):
    color_grid[i // cols][i % cols] = 1 if case["status"] == "PASS" else 0
cmap = matplotlib.colors.ListedColormap(['#ef4444', '#10b981'])
ax.imshow(color_grid, cmap=cmap, aspect='auto', vmin=0, vmax=1)
for i, case in enumerate(cases):
    ax.text(i % cols, i // cols, case["id"], ha='center', va='center', fontsize=7, color='white', fontweight='bold')
ax.set_xticks([])
ax.set_yticks([])
ax.set_title(f"Per-Case Accuracy Grid — {data['passed']}/{data['total']} Passed ({data['accuracy_pct']}%)\n(Green=PASS  Red=FAIL)", fontsize=13, fontweight='bold')
green_patch = mpatches.Patch(color='#10b981', label='PASS')
red_patch   = mpatches.Patch(color='#ef4444', label='FAIL')
plt.legend(handles=[green_patch, red_patch], loc='lower right', fontsize=10)
plt.tight_layout()
plt.savefig(os.path.join(charts_dir, "chart4_accuracy_grid.png"), dpi=150)
plt.close()
print("  Saved: chart4_accuracy_grid.png")

print("\n" + "="*65)
print("All 4 charts saved to: backend/app/ds/eval/charts/")
print("="*65)
