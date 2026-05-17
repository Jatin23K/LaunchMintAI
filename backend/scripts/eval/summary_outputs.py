
import requests
import json

ideas = [
    "Online Taxi India",
    "SaaS for Ant Farming Optimization",
    "Drone Delivery Logistics",
    "VR Education Platform",
    "Fintech for Teenagers",
    "Bio-degradable Packaging",
    "AI Legal Assistant"
]

header = f"{'ID':<4} | {'Idea':<25} | {'Market Size':<12} | {'Growth':<8} | {'Competitors'}"
print(header)
print("-" * len(header))

for i, idea in enumerate(ideas):
    try:
        res = requests.post("http://127.0.0.1:8000/analyze", json={"idea": idea}, timeout=15)
        data = res.json()
        mkt = data.get("market", {})
        size = mkt.get("size", "N/A")
        growth = mkt.get("growth", "N/A")
        comps = ", ".join([c['name'] for c in data.get("competitors", [])])
        print(f"{i+1:02} | {idea:<25} | {size:<12} | {growth:<8} | {comps}")
    except Exception as e:
        print(f"{i+1:02} | {idea:<25} | ERROR: {str(e)}")
