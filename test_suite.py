import asyncio
import aiohttp
import json
import sys

VALIDATOR_IDEAS = [
    "AI-powered hiring tool for startups",
    "On-demand laundry service",
    "Crypto tax automation software",
    "B2B SaaS for dental clinics",
    "Mental health app for teenagers",
    "Sustainable packaging marketplace",
    "Online tutoring platform for STEM",
    "Fleet management software for logistics",
    "AI skincare diagnosis app",
    "Carbon footprint tracker for companies",
    "Remote team productivity tool",
    "Food waste reduction platform",
    "Legal contract automation for SMEs",
    "Telemedicine for rural areas",
    "NFT authentication platform"
]

ROAST_IDEAS = [
    "Uber for dog walking",
    "Netflix for books",
    "AI legal assistant for startups",
    "Blockchain-based voting system",
    "Drone delivery for rural areas",
    "Dating app for professionals",
    "Decentralized social media platform",
    "AI personal stylist app",
    "Subscription box for pet owners",
    "Electric scooter sharing for campuses",
    "AI ghostwriter for LinkedIn",
    "Marketplace for freelance designers",
    "AR navigation app for shopping malls",
    "Online platform for handmade crafts",
    "AI coach for job interview prep"
]

FORGE_IDEAS = [
    "AI personal finance coach",
    "Telemedicine for rural areas",
    "SaaS project management for agencies",
    "Carbon credit marketplace",
    "On-demand tutoring for STEM",
    "Smart home security for renters",
    "B2B analytics for e-commerce brands",
    "AI resume builder for fresh graduates",
    "Peer-to-peer car rental platform",
    "Online pharmacy with AI prescription check",
    "Supply chain visibility platform",
    "Micro-investment app for Gen Z",
    "AI content moderation tool",
    "Freelancer health insurance platform",
    "Real estate investment analytics tool"
]

BATTLE_PAIRS = [
    ("AI hiring tool for startups", "On-demand laundry service"),
    ("Mental health app for teenagers", "Carbon credit marketplace"),
    ("Telemedicine for rural areas", "AI hiring tool for startups"),
    ("On-demand laundry service", "Mental health app for teenagers"),
    ("Carbon credit marketplace", "Telemedicine for rural areas"),
    ("AI hiring tool for startups", "Mental health app for teenagers"),
    ("On-demand laundry service", "Carbon credit marketplace"),
    ("Telemedicine for rural areas", "On-demand laundry service"),
    ("Mental health app for teenagers", "AI hiring tool for startups"),
    ("Carbon credit marketplace", "AI hiring tool for startups"),
    ("Telemedicine for rural areas", "Mental health app for teenagers"),
    ("On-demand laundry service", "Telemedicine for rural areas"),
    ("AI hiring tool for startups", "Carbon credit marketplace"),
    ("Mental health app for teenagers", "On-demand laundry service"),
    ("Carbon credit marketplace", "Telemedicine for rural areas")
]

BASE_URL = "http://127.0.0.1:8000"

async def test_validator(session, idea):
    try:
        async with session.post(f"{BASE_URL}/analyze", json={"idea": idea}, timeout=120) as resp:
            data = await resp.json()
            
            passed = True
            issues = []
            
            # Market Size
            mkt = data.get("market", {})
            tam = mkt.get("current_tam", "")
            if not ("$" in tam and ("B" in tam or "M" in tam)):
                passed = False; issues.append("Invalid TAM format")
                
            # CAGR
            growth = mkt.get("growth", "")
            if not ("%" in str(growth)):
                passed = False; issues.append("Invalid CAGR format")
                
            # Confidence
            conf = mkt.get("confidence", "")
            if conf == "Search Failed":
                passed = False; issues.append("Search Failed confidence")
                
            # Competitors
            comps = data.get("competitors", [])
            if not comps or len(comps) < 1:
                passed = False; issues.append("Missing competitors")
            else:
                if not comps[0].get("name") or not comps[0].get("weakness"):
                    passed = False; issues.append("Competitor missing name/weakness")
            
            # War Room
            god = data.get("god_mode", {})
            if not god.get("macro_verdict"):
                passed = False; issues.append("Missing macro_verdict")
            if not god.get("swot") or not all(k in god.get("swot", {}) for k in ["strengths", "weaknesses", "opportunities", "threats"]):
                passed = False; issues.append("Missing SWOT quadrants")
                
            # Departments
            if len(data.get("dept_legal", [])) == 0 or len(data.get("dept_product", [])) == 0:
                passed = False; issues.append("Missing departmental plans")
                
            return {"idea": idea, "passed": passed, "issues": issues}
    except Exception as e:
        return {"idea": idea, "passed": False, "issues": [str(e)]}

async def test_roast(session, idea):
    try:
        async with session.post(f"{BASE_URL}/vc_roast", json={"user_idea": idea}, timeout=120) as resp:
            data = await resp.json()
            
            passed = True
            issues = []
            
            if not data.get("kill_shot"): passed = False; issues.append("Missing kill_shot")
            if len(data.get("brutal_feedback", [])) < 3: passed = False; issues.append("Missing brutal_feedback points")
            if not data.get("competitor_alert"): passed = False; issues.append("Missing competitor_alert")
            if data.get("investment_verdict") not in ["HARD PASS", "WEAK MAYBE", "LAUGHABLE"]: passed = False; issues.append("Invalid verdict")
            if not isinstance(data.get("survival_chance"), int): passed = False; issues.append("Invalid survival_chance")
            
            return {"idea": idea, "passed": passed, "issues": issues}
    except Exception as e:
        return {"idea": idea, "passed": False, "issues": [str(e)]}

async def test_forge(session, idea):
    try:
        async with session.post(f"{BASE_URL}/pitch_forge", json={"user_idea": idea}, timeout=120) as resp:
            data = await resp.json()
            passed = True
            issues = []
            
            if not data.get("tagline"): passed = False; issues.append("Missing tagline")
            if not data.get("elevator_pitch"): passed = False; issues.append("Missing elevator_pitch")
            if not data.get("tweet_thread_hook"): passed = False; issues.append("Missing tweet_thread_hook")
            if not data.get("cold_email_subject"): passed = False; issues.append("Missing cold_email_subject")
            if not data.get("value_proposition"): passed = False; issues.append("Missing value_proposition")
            
            return {"idea": idea, "passed": passed, "issues": issues}
    except Exception as e:
        return {"idea": idea, "passed": False, "issues": [str(e)]}

async def test_battle(session, pair):
    try:
        async with session.post(f"{BASE_URL}/battle_room", json={"idea_a": pair[0], "idea_b": pair[1]}, timeout=120) as resp:
            data = await resp.json()
            passed = True
            issues = []
            
            if not data.get("winner"): passed = False; issues.append("Missing winner")
            if not data.get("verdict"): passed = False; issues.append("Missing verdict")
            if "scorecard" not in data: passed = False; issues.append("Missing scorecard")
            
            return {"pair": pair, "passed": passed, "issues": issues}
    except Exception as e:
        return {"pair": pair, "passed": False, "issues": [str(e)]}

async def main():
    async with aiohttp.ClientSession() as session:
        print("Testing Validator...", flush=True)
        val_passed = 0
        for idea in VALIDATOR_IDEAS:
            print(f"  Validating: {idea}...", end="", flush=True)
            r = await test_validator(session, idea)
            if r["passed"]:
                print(" PASS", flush=True)
                val_passed += 1
            else:
                print(f" FAIL: {r['issues']}", flush=True)
        print(f"Validator: {val_passed}/{len(VALIDATOR_IDEAS)} passed\n", flush=True)
            
        print("Testing Roast...", flush=True)
        roast_passed = 0
        for idea in ROAST_IDEAS:
            print(f"  Roasting: {idea}...", end="", flush=True)
            r = await test_roast(session, idea)
            if r["passed"]:
                print(" PASS", flush=True)
                roast_passed += 1
            else:
                print(f" FAIL: {r['issues']}", flush=True)
        print(f"Roast: {roast_passed}/{len(ROAST_IDEAS)} passed\n", flush=True)
            
        print("Testing Forge...", flush=True)
        forge_passed = 0
        for idea in FORGE_IDEAS:
            print(f"  Forging: {idea}...", end="", flush=True)
            r = await test_forge(session, idea)
            if r["passed"]:
                print(" PASS", flush=True)
                forge_passed += 1
            else:
                print(f" FAIL: {r['issues']}", flush=True)
        print(f"Forge: {forge_passed}/{len(FORGE_IDEAS)} passed\n", flush=True)
            
        print("Testing Battle...", flush=True)
        battle_passed = 0
        for pair in BATTLE_PAIRS:
            print(f"  Battling: {pair[0]} vs {pair[1]}...", end="", flush=True)
            r = await test_battle(session, pair)
            if r["passed"]:
                print(" PASS", flush=True)
                battle_passed += 1
            else:
                print(f" FAIL: {r['issues']}", flush=True)
        print(f"Battle: {battle_passed}/{len(BATTLE_PAIRS)} passed\n", flush=True)

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
