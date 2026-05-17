import requests
import time
import concurrent.futures

IDEAS = [
    "AI Legal Assistant for Small Businesses",
    "B2B SaaS Platform for HR Automation",
    "Telemedicine App for Rural India",
    "EdTech Platform for Coding Bootcamps",
    "FinTech App for Freelancer Invoicing",
    "AI Recruitment Tool for Enterprise",
    "Mental Health App for College Students",
    "SaaS Analytics Dashboard for E-commerce",
    "Cybersecurity Tool for SMBs",
    "AI Writing Assistant for Content Teams",
    "Climate Tech Carbon Offset Marketplace",
    "No-Code App Builder for Non-Technical Founders",
    "PropTech Platform for Rental Management",
    "AI Drug Discovery Platform",
    "Autonomous Drone Delivery for Last Mile"
]

BASE_URL = "http://localhost:8000"

def is_nf(v):
    if not v: return True
    if str(v).lower() == "not_found" or "not_found" in str(v).lower(): return True
    return False

def check_nf(obj):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if check_nf(v): return True
    elif isinstance(obj, list):
        for v in obj:
            if check_nf(v): return True
    else:
        if is_nf(obj): return True
    return False

def fetch_ds_initial(idea):
    start = time.time()
    try:
        res = requests.post(f"{BASE_URL}/ds_insights", json={"idea": idea, "market_data": {}, "competitors": []}, timeout=30)
        return time.time() - start, res.json()
    except Exception as e:
        return time.time() - start, None

def fetch_war(idea):
    start = time.time()
    try:
        res = requests.post(f"{BASE_URL}/war_room", json={"idea": idea}, timeout=160)
        return time.time() - start, res.json()
    except Exception as e:
        return time.time() - start, None

def fetch_analyze(idea):
    start = time.time()
    try:
        res = requests.post(f"{BASE_URL}/analyze", json={"idea": idea}, timeout=160)
        return time.time() - start, res.json()
    except Exception as e:
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
    except Exception as e:
        return time.time() - start, None

def test_idea(index, idea):
    fails = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        f_ds = executor.submit(fetch_ds_initial, idea)
        f_war = executor.submit(fetch_war, idea)
        f_ana = executor.submit(fetch_analyze, idea)
        
        t_ds, ds_data = f_ds.result()
        t_war, war_data = f_war.result()
        t_ana, ana_data = f_ana.result()

    if t_ds > 5:
        fails.append(f"9. DS Insights section appears within 5 seconds | Shown: Took {t_ds:.2f}s")
    if t_war > 25:
        fails.append(f"10. War Room section appears within 25 seconds | Shown: Took {t_war:.2f}s")
    if t_ana > 90:
        fails.append(f"11. Full results appear within 90 seconds | Shown: Took {t_ana:.2f}s")

    data = ana_data.get('data', ana_data) if ana_data else {}
    war_data = war_data.get('data', war_data) if war_data else {}
    
    # Need final DS data for some criteria
    t_ds_final, ds_final_data = fetch_ds_final(idea, data)
    ds_final = ds_final_data.get('data', ds_final_data) if ds_final_data else {}
    
    market = data.get('market', {})
    competitors = data.get('competitors', [])
    
    # 1. TAM present with unit
    tam = market.get('forecast_tam') or market.get('size')
    if is_nf(tam) or ("B" not in str(tam).upper() and "M" not in str(tam).upper()):
        fails.append(f"1. TAM present with unit ($XB or $XM) — not \"Unknown\" or empty | Shown: {tam}")
        
    # 2. CAGR
    cagr = market.get('growth')
    if is_nf(cagr) or "%" not in str(cagr):
        fails.append(f"2. CAGR present as a percentage — not \"Unknown\" or empty | Shown: {cagr}")
        
    # 3. 1+ named competitor
    if not competitors or len(competitors) == 0:
        fails.append(f"3. At least 1 named competitor returned | Shown: {len(competitors)}")
        
    # 4. Survival score
    survival = ds_final.get('survival_score')
    if survival is None or not (0 <= float(survival) <= 1):
        fails.append(f"4. Survival score is a number between 0 and 1 | Shown: {survival}")
        
    # 5. Risk tier
    risk = ds_final.get('risk_tier', '')
    if risk not in ['LOW', 'MEDIUM', 'HIGH']:
        fails.append(f"5. Risk tier present (LOW / MEDIUM / HIGH) | Shown: {risk}")
        
    # 6. Monte Carlo
    mc = ds_final.get('monte_carlo', {})
    if not ('bear_runway' in mc and 'base_runway' in mc and 'bull_runway' in mc):
        fails.append(f"6. Monte Carlo shows Bear + Base + Bull runway in months | Shown: {mc}")
        
    # 7. War Room kill strategy
    strategies = war_data.get('strategies', [])
    kill_found = any('kill_strategy' in s for s in strategies) or any('kill' in str(s).lower() for s in strategies)
    if not kill_found and not war_data.get('kill_strategy'):
        fails.append(f"7. War Room section shows at least 1 kill strategy | Shown: no kill strategy in {strategies}")
        
    # 8. SWOT
    swot = data.get('swot', {})
    if not ('strengths' in swot and 'weaknesses' in swot and 'opportunities' in swot and 'threats' in swot):
        fails.append(f"8. SWOT has all 4 quadrants populated | Shown: {list(swot.keys())}")
        
    # 12. No NOT_FOUND
    if check_nf(data) or check_nf(war_data) or check_nf(ds_final):
        fails.append(f"12. No NOT_FOUND, null, undefined, or empty fields visible in UI | Shown: NOT_FOUND or null detected in response")
        
    if len(fails) > 0:
        res = f"- Test ID: V{index+1}\n- Idea: \"{idea}\"\n"
        for fail in fails:
            crit, shown = fail.split(' | Shown: ')
            res += f"- Failed Criterion: {crit}\n- What was shown: {shown}\n- Timing: DS Insights = {t_ds:.2f}s / War Room = {t_war:.2f}s / Full Results = {t_ana:.2f}s\n"
        return res
    return None

def main():
    print("Starting tests...")
    results = []
    passes = 0
    for i, idea in enumerate(IDEAS):
        print(f"Testing {i+1}/15: {idea}")
        fail_msg = test_idea(i, idea)
        if fail_msg:
            results.append(fail_msg)
        else:
            passes += 1
            
    print(f"\\nVALIDATOR: {passes}/15\\n")
    for r in results:
        print(r)

if __name__ == "__main__":
    main()
