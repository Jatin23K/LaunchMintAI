# -*- coding: utf-8 -*-
"""Verify /analyze and /war_room run truly in parallel (async fix validation)"""
import sys, time, threading, requests
sys.stdout.reconfigure(encoding='utf-8')

BASE = "http://127.0.0.1:8000"
IDEA = "FinTech App for Freelancer Invoicing"
results = {}

def call_analyze():
    t0 = time.time()
    r = requests.post(f"{BASE}/analyze", json={"idea": IDEA}, timeout=180)
    elapsed = round(time.time() - t0, 1)
    d = r.json()
    results["analyze"] = {
        "status": r.status_code,
        "time": elapsed,
        "tam": d.get("market", {}).get("current_tam", "MISSING"),
        "competitors": len(d.get("competitors", [])),
    }
    print(f"[ANALYZE] done in {elapsed}s | TAM={results['analyze']['tam']}")

def call_war_room():
    t0 = time.time()
    r = requests.post(f"{BASE}/war_room", json={"idea": IDEA}, timeout=180)
    elapsed = round(time.time() - t0, 1)
    d = r.json()
    gm = d.get("god_mode", {})
    swot = gm.get("swot", {})
    results["war_room"] = {
        "status": r.status_code,
        "time": elapsed,
        "macro_verdict": str(gm.get("macro_verdict", "MISSING"))[:60],
        "swot_strengths": len(swot.get("strengths", [])),
        "competitors": len(d.get("competitors", [])),
        "kill_strategy": bool(d.get("competitors", [{}])[0].get("kill_strategy") if d.get("competitors") else False),
    }
    print(f"[WAR ROOM] done in {elapsed}s | verdict='{results['war_room']['macro_verdict']}'")

print(f"Firing /analyze + /war_room SIMULTANEOUSLY for: '{IDEA}'")
t_start = time.time()

t1 = threading.Thread(target=call_analyze)
t2 = threading.Thread(target=call_war_room)
t1.start(); t2.start()
t1.join(); t2.join()

total = round(time.time() - t_start, 1)
print(f"\n=== RESULTS (total wall time: {total}s) ===")
for k, v in results.items():
    print(f"\n[{k.upper()}]")
    for fk, fv in v.items():
        print(f"  {fk}: {fv}")

# Key check: if truly parallel, total should be ~max(analyze_time, war_room_time)
# If sequential, total = analyze_time + war_room_time
analyze_t = results.get("analyze", {}).get("time", 0)
war_t = results.get("war_room", {}).get("time", 0)
expected_parallel = max(analyze_t, war_t)
print(f"\n[CHECK] Total={total}s | Expected if parallel: ~{expected_parallel}s | Expected if sequential: ~{analyze_t+war_t}s")
if total <= expected_parallel * 1.3:
    print("[OK] Running IN PARALLEL")
else:
    print("[FAIL] Running SEQUENTIALLY (thread pool blocked)")
