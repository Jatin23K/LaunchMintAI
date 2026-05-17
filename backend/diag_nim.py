# -*- coding: utf-8 -*-
"""Diagnose NIM call failures - run this to see exact error per model per key"""
import os, sys, time, requests
from dotenv import load_dotenv
load_dotenv()

NIM_BASE_URL = "https://integrate.api.nvidia.com/v1"
MODELS = [
    "meta/llama-3.1-70b-instruct",
    "meta/llama-3.1-8b-instruct",
    "nvidia/llama-3.1-nemotron-nano-8b-v1",
    "meta/llama-4-maverick-17b-128e-instruct",
    "mistralai/ministral-14b-instruct-2512",
]
KEYS = [v for v in [os.environ.get(f"NIM_API_KEY_{i}") for i in range(1,7)] if v and v.startswith("nvapi-")]
print(f"Keys loaded: {len(KEYS)}")

PROMPT = '{"test": "ok"}'

for model in MODELS:
    key = KEYS[0]
    try:
        t0 = time.time()
        res = requests.post(
            f"{NIM_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={"model": model, "messages": [{"role": "user", "content": f"Return exactly: {PROMPT}"}],
                  "max_tokens": 50, "temperature": 0.1},
            timeout=30
        )
        latency = int((time.time()-t0)*1000)
        if res.status_code == 200:
            text = res.json()["choices"][0]["message"]["content"]
            print(f"[OK]   {model} | {latency}ms | {text[:60]}")
        else:
            print(f"[ERR]  {model} | HTTP {res.status_code} | {res.text[:150]}")
    except requests.exceptions.Timeout:
        print(f"[TIMEOUT] {model} | >30s")
    except Exception as e:
        print(f"[FAIL] {model} | {e}")
