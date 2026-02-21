
import requests
import json

url = "http://127.0.0.1:8000/vc_roast"
payload = {"user_idea": "Uber for Dog Walking"}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Failed to connect: {e}")
