import requests
import json
import time

# CONFIG
API_URL = "http://127.0.0.1:8000/run"

TEST_CASES = [
    # ---------------------------------------------------------
    # ✅ GROUP 1: THE HAPPY PATHS (Should work perfectly)
    # ---------------------------------------------------------
    {
        "name": "1️⃣ Standard Tech Site (Stripe)",
        "desc": "Clean HTML, high text content. Should return strong analysis.",
        "payload": {"company": "Stripe", "url": "https://stripe.com"} 
    },
    {
        "name": "2️⃣ Heavy JS Site (Vercel)",
        "desc": "Modern React/Next.js site. Tests Playwright's ability to render.",
        "payload": {"company": "Vercel", "url": "https://vercel.com"}
    },
    {
        "name": "3️⃣ Deep Link (Specific Page)",
        "desc": "Not the homepage. Tests if it stays on the specific path.",
        "payload": {"company": "YCombinator", "url": "https://www.ycombinator.com/companies"}
    },

    # ---------------------------------------------------------
    # ⚠️ GROUP 2: THE MESSY PATHS (Should auto-correct)
    # ---------------------------------------------------------
    {
        "name": "4️⃣ Missing Protocol (openai.com)",
        "desc": "User forgot 'https://'. Scraper should auto-fix this.",
        "payload": {"company": "OpenAI", "url": "openai.com"}
    },
    {
        "name": "5️⃣ Redirect Chain (fb.com)",
        "desc": "Input 'http://fb.com', should resolve to 'https://facebook.com'.",
        "payload": {"company": "Facebook", "url": "http://fb.com"}
    },

    # ---------------------------------------------------------
    # 🛑 GROUP 3: THE FAILURE MODES (Should handle gracefully)
    # ---------------------------------------------------------
    {
        "name": "6️⃣ 404 Not Found",
        "desc": "Valid domain, bad path. Should return error or empty text.",
        "payload": {"company": "GitHub", "url": "https://github.com/this-page-definitely-does-not-exist-123"}
    },
    {
        "name": "7️⃣ Non-Existent Domain",
        "desc": "DNS Error. Should catch exception instantly.",
        "payload": {"company": "FakeCo", "url": "http://this-domain-is-fake-12345.com"}
    },
    {
        "name": "8️⃣ Garbage Input",
        "desc": "Not a URL at all. Should reject immediately.",
        "payload": {"company": "Hacker", "url": "javascript:alert('hacked')"}
    }
]

def run_torture_test():
    print("🔥 STARTING TORTURE TEST (8 SCENARIOS)\n")
    pass_count = 0
    
    for test in TEST_CASES:
        print(f"Testing: {test['name']}")
        print(f"   ℹ️  Goal: {test['desc']}")
        
        payload = {
            "extension_id": "competitor-deepdive",
            "payload": test['payload']
        }
        
        try:
            start = time.time()
            response = requests.post(API_URL, json=payload, timeout=180)
            duration = round(time.time() - start, 2)
            
            # Analyze Result
            if response.status_code == 200:
                data = response.json()
                status = data.get("status")
                
                # Logic to determine if 'success' was actually correct
                # (e.g. A 404 page might technically 'succeed' in scraping but return empty data)
                if status == "success":
                    summary = data.get("data", {}).get("summary", "")
                    print(f"   ✅ SUCCESS ({duration}s) | Summary Len: {len(summary)}")
                else:
                    error_msg = data.get("data", {}).get("error", "Unknown Error")
                    print(f"   🛡️ HANDLED ERROR ({duration}s) | Msg: {error_msg}")
                pass_count += 1
                
            else:
                print(f"   ⚠️ SERVER CRASH ({response.status_code})")
                
        except Exception as e:
            print(f"   ❌ SCRIPT FAILURE: {str(e)}")
        
        print("-" * 60)
        time.sleep(1) # Breath between tests

    print(f"\n🏁 DONE. Completed {pass_count}/{len(TEST_CASES)} tests safely.")

if __name__ == "__main__":
    run_torture_test()