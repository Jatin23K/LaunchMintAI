# -*- coding: utf-8 -*-
"""
NIM Model Benchmarker - measures real latency and quality for JSON tasks
across models we plan to use in LaunchMintAI tabs.
"""
import os, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

NIM_BASE_URL = "https://integrate.api.nvidia.com/v1"
NIM_KEY = os.environ.get("NIM_API_KEY_1")  # Use key 1 for benchmarking

# Models to benchmark and their intended use
MODELS = [
    {
        "id": "meta/llama-3.1-8b-instruct",
        "label": "Llama 3.1 8B",
        "use_case": "Fast classification, simple extraction"
    },
    {
        "id": "meta/llama-3.1-70b-instruct",
        "label": "Llama 3.1 70B",
        "use_case": "Competitor intel, swarm research, war room"
    },
    {
        "id": "meta/llama-3.3-70b-instruct",
        "label": "Llama 3.3 70B",
        "use_case": "VC Roast, structured JSON reports"
    },
    {
        "id": "mistralai/mixtral-8x7b-instruct-v0.1",
        "label": "Mixtral 8x7B",
        "use_case": "Pitch Forge, creative copywriting"
    },
    {
        "id": "microsoft/phi-3-medium-4k-instruct",
        "label": "Phi-3 Medium",
        "use_case": "Risk scanner, GTM strategy"
    },
    {
        "id": "nvidia/llama-3.1-nemotron-70b-instruct",
        "label": "Nemotron 70B",
        "use_case": "High-accuracy reasoning tasks"
    },
]

JSON_PROMPT = """Return ONLY valid JSON with no extra text:
{"market_size": "$12.4B", "cagr": "14.3%", "competitor": "Salesforce", "risk": "HIGH"}"""

def benchmark_model(model: dict) -> dict:
    client = OpenAI(base_url=NIM_BASE_URL, api_key=NIM_KEY)
    try:
        t0 = time.time()
        resp = client.chat.completions.create(
            model=model["id"],
            messages=[{"role": "user", "content": JSON_PROMPT}],
            max_tokens=100,
            timeout=30,
        )
        latency_ms = int((time.time() - t0) * 1000)
        reply = resp.choices[0].message.content.strip()
        # Check if valid JSON was returned
        import json
        try:
            parsed = json.loads(reply)
            json_valid = True
        except:
            json_valid = False
        return {
            **model,
            "status": "OK",
            "latency_ms": latency_ms,
            "json_valid": json_valid,
            "reply_preview": reply[:80],
            "error": None
        }
    except Exception as e:
        err = str(e)
        if "404" in err or "not found" in err.lower():
            status = "NOT_AVAILABLE"
        elif "429" in err:
            status = "RATE_LIMITED"
        else:
            status = "ERROR"
        return {**model, "status": status, "latency_ms": None, "json_valid": False, "reply_preview": "", "error": err[:100]}

print("\n" + "="*70)
print("  NIM MODEL BENCHMARK - LaunchMintAI")
print("  Task: Return structured JSON (simulates real tab workload)")
print("="*70)

results = []
with ThreadPoolExecutor(max_workers=6) as ex:
    futures = {ex.submit(benchmark_model, m): m for m in MODELS}
    for future in as_completed(futures):
        results.append(future.result())

results.sort(key=lambda x: x["latency_ms"] or 99999)

print(f"\n{'Model':<30} {'Status':<15} {'Latency':<12} {'JSON OK'}")
print("-"*70)
for r in results:
    lat = f"{r['latency_ms']}ms" if r['latency_ms'] else "N/A"
    jv  = "YES" if r["json_valid"] else "NO"
    print(f"  {r['label']:<28} {r['status']:<15} {lat:<12} {jv}")
    if r["error"]:
        print(f"    └─ {r['error'][:80]}")

print("\n" + "="*70)
print("  BENCHMARK COMPLETE")
print("="*70 + "\n")
