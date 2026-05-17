import requests
import json
import time

# CONFIG
API_URL = "http://127.0.0.1:8000/run"

TEST_CASES = [
    # 1. The Happy Path (Should succeed with AI)
    {
        "name": "🟢 Level 1: Standard Site (Notion)",
        "payload": {"company": "Notion", "url": "https://notion.so"} 
    },
    
    # 2. The Chaos Path (Should fail gracefully, not crash server)
    {
        "name": "🔴 Level 2: Bad URL",
        "payload": {"company": "FakeCo", "url": "http://this-site-does-not-exist-12345.com"}
    }
]

def run_test():
    print("🚀 STARTING EXTENSION 1 STRESS TEST\n")
    
    for test in TEST_CASES:
        print(f"Testing: {test['name']}...")
        payload = {
            "extension_id": "competitor-deepdive",
            "payload": test['payload']
        }
        
        try:
            start = time.time()
            response = requests.post(API_URL, json=payload, timeout=120)
            duration = round(time.time() - start, 2)
            
            if response.status_code == 200:
                data = response.json()
                result = data.get("data", {})
                swot = result.get("swot", {})
                
                print(f"   ✅ STATUS: {data['status']} ({duration}s)")
                print(f"   📝 SUMMARY: {result.get('summary', '')[:100]}...")
                print(f"   💪 STRENGTHS: {swot.get('strengths', [])[:2]}")
                print(f"   📉 WEAKNESSES: {swot.get('weaknesses', [])[:2]}")
            else:
                print(f"   ⚠️ EXPECTED ERROR: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"   ❌ CRITICAL FAILURE: {str(e)}")
        
        print("-" * 60)

if __name__ == "__main__":
    run_test()