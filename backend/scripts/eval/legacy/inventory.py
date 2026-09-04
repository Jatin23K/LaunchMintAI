import os
import requests
from dotenv import load_dotenv

load_dotenv()
KEY = os.environ.get("GEMINI_API_KEY")

print(f"🔑 INVENTORY CHECK FOR: {KEY[:5]}...{KEY[-4:]}\n")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={KEY}"
response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    models = data.get('models', [])
    
    if not models:
        print("❌ CRITICAL: Your key has access to ZERO models.")
        print("   Solution: You MUST create a new API Key in a NEW Project.")
    else:
        print(f"✅ Your key has access to {len(models)} models:")
        print("-" * 40)
        for m in models:
            # We only care about models that can generate text
            if "generateContent" in m.get("supportedGenerationMethods", []):
                print(f"🌟 {m['name'].replace('models/', '')}")
            else:
                print(f"   {m['name'].replace('models/', '')} (Not for text)")
        print("-" * 40)
        print("\n👇 COPY THE EXACT NAME OF A '🌟' MODEL ABOVE AND PASTE IT BELOW")
else:
    print(f"❌ Error fetching models: {response.text}")