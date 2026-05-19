"""
Pitch Forge endpoint test — run this with backend already started.
Tests: all 5 fields present, tagline concise, tweet ≤280 chars, no jargon, no static fallback.
15 ideas across 5 tiers — consumer clone → thin B2B → vertical SaaS → enterprise AI → platform.
"""
import requests
import time

BASE_URL = "http://localhost:8000"

TEST_IDEAS = [
    # ── TIER 1: Consumer / Clone (3 ideas) ────────────────────────────────────
    ("Dating app for gamers", "t1"),
    ("Subscription box for artisan coffee", "t1"),
    ("Freelance marketplace for video editors", "t1"),

    # ── TIER 2: Thin B2B Feature (3 ideas) ────────────────────────────────────
    ("AI chatbot for e-commerce customer support", "t2"),
    ("Automated social media posting scheduler", "t2"),
    ("Invoice reminder automation for freelancers", "t2"),

    # ── TIER 3: Vertical SaaS — end-to-end workflow (3 ideas) ─────────────────
    ("Practice management SaaS for independent physical therapy clinics", "t3"),
    ("Case management SaaS for immigration law firms", "t3"),
    ("Fleet maintenance and compliance SaaS for regional trucking companies", "t3"),

    # ── TIER 4: Enterprise AI replacing manual role (3 ideas) ─────────────────
    ("AI-powered clinical documentation replacing manual physician note-taking in hospitals", "t4"),
    ("Autonomous legal contract drafting agent for M&A transactions replacing junior associates", "t4"),
    ("AI-powered accounts payable automation replacing manual invoice processing at mid-market manufacturers", "t4"),

    # ── TIER 5: Platform replacing entire legacy category (3 ideas) ───────────
    ("AI-native accounting platform replacing QuickBooks for professional services firms", "t5"),
    ("AI-native HR platform replacing legacy SAP SuccessFactors for mid-market enterprises", "t5"),
    ("AI-native legal practice management platform replacing legacy Clio for mid-size law firms", "t5"),
]

JARGON = ["synergy", "ecosystem", "paradigm", "leverage", "holistic", "cutting-edge", "robust solution", "game-changer", "disruptive", "thought leader"]

# Static fallback fingerprint — means the API/LLM failed silently
FALLBACK_FINGERPRINT = "error 500"

def test_forge(idea: str, tier: str):
    print(f"\n{'='*65}")
    print(f"[TIER {tier[-1]}] {idea[:70]}...")
    print('='*65)

    try:
        res = requests.post(f"{BASE_URL}/pitch_forge", json={"user_idea": idea}, timeout=90)
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT — backend took too long")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR — is backend running?")
        raise

    if res.status_code != 200:
        print(f"❌ HTTP {res.status_code}: {res.text[:200]}")
        return False

    data = res.json()
    issues = []

    # Check 0: Static fallback detection
    tagline = data.get("tagline", "").lower()
    if FALLBACK_FINGERPRINT in tagline:
        issues.append("⚡ STATIC FALLBACK TRIGGERED — API failed silently (rate limit or timeout)")
        print(f"❌ STATIC FALLBACK DETECTED")
        print(f"\n⚠️  ISSUES ({len(issues)}):")
        for issue in issues:
            print(f"   - {issue}")
        return False

    # Check 1: All 5 fields present and non-empty
    required = ["tagline", "elevator_pitch", "tweet_thread_hook", "cold_email_subject", "value_proposition"]
    for field in required:
        val = data.get(field, "")
        if not val:
            issues.append(f"Missing or empty: {field}")

    # Check 2: Tagline concise (≤10 words)
    tagline_raw = data.get("tagline", "")
    word_count = len(tagline_raw.split())
    tagline_ok = word_count <= 10
    if not tagline_ok:
        issues.append(f"Tagline too long: {word_count} words (expected ≤10)")
    print(f"{'✅' if tagline_ok else '⚠️ '} tagline ({word_count}w): {tagline_raw}")

    # Check 3: Tweet ≤280 chars
    tweet = data.get("tweet_thread_hook", "")
    tweet_len = len(tweet)
    tweet_ok = tweet_len <= 280
    if not tweet_ok:
        issues.append(f"Tweet too long: {tweet_len} chars (Twitter limit 280)")
    print(f"{'✅' if tweet_ok else '⚠️ '} tweet ({tweet_len} chars): {tweet[:80]}...")

    # Check 4: No corporate jargon
    all_text = " ".join(str(v) for v in data.values()).lower()
    found_jargon = [j for j in JARGON if j in all_text]
    if found_jargon:
        issues.append(f"Corporate jargon: {found_jargon}")
    print(f"{'✅' if not found_jargon else '⚠️ '} jargon: {'clean' if not found_jargon else str(found_jargon)}")

    # Check 5: Value prop has substance
    vp = data.get("value_proposition", "")
    vp_ok = len(vp) > 20
    if not vp_ok:
        issues.append("Value proposition too short")
    print(f"{'✅' if vp_ok else '⚠️ '} value_prop: {vp[:90]}...")

    # Check 6: Elevator pitch non-trivial
    ep = data.get("elevator_pitch", "")
    ep_ok = len(ep) > 30
    if not ep_ok:
        issues.append("Elevator pitch too short")
    print(f"{'✅' if ep_ok else '⚠️ '} elevator: {ep[:90]}...")

    # Check 7: Subject line sensible length
    subj = data.get("cold_email_subject", "")
    subj_ok = 5 < len(subj) < 120
    if not subj_ok:
        issues.append(f"Subject line length suspicious: {len(subj)} chars")
    print(f"{'✅' if subj_ok else '⚠️ '} subject: {subj}")

    if issues:
        print(f"\n⚠️  ISSUES ({len(issues)}):")
        for issue in issues:
            print(f"   - {issue}")
        return False
    else:
        print(f"\n✅ ALL CHECKS PASSED")
        return True

if __name__ == "__main__":
    tier_counts = {f"t{i}": sum(1 for _, s in TEST_IDEAS if s == f"t{i}") for i in range(1, 6)}
    print("Pitch Forge — 15 idea test suite")
    print("Backend: localhost:8000")
    print(f"Ideas: {len(TEST_IDEAS)} | " + " | ".join(f"Tier {k[-1]}: {v}" for k, v in tier_counts.items()))
    print("Checks: static fallback · tagline length · tweet ≤280 · jargon · value prop · elevator · subject\n")

    passed = 0
    failed = 0
    fallbacks = 0

    for idea, tier in TEST_IDEAS:
        try:
            ok = test_forge(idea, tier)
            if ok:
                passed += 1
            else:
                failed += 1
                if "STATIC FALLBACK" in str(ok):
                    fallbacks += 1
            # 8s delay — free tier Gemini resets per-minute quota every 60s
            # 15 ideas × 8s = ~2 min total.
            print(f"   ⏳ waiting 8s before next request...")
            time.sleep(8)
        except requests.exceptions.ConnectionError:
            print("❌ Cannot connect. Start backend first.")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            failed += 1

    print(f"\n{'='*65}")
    print(f"DONE — {passed} passed, {failed} failed (of {len(TEST_IDEAS)} total)")
    print("Review ⚠️  flags above for output quality issues.")
