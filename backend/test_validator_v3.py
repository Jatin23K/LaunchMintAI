import requests
import time
import concurrent.futures

IDEAS = [
    "AI Supply Chain SaaS",
    "Mental Wellness Platform",
    "Decentralized Identity",
    "EdTech Tutoring App",
    "Legal Contract Automation"
]

BASE_URL = "http://localhost:8000"

def fetch_ds_initial(idea):
    start = time.time()
    try:
        res = requests.post(f"{BASE_URL}/ds_insights", json={"idea": idea, "market_data": {}, "competitors": []}, timeout=30)
        return time.time() - start, res.json()
    except Exception:
        return time.time() - start, None

def fetch_war(idea):
    start = time.time()
    try:
        res = requests.post(f"{BASE_URL}/war_room", json={"idea": idea}, timeout=160)
        return time.time() - start, res.json()
    except Exception:
        return time.time() - start, None

def fetch_analyze(idea):
    start = time.time()
    try:
        res = requests.post(f"{BASE_URL}/analyze", json={"idea": idea}, timeout=160)
        return time.time() - start, res.json()
    except Exception:
        return time.time() - start, None

def fetch_ds_final(idea, analyze_data):
    start = time.time()
    data = analyze_data.get('data', analyze_data) if analyze_data else {}
    try:
        res = requests.post(f"{BASE_URL}/ds_insights", json={
            "idea": idea,
            "market_data": data.get('market', {}),
            "competitors": data.get('competitors', [])
        }, timeout=30)
        return time.time() - start, res.json()
    except Exception:
        return time.time() - start, None

def test_idea(idea):
    print(f"\\n--- Testing Idea: {idea} ---")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        f_ds = executor.submit(fetch_ds_initial, idea)
        f_war = executor.submit(fetch_war, idea)
        f_ana = executor.submit(fetch_analyze, idea)
        
        t_ds, ds_data = f_ds.result()
        t_war, war_data = f_war.result()
        t_ana, ana_data = f_ana.result()

    data = ana_data.get('data', ana_data) if ana_data else {}
    war_data = war_data.get('data', war_data) if war_data else {}
    
    t_ds_final, ds_final_data = fetch_ds_final(idea, data)
    ds_final = ds_final_data.get('data', ds_final_data) if ds_final_data else {}
    
    market = data.get('market', {})
    competitors = data.get('competitors', [])
    swot = data.get('swot', {})
    dept_product = data.get('dept_product', [])
    god_mode = data.get('god_mode', {})
    
    # Evaluate criteria
    results = []

    # 1. DS Insights appear (< ~5s)
    pass_1 = t_ds <= 6.0
    results.append((1, "DS Insights appear", pass_1, f"Took {t_ds:.2f}s"))

    # 2. Survival Score
    survival = ds_final.get('survival_score')
    try:
        score_val = float(str(survival).replace('%', ''))
        pass_2 = score_val > 0
    except:
        pass_2 = False
    results.append((2, "Survival Score", pass_2, f"Value: {survival}"))

    # 3. Risk Tier
    risk = str(ds_final.get('risk_tier', '')).upper()
    pass_3 = risk in ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    results.append((3, "Risk Tier", pass_3, f"Value: {risk}"))

    # 4. Bear runway
    mc = ds_final.get('monte_carlo', {})
    try:
        bear = float(mc.get('bear_runway', 0))
        pass_4 = bear > 0
    except: pass_4 = False
    results.append((4, "Monte Carlo Bear runway", pass_4, f"Value: {mc.get('bear_runway')}"))

    # 5. Base runway
    try:
        base = float(mc.get('base_runway', 0))
        pass_5 = base > 0
    except: pass_5 = False
    results.append((5, "Monte Carlo Base runway", pass_5, f"Value: {mc.get('base_runway')}"))

    # 6. Bull runway
    try:
        bull = float(mc.get('bull_runway', 0))
        pass_6 = bull > 0
    except: pass_6 = False
    results.append((6, "Monte Carlo Bull runway", pass_6, f"Value: {mc.get('bull_runway')}"))

    # 7. War Room loads (< 60s)
    pass_7 = t_war <= 60.0
    results.append((7, "War Room loads", pass_7, f"Took {t_war:.2f}s"))

    # 8. Kill Strategies
    strategies = war_data.get('strategies', [])
    kill_found = any('kill_strategy' in s for s in strategies) or any('kill' in str(s).lower() for s in strategies)
    if not kill_found and war_data.get('kill_strategy'): kill_found = True
    pass_8 = kill_found
    results.append((8, "Kill Strategies", pass_8, f"Found: {kill_found}"))

    # 9. SWOT Grid
    pass_9 = bool(swot and swot.get('strengths') and swot.get('weaknesses') and swot.get('opportunities') and swot.get('threats'))
    results.append((9, "SWOT Grid", pass_9, f"Keys: {list(swot.keys())}"))

    # 10. Market TAM
    tam = market.get('forecast_tam') or market.get('size')
    pass_10 = bool(tam and str(tam).strip() != "" and str(tam).lower() != "unknown" and "not_found" not in str(tam).lower())
    results.append((10, "Market TAM", pass_10, f"Value: {tam}"))

    # 11. Final Verdict
    verdict = god_mode.get('macro_verdict')
    pass_11 = bool(verdict and str(verdict).strip() != "")
    results.append((11, "Final Verdict", pass_11, f"Value: {str(verdict)[:30]}..."))

    # 12. Competitors list
    pass_12 = bool(competitors and len(competitors) > 0)
    results.append((12, "Competitors list", pass_12, f"Count: {len(competitors)}"))

    # 13. No crash
    pass_13 = bool(ana_data and not ana_data.get('detail'))
    results.append((13, "No crash", pass_13, "Backend responded without 500 error"))

    # 14. Dept priorities
    pass_14 = bool(dept_product and len(dept_product) >= 5)
    results.append((14, "Dept priorities", pass_14, f"Count: {len(dept_product)}"))

    # 15. Progressive loading
    pass_15 = t_ds < t_ana
    results.append((15, "Progressive loading", pass_15, f"t_ds: {t_ds:.2f}s < t_ana: {t_ana:.2f}s"))

    for r in results:
        status = "PASS" if r[2] else "FAIL"
        print(f"{r[0]}. {r[1]} - {status} ({r[3]})")

    return results

def main():
    print("Starting V3 Test Suite...")
    all_results = []
    for idea in IDEAS:
        all_results.append((idea, test_idea(idea)))
        
    print("\\n\\n=== FINAL REPORT ===")
    for idx in range(1, 16):
        fails = []
        for idea, results in all_results:
            if not results[idx-1][2]: # Failed
                fails.append(idea)
        if fails:
            print(f"Criterion {idx} ({results[idx-1][1]}): FAILED on -> {', '.join(fails)}")
        else:
            print(f"Criterion {idx} ({results[idx-1][1]}): PASSED ALL")

if __name__ == "__main__":
    main()
