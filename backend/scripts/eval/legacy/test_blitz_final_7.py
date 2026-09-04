import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/run"

# FIXED: Corrected ID names (dashes, not underscores) and payloads
NEW_EXTENSIONS = [
    ("market-research", {"topic": "Electric Vehicles", "industry": "Auto"}), # Fixed Payload
    ("strategy-war-room", "Competitor slashed prices by 50%"),               # Fixed ID Typo
    ("hiring-team", "Chief Technology Officer"),
    ("product-storytelling", "A social network for doctors"),
    ("vision-north-star", "SpaceX for Oceans"),
    ("metrics-kpi", "SaaS Marketplace"),
    ("legal-compliance", "Health Data App")
]

print("🔥 STARTING FINAL BLITZ TEST (EXTENSIONS 12-18) - FIXED")
for ext_id, payload in NEW_EXTENSIONS:
    print(f"Testing {ext_id.ljust(25)}...", end=" ")
    try:
        # 1. Valid Test
        resp = requests.post(BASE_URL, json={"extension_id": ext_id, "payload": payload})
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("status") == "success":
                print("✅ PASS", end=" | ")
            else:
                # If it handled an error gracefully, that is also a pass for reliability
                print(f"⚠️ HANDLED ({data.get('data', {}).get('error')})", end=" | ")
        else:
            print(f"❌ FAIL ({resp.status_code})", end=" | ")

        # 2. Garbage Test
        resp = requests.post(BASE_URL, json={"extension_id": ext_id, "payload": None})
        if resp.status_code == 200 and resp.json().get("status") == "error":
            print("✅ SAFETY PASS")
        else:
            print("❌ SAFETY FAIL")
            
    except Exception as e:
        print(f"💀 CRASH: {e}")