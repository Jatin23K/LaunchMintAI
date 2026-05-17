
import requests
import json

base_url = "http://127.0.0.1:8000"

def test_endpoint(endpoint, payload, name):
    print(f"\n--- Testing {name} ({endpoint}) ---")
    try:
        res = requests.post(f"{base_url}{endpoint}", json=payload)
        if res.status_code == 200:
            print("✅ SUCCESS")
            # Print first 200 chars of JSON to verify structure
            print(json.dumps(res.json(), indent=2)[:300] + "...")
        else:
            print(f"❌ FAILED: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"❌ ERROR: {e}")

# Test VC Roast
test_endpoint("/vc_roast", {"user_idea": "Uber for Cats"}, "VC Roast")

# Test War Room
test_endpoint("/war_room", {"idea": "Uber for Cats"}, "War Room")
