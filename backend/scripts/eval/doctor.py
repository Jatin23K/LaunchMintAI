import os
import requests
from dotenv import load_dotenv

load_dotenv()
KEY = os.environ.get("GEMINI_API_KEY")

print(f"🔑 Testing Key: {KEY[:5]}...{KEY[-4:]}\n")

# 1. Check if Key is Valid
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={KEY}"
response = requests.get(url)

if response.status_code == 200:
    print("✅ Key is ACTIVE. Here are the models you can access:")
    data = response.json()
    available_models = [m['name'].replace('models/', '') for m in data.get('models', [])]
    
    # Check for the ones we need
    required = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro']
    for r in required:
        if r in available_models:
            print(f"   - {r}: ✅ AVAILABLE")
        else:
            print(f"   - {r}: ❌ MISSING (This is the problem)")
            
else:
    print(f"❌ Key is DEAD. Google says: {response.status_code}")
    print(response.text)