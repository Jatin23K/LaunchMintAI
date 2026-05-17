# -*- coding: utf-8 -*-
"""
NIM Key Validator - tests all 6 keys with a real API call and measures latency.
"""
import os, time, json
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv

load_dotenv()

KEYS = {
    f"NIM_KEY_{i}": os.environ.get(f"NIM_API_KEY_{i}", "")
    for i in range(1, 7)
}

NIM_BASE_URL = "https://integrate.api.nvidia.com/v1"
TEST_MODEL   = "meta/llama-3.1-8b-instruct"   # fast model for validation
TEST_PROMPT  = "Reply with exactly one word: VALID"

def test_key(label: str, key: str) -> dict:
    if not key or not key.startswith("nvapi-"):
        return {"key": label, "status": "MISSING", "latency_ms": None, "error": "Not set or wrong format"}

    try:
        from openai import OpenAI
        client = OpenAI(base_url=NIM_BASE_URL, api_key=key)

        t0 = time.time()
        resp = client.chat.completions.create(
            model=TEST_MODEL,
            messages=[{"role": "user", "content": TEST_PROMPT}],
            max_tokens=10,
            timeout=20,
        )
        latency_ms = int((time.time() - t0) * 1000)
        reply = resp.choices[0].message.content.strip()
        return {
            "key": label,
            "status": "[OK] VALID",
            "latency_ms": latency_ms,
            "reply": reply,
            "error": None
        }
    except Exception as e:
        err = str(e)
        if "401" in err or "unauthorized" in err.lower():
            status = "[FAIL] INVALID KEY"
        elif "429" in err:
            status = "[WARN] RATE LIMITED (key is valid)"
        elif "timeout" in err.lower():
            status = "[WARN] TIMEOUT"
        else:
            status = "[FAIL] ERROR"
        return {"key": label, "status": status, "latency_ms": None, "error": err[:120]}

print("\n" + "="*60)
print("  NVIDIA NIM KEY VALIDATION — LaunchMintAI")
print("="*60)
print(f"  Model tested: {TEST_MODEL}")
print("="*60 + "\n")

results = []
with ThreadPoolExecutor(max_workers=6) as ex:
    futures = {ex.submit(test_key, label, key): label for label, key in KEYS.items()}
    for future in as_completed(futures):
        results.append(future.result())

results.sort(key=lambda x: x["key"])

valid_count = 0
for r in results:
    lat = f"{r['latency_ms']}ms" if r['latency_ms'] else "N/A"
    print(f"  {r['key']}: {r['status']}  |  Latency: {lat}")
    if r["error"]:
        print(f"           └─ {r['error']}")
    if "VALID" in r["status"]:
        valid_count += 1

print(f"\n{'='*60}")
print(f"  RESULT: {valid_count}/6 NIM keys are VALID")
print(f"  Total NIM capacity: {valid_count * 40} RPM")
print(f"{'='*60}\n")
