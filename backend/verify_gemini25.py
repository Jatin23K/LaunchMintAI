# -*- coding: utf-8 -*-
"""
Quick verify: test gemini-2.5-flash with the fixed max_output_tokens=8192.
"""
import os, time, json, requests
from dotenv import load_dotenv

load_dotenv()

KEY = os.environ.get("GEMINI_API_KEY_3")
MODEL = "gemini-2.5-flash"

PROMPT = """Return ONLY valid JSON, no markdown, no explanation:
{"market":{"current_tam":"$6.2B","forecast_tam":"$18.4B","growth":"15.2%","confidence":"High"},
 "competitors":[{"name":"Salesforce","weakness":"Enterprise bloat","kill_strategy":"Mobile-first undercut"}],
 "god_mode":{"macro_verdict":"Strong timing window exists.","risk_score":"Medium"}}
Task: Generate this structure for: AI legal assistant for small businesses"""

payload = {
    "contents": [{"parts": [{"text": PROMPT}]}],
    "generationConfig": {
        "temperature": 0.2,
        "maxOutputTokens": 8192,
        "responseMimeType": "application/json"
    }
}

url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}"

print(f"\n[TEST] gemini-2.5-flash with maxOutputTokens=8192")
print(f"[TEST] Key: ...{KEY[-6:]}\n")

t0 = time.time()
res = requests.post(url, headers={"Content-Type": "application/json"}, json=payload, timeout=60)
latency = int((time.time() - t0) * 1000)

print(f"Status  : {res.status_code}")
print(f"Latency : {latency}ms")

if res.status_code == 200:
    data = res.json()
    parts = data["candidates"][0]["content"]["parts"]
    # Count tokens
    usage = data.get("usageMetadata", {})
    tokens_in  = usage.get("promptTokenCount", "?")
    tokens_out = usage.get("candidatesTokenCount", "?")
    print(f"Tokens  : {tokens_in} in / {tokens_out} out")

    # Get real text (skip thinking parts)
    text = None
    for part in parts:
        if not part.get("thought", False) and part.get("text"):
            text = part["text"]
            break

    if text:
        # Check JSON
        try:
            parsed = json.loads(text)
            print(f"JSON OK : YES")
            print(f"Preview : {text[:150]}...")
            print(f"\n[PASS] gemini-2.5-flash is working correctly with maxOutputTokens=8192")
        except:
            print(f"JSON OK : PARTIAL (may need clean_json)")
            print(f"Preview : {text[:150]}")
    else:
        print("No text found in response parts")
else:
    print(f"Error: {res.text[:300]}")
