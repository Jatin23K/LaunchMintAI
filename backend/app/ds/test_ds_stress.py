"""
DS Layer Stress Test Suite — 50 Cases
Tiers: Basic(10) → Edge(10) → Extreme(10) → Catastrophic(10) → Regression(10)
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from app.ds.pipeline import run as ds_run

PASS = "PASS"
FAIL = "FAIL"
results = []

def check(label, condition, detail=""):
    status = PASS if condition else FAIL
    results.append((label, status, detail))
    icon = "[PASS]" if condition else "[FAIL]"
    print(f"{icon} {label}")
    if detail:
        print(f"       {detail}")

def run(idea):
    return ds_run(idea=idea, market_data={}, competitors=[])

# ============================================================
print("\n" + "="*60)
print("TIER 1 — BASIC SANITY TESTS (10)")
print("="*60)

r = run("AI Legal Assistant for Small Businesses")
score = r.get("survival", {}).get("survival_probability", 0)
check("T1-01 AI Legal Assistant survival >= 0.57", score >= 0.57,
      f"survival_probability={score:.3f}")

r = run("B2B SaaS Analytics Platform for Enterprises")
score = r.get("survival", {}).get("survival_probability", 0)
check("T1-02 B2B SaaS (no AI) survival >= 0.35", score >= 0.35,
      f"survival_probability={score:.3f}")

r = run("Sustainable Urban Farming Marketplace")
score = r.get("survival", {}).get("survival_probability", 0)
check("T1-03 Urban Farming survival <= 0.70", score <= 0.70,
      f"survival_probability={score:.3f}")

r = run("Mental Wellness App")
check("T1-04 All 3 modules in response",
      all(k in r for k in ["survival", "financials", "sentiment"]),
      f"keys={list(r.keys())}")

fin = r.get("financials", {})
check("T1-05 Monte Carlo Bear/Base/Bull present",
      all(k in fin for k in ["bear", "base", "bull"]),
      f"bear={fin.get('bear',{}).get('runway_months')} base={fin.get('base',{}).get('runway_months')} bull={fin.get('bull',{}).get('runway_months')}")

r = run("AI Powered FinTech Platform for Banks")
score = r.get("survival", {}).get("survival_probability", 0)
check("T1-06 FinTech AI survival >= 0.57 (Rule P2)", score >= 0.57,
      f"survival_probability={score:.3f}")

r = run("AI Healthcare Diagnostics SaaS for Enterprise Clinics")
score = r.get("survival", {}).get("survival_probability", 0)
check("T1-07 Healthcare AI survival >= 0.57 (Rule P2)", score >= 0.57,
      f"survival_probability={score:.3f}")

r = run("Smart Hardware Device for Consumers")
score = r.get("survival", {}).get("survival_probability", 0)
check("T1-08 Pure hardware survival <= 0.65", score <= 0.65,
      f"survival_probability={score:.3f}")

r = run("Consumer Social Photo Sharing App")
score = r.get("survival", {}).get("survival_probability", 0)
check("T1-09 Consumer social — no crash, score in range",
      0.0 <= score <= 1.0,
      f"survival_probability={score:.3f}")

r = run("Enterprise HR Management SaaS for Large Companies")
score = r.get("survival", {}).get("survival_probability", 0)
check("T1-10 Enterprise SaaS (no AI) >= 0.35", score >= 0.35,
      f"survival_probability={score:.3f}")

# ============================================================
print("\n" + "="*60)
print("TIER 2 — EDGE CASE TESTS (10)")
print("="*60)

r = run("Coffee")
check("T2-01 Single word — no crash", "survival" in r,
      f"survival_probability={r.get('survival',{}).get('survival_probability',0):.3f}")

r = run("App")
score = r.get("survival", {}).get("survival_probability", 0)
check("T2-02 Single vague word — Rule P1 cap <= 0.45", score <= 0.45,
      f"survival_probability={score:.3f}")

r = run("AI B2B SAAS PLATFORM FOR ENTERPRISE")
score = r.get("survival", {}).get("survival_probability", 0)
check("T2-03 All caps — score >= 0.50", score >= 0.50,
      f"survival_probability={score:.3f}")

r = run("B2B 2.0 SaaS 3.0 Platform v2")
check("T2-04 Numbers mixed — no crash", "survival" in r,
      f"survival_probability={r.get('survival',{}).get('survival_probability',0):.3f}")

r = run("Blockchain for Toasters")
score = r.get("survival", {}).get("survival_probability", 0)
check("T2-05 Blockchain substring — survival <= 0.55", score <= 0.55,
      f"survival_probability={score:.3f}")

r = run("AI AI AI AI AI AI AI AI")
score = r.get("survival", {}).get("survival_probability", 0)
check("T2-06 Repeated keyword spam — no crash, score <= 1.0",
      0.0 <= score <= 1.0,
      f"survival_probability={score:.3f}")

r = run("A")
check("T2-07 Single character — no crash", "survival" in r,
      f"survival_probability={r.get('survival',{}).get('survival_probability',0):.3f}")

r = run("Plataforma de IA para empresas B2B")
check("T2-08 Spanish input — no crash", "survival" in r,
      f"survival_probability={r.get('survival',{}).get('survival_probability',0):.3f}")

r = run("1234567890")
check("T2-09 Numbers only — no crash", "survival" in r,
      f"survival_probability={r.get('survival',{}).get('survival_probability',0):.3f}")

r = run("AI\tplatform\nfor\tbusinesses")
score = r.get("survival", {}).get("survival_probability", 0)
check("T2-10 Tab and newline chars — no crash", "survival" in r,
      f"survival_probability={score:.3f}")

# ============================================================
print("\n" + "="*60)
print("TIER 3 — EXTREME TESTS (10)")
print("="*60)

long_idea = "AI powered B2B SaaS platform " * 17
r = run(long_idea[:500])
check("T3-01 500-char idea — no crash", "survival" in r,
      f"survival_probability={r.get('survival',{}).get('survival_probability',0):.3f}")

r = run("AI B2B SaaS enterprise business platform machine learning automation")
score = r.get("survival", {}).get("survival_probability", 0)
check("T3-02 All keywords — Rule P2 floor >= 0.57", score >= 0.57,
      f"survival_probability={score:.3f}")

r = run("xqzpwf AI zzzmno enterprise")
check("T3-03 Gibberish with AI — no crash", "survival" in r,
      f"survival_probability={r.get('survival',{}).get('survival_probability',0):.3f}")

r = run("Quantum Teleportation Startup for Consumers")
sentiment = r.get("sentiment", {})
check("T3-04 Unknown sector — sentiment fallback present",
      "competitors" in sentiment,
      f"competitor_count={len(sentiment.get('competitors', []))}")

fin = r.get("financials", {})
ltv_cac = fin.get("ltv_cac_ratio", 0)
check("T3-05 LTV:CAC ratio > 0", ltv_cac > 0,
      f"ltv_cac_ratio={ltv_cac:.2f}")

r = run("Deep Learning Neural Network Machine Learning AI Platform for B2B Enterprises")
score = r.get("survival", {}).get("survival_probability", 0)
check("T3-06 Deep learning variants — AI keywords detected >= 0.57", score >= 0.57,
      f"survival_probability={score:.3f}")

r = run("Decentralized Crypto DeFi Blockchain Exchange Platform")
check("T3-07 Crypto/blockchain sector — no crash", "survival" in r,
      f"survival_probability={r.get('survival',{}).get('survival_probability',0):.3f}")

r = run("AI Niche Consumer Social App for Cat Owners")
score = r.get("survival", {}).get("survival_probability", 0)
check("T3-08 Contradictory signals (AI+niche+consumer) — score in range",
      0.0 <= score <= 1.0,
      f"survival_probability={score:.3f}")

r = run("Better Salesforce alternative for mid-market B2B SaaS companies")
score = r.get("survival", {}).get("survival_probability", 0)
check("T3-09 Competitor name embedded — no crash", "survival" in r,
      f"survival_probability={score:.3f}")

r = run("AI FinTech HealthTech EdTech LegalTech B2B SaaS Enterprise Platform")
score = r.get("survival", {}).get("survival_probability", 0)
check("T3-10 All-sector collision — score in valid range",
      0.0 <= score <= 1.0,
      f"survival_probability={score:.3f}")

# ============================================================
print("\n" + "="*60)
print("TIER 4 — CATASTROPHIC TESTS (10)")
print("="*60)

try:
    r = run("")
    check("T4-01 Empty string — no crash", True,
          f"survival_probability={r.get('survival',{}).get('survival_probability',0):.3f}")
except Exception as e:
    check("T4-01 Empty string — no crash", False, f"CRASHED: {e}")

try:
    r = run("   ")
    check("T4-02 Whitespace only — no crash", True,
          f"survival_probability={r.get('survival',{}).get('survival_probability',0):.3f}")
except Exception as e:
    check("T4-02 Whitespace only — no crash", False, f"CRASHED: {e}")

try:
    r = run("!@#$%^&*()")
    check("T4-03 Special chars only — no crash", True,
          f"survival_probability={r.get('survival',{}).get('survival_probability',0):.3f}")
except Exception as e:
    check("T4-03 Special chars only — no crash", False, f"CRASHED: {e}")

try:
    r = run("AI SaaS platform " * 120)
    check("T4-04 2000-char idea — no crash", "survival" in r,
          f"survival_probability={r.get('survival',{}).get('survival_probability',0):.3f}")
except Exception as e:
    check("T4-04 2000-char idea — no crash", False, f"CRASHED: {e}")

try:
    r = run("AI startup for \u4e2d\u56fd market \U0001f680")
    check("T4-05 Unicode + emoji — no crash", True,
          f"survival_probability={r.get('survival',{}).get('survival_probability',0):.3f}")
except Exception as e:
    check("T4-05 Unicode + emoji — no crash", False, f"CRASHED: {e}")

try:
    r = run("' OR '1'='1'; DROP TABLE startups; --")
    check("T4-06 SQL injection string — no crash", "survival" in r,
          f"survival_probability={r.get('survival',{}).get('survival_probability',0):.3f}")
except Exception as e:
    check("T4-06 SQL injection string — no crash", False, f"CRASHED: {e}")

try:
    r = run("<script>alert('xss')</script> AI platform")
    check("T4-07 XSS script tag — no crash", "survival" in r,
          f"survival_probability={r.get('survival',{}).get('survival_probability',0):.3f}")
except Exception as e:
    check("T4-07 XSS script tag — no crash", False, f"CRASHED: {e}")

try:
    r = run("../../etc/passwd AI SaaS")
    check("T4-08 Path traversal string — no crash", "survival" in r,
          f"survival_probability={r.get('survival',{}).get('survival_probability',0):.3f}")
except Exception as e:
    check("T4-08 Path traversal string — no crash", False, f"CRASHED: {e}")

try:
    r = run("a" * 1000)
    check("T4-09 1000 repeated chars — no crash", "survival" in r,
          f"survival_probability={r.get('survival',{}).get('survival_probability',0):.3f}")
except Exception as e:
    check("T4-09 1000 repeated chars — no crash", False, f"CRASHED: {e}")

try:
    r = run("AI\x00platform\x00B2B")
    check("T4-10 Null byte input — no crash", "survival" in r,
          f"survival_probability={r.get('survival',{}).get('survival_probability',0):.3f}")
except Exception as e:
    check("T4-10 Null byte input — no crash", False, f"CRASHED: {e}")

# ============================================================
print("\n" + "="*60)
print("TIER 5 — REGRESSION TESTS (10)")
print("="*60)

r = run("Blockchain for Toasters")
score = r.get("survival", {}).get("survival_probability", 0)
check("T5-01 REGRESSION: blockchain 'ai' substring never triggers AI flag",
      score <= 0.55,
      f"survival_probability={score:.3f} (must be <= 0.55)")

r = run("AI platform for businesses and business owners")
score = r.get("survival", {}).get("survival_probability", 0)
check("T5-02 REGRESSION: 'businesses' plural matches 'business' keyword",
      score >= 0.50,
      f"survival_probability={score:.3f} (plural form must match)")

r = run("Niche obscure unknown zxqwerty platform")
score = r.get("survival", {}).get("survival_probability", 0)
check("T5-03 REGRESSION: Rule P1 boundary — niche/unknown capped <= 0.45",
      score <= 0.45,
      f"survival_probability={score:.3f}")

r = run("AI B2B SaaS for enterprise businesses")
score = r.get("survival", {}).get("survival_probability", 0)
check("T5-04 REGRESSION: Rule P2 boundary — AI+B2B floored >= 0.57",
      score >= 0.57,
      f"survival_probability={score:.3f}")

r = run("AI Legal Assistant")
survival = r.get("survival")
financials = r.get("financials")
sentiment = r.get("sentiment")
check("T5-05 REGRESSION: All 3 modules return dict, not None",
      all(isinstance(x, dict) for x in [survival, financials, sentiment]),
      f"survival={type(survival).__name__} financials={type(financials).__name__} sentiment={type(sentiment).__name__}")

r = run("AI SaaS Platform")
bp = r.get("financials", {}).get("breakeven_probability", -1)
check("T5-06 REGRESSION: breakeven_probability always 0.0–1.0",
      0.0 <= bp <= 1.0,
      f"breakeven_probability={bp:.3f}")

r = run("CRM Software for Sales Teams")
competitors = r.get("sentiment", {}).get("competitors", [])
all_valid = all(0.0 <= c.get("pain_score", -1) <= 5.0 for c in competitors)
check("T5-07 REGRESSION: all pain_scores in 0.0–5.0 range",
      all_valid and len(competitors) > 0,
      f"competitor_count={len(competitors)}")

r = run("EdTech Platform for Students")
latency = r.get("meta", {}).get("pipeline_latency_ms", 0)
check("T5-08 REGRESSION: pipeline_latency_ms > 0",
      latency > 0,
      f"pipeline_latency_ms={latency:.1f}")

r = run("Supply Chain AI")
check("T5-09 REGRESSION: response always contains meta key",
      "meta" in r,
      f"keys={list(r.keys())}")

r = run("AI platform for enterprise B2B customers")
band = r.get("survival", {}).get("confidence_band", [0, 0])
check("T5-10 REGRESSION: confidence_band lower < upper",
      len(band) == 2 and band[0] < band[1],
      f"confidence_band=[{band[0]:.3f}, {band[1]:.3f}]")

# ============================================================
print("\n" + "="*60)
print("STRESS TEST SUMMARY")
print("="*60)
passed = sum(1 for _, s, _ in results if s == PASS)
failed = sum(1 for _, s, _ in results if s == FAIL)
total = len(results)
print(f"PASSED: {passed}/{total}")
print(f"FAILED: {failed}/{total}")
if failed > 0:
    print("\nFailed tests:")
    for label, status, detail in results:
        if status == FAIL:
            print(f"  [FAIL] {label} — {detail}")
print("="*60)
