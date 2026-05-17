import requests
import time
import json
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

def fetch_post(url, json_data):
    return requests.post(url, json=json_data, timeout=160)

def test_idea(index, idea):
    start_time = time.time()
    
    # 1. Analyze & War Room in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        f_analyze = executor.submit(fetch_post, f"{BASE_URL}/analyze", {"idea": idea})
        f_war = executor.submit(fetch_post, f"{BASE_URL}/war_room", {"idea": idea})
        
        try:
            analyze_res = f_analyze.result()
            war_res = f_war.result()
        except Exception as e:
            return f"- Test ID: V{index+1}\n- Idea: \"{idea}\"\n- Failed Criterion: 9. Response completes in under 15 seconds\n- What was shown: Exception {str(e)}"
    
    elapsed_analyze = time.time() - start_time
    fails = []
    
    if elapsed_analyze > 15:
        fails.append(f"9. Response completes in under 15 seconds | Shown: Took {elapsed_analyze:.2f}s")
    
    data = analyze_res.json()
    if 'data' in data: data = data['data']
    war_data = war_res.json()
    if 'data' in war_data: war_data = war_data['data']
    
    market = data.get('market', {})
    competitors = data.get('competitors', [])
    
    # 2. DS Insights
    ds_res = requests.post(f"{BASE_URL}/ds_insights", json={
        "idea": idea,
        "market_data": market,
        "competitors": competitors
    })
    ds_data = ds_res.json()
    if 'data' in ds_data: ds_data = ds_data['data']
    
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
    survival = ds_data.get('survival_score')
    if survival is None or not (0 <= float(survival) <= 1):
        fails.append(f"4. Survival score is a number between 0 and 1 | Shown: {survival}")
        
    # 5. Risk tier
    risk = ds_data.get('risk_tier', '')
    if risk not in ['LOW', 'MEDIUM', 'HIGH']:
        fails.append(f"5. Risk tier present (LOW / MEDIUM / HIGH) | Shown: {risk}")
        
    # 6. Monte Carlo
    mc = ds_data.get('monte_carlo', {})
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
        
    # 10. No NOT_FOUND
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
        
    if check_nf(data) or check_nf(ds_data) or check_nf(war_data):
        fails.append(f"10. No NOT_FOUND, null, undefined, or empty fields visible in UI | Shown: NOT_FOUND detected in response")
        
    if len(fails) > 0:
        res = f"- Test ID: V{index+1}\n- Idea: \"{idea}\"\n"
        for fail in fails:
            crit, shown = fail.split(' | Shown: ')
            res += f"- Failed Criterion: {crit}\n- What was shown: {shown}\n"
        return res
    return None

def main():
    print("Starting parallel tests...")
    results = []
    passes = 0
    
    for i, idea in enumerate(IDEAS):
        print(f"Testing {i+1}/15: {idea}")
        fail_msg = test_idea(i, idea)
        if fail_msg:
            results.append(fail_msg)
        else:
            passes += 1
            
    print("\\nVALIDATOR: " + str(passes) + "/15\\n")
    for r in results:
        print(r)

if __name__ == "__main__":
    main()
