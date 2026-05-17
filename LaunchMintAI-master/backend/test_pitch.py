
import requests
import json

base_url = "http://127.0.0.1:8000"

def test_endpoint(endpoint, payload, name):
    print(f"\n--- Testing {name} ({endpoint}) ---")
    try:
        res = requests.post(f"{base_url}{endpoint}", json=payload)
        if res.status_code == 200:
            print("✅ SUCCESS")
            # Print full JSON to verify structure
            print(json.dumps(res.json(), indent=2))
        else:
            print(f"❌ FAILED: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"❌ ERROR: {e}")

# Test Pitch Forge
test_endpoint("/pitch_forge", {"user_idea": "A smart water bottle that tracks how much you drink and glows to remind you."}, "Pitch Forge")
