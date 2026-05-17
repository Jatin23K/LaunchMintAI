import os
import requests
import time
from dotenv import load_dotenv

# Load Environment Variables
load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY")

if not API_KEY:
    print("❌ FATAL: API Key missing from .env")
    exit()

print(f"🕵️  AUDITING API KEY: {API_KEY[:5]}...{API_KEY[-4:]}\n")

def get_available_models():
    """Fetches the list of all models available to your key."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return response.json().get('models', [])
        else:
            print(f"❌ Failed to list models: {response.text}")
            return []
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return []

def check_model_limits(model_name):
    """
    Pings a model and extracts the hidden rate-limit headers.
    """
    clean_name = model_name.replace("models/", "")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{clean_name}:generateContent?key={API_KEY}"
    
    headers = {"Content-Type": "application/json"}
    payload = {"contents": [{"parts": [{"text": "Hi"}]}]}
    
    start_time = time.time()
    try:
        response = requests.post(url, headers=headers, json=payload)
        latency = round((time.time() - start_time) * 1000, 0) # ms
        
        # 🕵️ EXTRACT HIDDEN RATE LIMIT HEADERS
        # Google often sends these headers:
        # x-ratelimit-limit-requests: Global limit
        # x-ratelimit-remaining-requests: What you have left
        limit_req = response.headers.get("x-ratelimit-limit-requests", "Unknown")
        remain_req = response.headers.get("x-ratelimit-remaining-requests", "Unknown")
        
        status_icon = "✅" if response.status_code == 200 else "❌"
        
        return {
            "name": clean_name,
            "status": response.status_code,
            "icon": status_icon,
            "latency": f"{latency}ms",
            "limit_rpm": limit_req,
            "remaining": remain_req
        }

    except Exception as e:
        return {
            "name": clean_name,
            "status": "ERR",
            "icon": "💀",
            "latency": "0ms",
            "limit_rpm": "-",
            "remaining": "-"
        }

# --- MAIN EXECUTION ---
models = get_available_models()

# Filter for text generation models only
text_models = [m for m in models if "generateContent" in m.get("supportedGenerationMethods", [])]

print(f"{'MODEL NAME':<40} | {'STATUS':<8} | {'LATENCY':<8} | {'RPM LIMIT':<10} | {'REMAINING'}")
print("-" * 100)

results = []

for m in text_models:
    name = m['name']
    
    # Skip older/experimental ones if you want to save time, or keep them to be thorough
    # if "1.0" in name or "001" in name: continue 
    
    data = check_model_limits(name)
    results.append(data)
    
    print(f"{data['name']:<40} | {data['icon']} {data['status']:<4} | {data['latency']:<8} | {data['limit_rpm']:<10} | {data['remaining']}")
    
    # Sleep briefly to avoid hitting rate limits just by auditing!
    time.sleep(1)

print("\n✨ AUDIT COMPLETE.")