"""
VC Roast endpoint test — run this with backend already started.
Tests: 5 feedback points, survival_benchmark, valid verdict, dynamic survival_chance, no "Point X:" prefix.
21 ideas across weak / medium / strong tiers to verify calibration and badge color range.
"""
import requests

BASE_URL = "http://localhost:8000"

TEST_IDEAS = [
    # ── WEAK (expect LAUGHABLE/HARD PASS, survival 0–25%) ─────────────────────
    ("Airbnb but for private chefs", "weak"),
    ("Subscription box for indie video games", "weak"),
    ("Social app for book lovers to share reviews", "weak"),
    ("Metaverse real estate marketplace", "weak"),
    ("On-demand car wash app", "weak"),
    ("Influencer merch platform for Instagram creators", "weak"),
    ("Web3 loyalty rewards program for coffee shops", "weak"),
    ("App for splitting restaurant bills with friends", "weak"),
    ("Freelance marketplace for graphic designers", "weak"),

    # ── MEDIUM (expect WEAK MAYBE/HARD PASS, survival 20–50%) ─────────────────
    ("Automated lease abstraction SaaS for commercial real estate property managers", "medium"),
    ("AI-powered menu engineering tool for restaurant chains to optimize food cost margins", "medium"),
    ("Permit and inspection workflow automation SaaS for mid-size construction companies", "medium"),
    ("Practice management SaaS for independent veterinary clinics including scheduling and billing", "medium"),
    ("Regulatory change tracking and compliance SaaS for community banks under SEC rules", "medium"),
    ("Fleet maintenance scheduling and DOT compliance SaaS for regional trucking companies", "medium"),

    # ── STRONG (expect CONDITIONAL INTEREST/WEAK MAYBE, survival 40%+) ────────
    ("AI platform for automated underwriting decisions in commercial lending replacing manual credit analysis", "strong"),
    ("Autonomous code review and security vulnerability remediation agent for enterprise DevSecOps pipelines", "strong"),
    ("Predictive maintenance AI for industrial equipment using sensor data reducing unplanned downtime by 80%", "strong"),
    ("Real-time fraud detection infrastructure using graph neural networks for payment processors", "strong"),
    ("AI-native procurement intelligence platform replacing manual RFP processes for Fortune 500 teams", "strong"),
    ("Drug discovery acceleration platform using LLMs to analyze clinical literature and suggest novel compound targets", "strong"),
]

VALID_VERDICTS = {"HARD PASS", "WEAK MAYBE", "LAUGHABLE", "CONDITIONAL INTEREST"}
EXPECTED_RANGES = {"weak": (0, 25), "medium": (20, 50), "strong": (40, 100)}

def test_roast(idea: str, strength: str):
    print(f"\n{'='*65}")
    print(f"[{strength.upper()}] {idea[:70]}...")
    print('='*65)

    try:
        res = requests.post(f"{BASE_URL}/vc_roast", json={"user_idea": idea}, timeout=90)
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT — backend took too long")
        return
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR — is backend running?")
        raise

    if res.status_code != 200:
        print(f"❌ HTTP {res.status_code}: {res.text[:200]}")
        return

    data = res.json()
    issues = []

    # Check 1: kill_shot
    kill = data.get("kill_shot", "")
    print(f"kill_shot : {kill[:90]}...")

    # Check 2: brutal_feedback — 5 points, no "Point X:" prefix
    feedback = data.get("brutal_feedback", [])
    count = len(feedback)
    if count != 5:
        issues.append(f"Expected 5 feedback points, got {count}")
    for i, f in enumerate(feedback):
        has_prefix = f.strip().lower().startswith("point ")
        if has_prefix:
            issues.append(f"Feedback #{i+1} has 'Point X:' prefix")
        print(f"  #{i+1:02d}: {f[:75]}...")

    # Check 3: survival_chance calibration
    chance = data.get("survival_chance", -1)
    lo, hi = EXPECTED_RANGES[strength]
    in_range = lo <= chance <= hi
    range_icon = "✅" if in_range else "⚠️ "
    if not in_range:
        issues.append(f"survival_chance {chance}% outside expected {lo}–{hi}% for {strength} idea")
    print(f"{range_icon} survival_chance: {chance}% (expected {lo}–{hi}% for {strength})")

    # Check 4: survival_benchmark
    benchmark = data.get("survival_benchmark", "")
    if not benchmark:
        issues.append("survival_benchmark missing")
    print(f"{'✅' if benchmark else '❌'} benchmark: {benchmark[:90]}")

    # Check 5: investment_verdict
    verdict = data.get("investment_verdict", "")
    verdict_ok = verdict in VALID_VERDICTS
    if not verdict_ok:
        issues.append(f"Unexpected verdict: {verdict}")
    print(f"{'✅' if verdict_ok else '⚠️ '} verdict: {verdict}")

    # Check 6: competitor_alert
    alert = data.get("competitor_alert", "")
    if not alert:
        issues.append("competitor_alert missing")
    print(f"{'✅' if alert else '❌'} competitor: {alert[:80]}...")

    # Summary
    if issues:
        print(f"\n⚠️  ISSUES ({len(issues)}):")
        for issue in issues:
            print(f"   - {issue}")
    else:
        print(f"\n✅ ALL CHECKS PASSED")

if __name__ == "__main__":
    print("VC Roast — 21 idea test suite")
    print("Backend: localhost:8000")
    print(f"Ideas: {len(TEST_IDEAS)} ({sum(1 for _,s in TEST_IDEAS if s=='weak')} weak, "
          f"{sum(1 for _,s in TEST_IDEAS if s=='medium')} medium, "
          f"{sum(1 for _,s in TEST_IDEAS if s=='strong')} strong)\n")

    passed = 0
    failed = 0
    range_misses = []

    for idea, strength in TEST_IDEAS:
        try:
            test_roast(idea, strength)
            passed += 1
        except requests.exceptions.ConnectionError:
            print("❌ Cannot connect. Start backend first.")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            failed += 1

    print(f"\n{'='*65}")
    print(f"DONE — {passed} ideas tested, {failed} errors")
    print("Review ⚠️  flags above for calibration issues.")
