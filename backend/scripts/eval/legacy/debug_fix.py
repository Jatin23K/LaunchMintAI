import requests
import json

# URL of your API
url = "http://127.0.0.1:8000/run"

# 1. TEST A STRING PAYLOAD (This was failing)
payload_string = {
    "extension_id": "roadmap-generator",
    "payload": "My Simple App Idea" 
}

# 2. TEST A DICT PAYLOAD (Standard)
payload_dict = {
    "extension_id": "roadmap-generator",
    "payload": {
        "idea": "My Complex App Idea"
    }
}

def test_request(name, data):
    print(f"\n--- TESTING: {name} ---")
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            print("✅ SUCCESS (200 OK)")
            print("Response:", response.json().get("data", {}).get("phases", "No phases found")[:1]) # Print brief output
        else:
            print(f"❌ FAILED ({response.status_code})")
            print("🛑 ERROR DETAILS:", json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"⚠️ CRITICAL CONNECTION ERROR: {e}")
        print("Is the server running on port 8000?")

if __name__ == "__main__":
    test_request("String Input (Test 4/9/10 scenario)", payload_string)
    test_request("Dict Input (Standard)", payload_dict)