# -*- coding: utf-8 -*-
"""Diagnose war_room endpoint — check actual JSON structure returned"""
import sys, json, time, requests
sys.stdout.reconfigure(encoding='utf-8')

print("Testing /war_room endpoint...")
t0 = time.time()
try:
    r = requests.post(
        'http://127.0.0.1:8000/war_room',
        json={'idea': 'AI Legal Assistant for Small Businesses'},
        timeout=120
    )
    elapsed = int(time.time() - t0)
    print(f"Status: {r.status_code} | Time: {elapsed}s")

    data = r.json()
    print(f"\nTop-level keys: {list(data.keys())}")

    gm = data.get('god_mode', {})
    print(f"god_mode keys: {list(gm.keys())}")
    print(f"macro_verdict: '{str(gm.get('macro_verdict','MISSING'))[:80]}'")

    swot = gm.get('swot', None)
    print(f"swot type: {type(swot)}")
    if isinstance(swot, dict):
        for k, v in swot.items():
            print(f"  swot.{k}: {v[:2] if isinstance(v, list) else v}")

    comps = data.get('competitors', [])
    print(f"\ncompetitors count: {len(comps)}")
    for i, c in enumerate(comps[:2]):
        print(f"comp[{i}] name: {c.get('name','?')}")
        ks = c.get('kill_strategy', 'MISSING')
        print(f"comp[{i}] kill_strategy: '{str(ks)[:80]}'")

except Exception as e:
    print(f"FAILED: {e}")
