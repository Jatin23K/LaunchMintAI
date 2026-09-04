import requests
import json

BASE_URL = "http://127.0.0.1:8000"
idea = "Uber for space miners"

endpoints = {
    "STRATEGIST": "/analyze",
    "SPY": "/war_room",
    "SKEPTIC": "/vc_roast",
    "SALESMAN": "/pitch_forge"
}

for name, path in endpoints.items():
    print(f"\n--- TESTING {name} ---")
    payload = {"idea": idea} if name in ["STRATEGIST", "SPY"] else {"user_idea": idea}
    try:
        res = requests.post(f"{BASE_URL}{path}", json=payload, timeout=60)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            print(f"Sample Output: {json.dumps(data)[:200]}...")
        else:
            print(f"Error: {res.text[:200]}")
    except Exception as e:
        print(f"Crash: {e}")
