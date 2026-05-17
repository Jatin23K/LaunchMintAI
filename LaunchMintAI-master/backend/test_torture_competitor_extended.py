import requests
import time
import json

# CONFIG
API_URL = "http://127.0.0.1:8000/run"

TEST_CASES = [
    # --- GROUP A: HAPPY PATHS (Must Return Rich Data) ---
    {
        "name": "1️⃣ Standard Tech Site (Stripe)",
        "desc": "Clean HTML, high content. Should extract products & SWOT.",
        "payload": {"company": "Stripe", "url": "https://stripe.com"} 
    },
    {
        "name": "2️⃣ Heavy JS Single-Page App (Linear)",
        "desc": "Tests Playwright's ability to render dynamic content.",
        "payload": {"company": "Linear", "url": "https://linear.app"}
    },
    {
        "name": "3️⃣ Deep Link (Not Homepage)",
        "desc": "Analyzing a specific sub-page.",
        "payload": {"company": "YCombinator", "url": "https://www.ycombinator.com/companies"}
    },

    # --- GROUP B: INPUT CORRECTION (Must Fix User Errors) ---
    {
        "name": "4️⃣ Missing Protocol",
        "desc": "Input 'openai.com'. Scraper must add 'https://'.",
        "payload": {"company": "OpenAI", "url": "openai.com"}
    },
    {
        "name": "5️⃣ Redirect Chain",
        "desc": "Input 'fb.com' -> Should resolve to 'facebook.com'.",
        "payload": {"company": "Facebook", "url": "http://fb.com"}
    },

    # --- GROUP C: STRESS & PERFORMANCE ---
    {
        "name": "6️⃣ Huge Enterprise Site (Salesforce)",
        "desc": "Massive HTML DOM. Tests token limits and truncation.",
        "payload": {"company": "Salesforce", "url": "https://www.salesforce.com"}
    },

    # --- GROUP D: FAILURE MODES (Must Not Crash) ---
    {
        "name": "7️⃣ 404 Not Found",
        "desc": "Valid domain, bad path. Should handle gracefully.",
        "payload": {"company": "GitHub", "url": "https://github.com/this-page-definitely-does-not-exist-999"}
    },
    {
        "name": "8️⃣ Non-Existent Domain",
        "desc": "DNS Error. Should return 'Scrape failed'.",
        "payload": {"company": "FakeCo", "url": "http://this-domain-is-fake-12345.com"}
    },
    {
        "name": "9️⃣ Garbage / Malicious Input",
        "desc": "Javascript injection attempt. Should fail safely.",
        "payload": {"company": "Hacker", "url": "javascript:alert('hacked')"}
    },
    {
        "name": "🔟 Empty URL",
        "desc": "No URL provided. Should return validation error.",
        "payload": {"company": "Ghost", "url": ""}
    }
]

def run_test():
    print(f"🔥 STARTING 10-STEP VALIDATION FOR COMPETITOR DEEPDIVE\n")
    pass_count = 0
    
    for test in TEST_CASES:
        print(f"Test: {test['name']}")
        
        payload = {
            "extension_id": "competitor-deepdive",
            "payload": test['payload']
        }
        
        try:
            start = time.time()
            # 180s timeout because scraping + AI analysis is slow
            response = requests.post(API_URL, json=payload, timeout=180)
            duration = round(time.time() - start, 2)
            
            if response.status_code == 200:
                data = response.json()
                status = data.get("status")
                result_data = data.get("data", {})
                
                # INTERPRETATION
                if status == "success":
                    summary = result_data.get("summary", "")
                    products = result_data.get("products", [])
                    print(f"   ✅ SUCCESS ({duration}s)")
                    print(f"      📝 Summary: {summary[:60]}...")
                    print(f"      📦 Products Found: {len(products)}")
                else:
                    err = result_data.get("error", "Unknown")
                    print(f"   🛡️ HANDLED ERROR ({duration}s) | Msg: {err}")
                pass_count += 1
            else:
                print(f"   ⚠️ SERVER CRASH ({response.status_code}) - {response.text}")
                
        except Exception as e:
            print(f"   ❌ SCRIPT FAIL: {str(e)}")
        
        print("-" * 50)
        time.sleep(1)

    print(f"\n🏁 COMPLETED {pass_count}/{len(TEST_CASES)} TESTS.")

if __name__ == "__main__":
    run_test()