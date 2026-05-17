# -*- coding: utf-8 -*-
"""
List ALL available NIM models via API, then benchmark lightweight ones.
"""
import os, time, json
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

NIM_BASE_URL = "https://integrate.api.nvidia.com/v1"
NIM_KEY = os.environ.get("NIM_API_KEY_1")

client = OpenAI(base_url=NIM_BASE_URL, api_key=NIM_KEY)

# ── Step 1: List ALL available models ───────────────────────────────────────
print("\n" + "="*70)
print("  STEP 1: ALL AVAILABLE NIM MODELS")
print("="*70)

try:
    models_resp = client.models.list()
    all_models = [m.id for m in models_resp.data]
    all_models.sort()
    print(f"\n  Total models available: {len(all_models)}\n")
    for m in all_models:
        print(f"    {m}")
except Exception as e:
    print(f"  ERROR listing models: {e}")
    all_models = []

# ── Step 2: Benchmark ONLY known lightweight/fast models ────────────────────
# Filter for models that are likely fast (small parameter count in name)
LIGHTWEIGHT_KEYWORDS = [
    "8b", "7b", "3b", "2b", "1b", "mini", "small", "tiny",
    "phi", "gemma", "mistral-7b", "mistral-nemo", "granite",
    "deepseek", "qwen", "smollm", "llama-3.2"
]

candidate_models = [
    m for m in all_models
    if any(kw in m.lower() for kw in LIGHTWEIGHT_KEYWORDS)
]

print(f"\n{'='*70}")
print(f"  STEP 2: LIGHTWEIGHT MODEL CANDIDATES ({len(candidate_models)} found)")
print(f"{'='*70}")
for m in candidate_models:
    print(f"    {m}")

# ── Step 3: Live benchmark ───────────────────────────────────────────────────
JSON_PROMPT = 'Return ONLY raw JSON, no markdown: {"market_size": "$12.4B", "cagr": "14.3%", "competitor": "Salesforce"}'

def benchmark(model_id: str) -> dict:
    c = OpenAI(base_url=NIM_BASE_URL, api_key=NIM_KEY)
    try:
        t0 = time.time()
        resp = c.chat.completions.create(
            model=model_id,
            messages=[{"role": "user", "content": JSON_PROMPT}],
            max_tokens=80,
            timeout=25,
        )
        latency_ms = int((time.time() - t0) * 1000)
        reply = resp.choices[0].message.content.strip()
        try:
            # Strip markdown if present
            clean = reply.replace("```json","").replace("```","").strip()
            json.loads(clean)
            json_ok = True
        except:
            json_ok = False
        return {"model": model_id, "status": "OK", "latency_ms": latency_ms, "json_ok": json_ok, "reply": reply[:60]}
    except Exception as e:
        err = str(e)
        if "404" in err:    status = "NOT_AVAILABLE"
        elif "429" in err:  status = "RATE_LIMITED"
        elif "timeout" in err.lower() or "timed out" in err.lower(): status = "TIMEOUT(>25s)"
        else:               status = f"ERROR: {err[:60]}"
        return {"model": model_id, "status": status, "latency_ms": None, "json_ok": False, "reply": ""}

print(f"\n{'='*70}")
print(f"  STEP 3: LIVE BENCHMARK (JSON task, 25s timeout)")
print(f"{'='*70}\n")

if candidate_models:
    results = []
    # Run in parallel (up to 10 at once)
    with ThreadPoolExecutor(max_workers=10) as ex:
        futures = {ex.submit(benchmark, m): m for m in candidate_models}
        for future in as_completed(futures):
            results.append(future.result())

    # Sort: working ones first by latency, then errors
    working = sorted([r for r in results if r["status"] == "OK"], key=lambda x: x["latency_ms"])
    broken  = sorted([r for r in results if r["status"] != "OK"], key=lambda x: x["status"])

    print(f"  {'Model':<50} {'Latency':<12} {'JSON OK':<10} {'Status'}")
    print(f"  {'-'*50} {'-'*12} {'-'*10} {'-'*20}")

    for r in working:
        lat = f"{r['latency_ms']}ms"
        jok = "YES" if r["json_ok"] else "NO (strips needed)"
        print(f"  {r['model']:<50} {lat:<12} {jok:<10} {r['status']}")

    print()
    for r in broken:
        print(f"  {r['model']:<50} {'N/A':<12} {'NO':<10} {r['status']}")

    print(f"\n{'='*70}")
    print(f"  SUMMARY: {len(working)}/{len(candidate_models)} lightweight models available")
    print(f"  Fastest: {working[0]['model']} @ {working[0]['latency_ms']}ms" if working else "  None worked")
    print(f"{'='*70}\n")
else:
    print("  No lightweight candidates found in model list.")
