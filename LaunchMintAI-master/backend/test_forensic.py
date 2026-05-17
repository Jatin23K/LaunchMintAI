
import requests
import json

idea = "Whatsapp for India"
print(f"🚀 Testing Forensic Audit for: {idea}")

try:
    res = requests.post("http://127.0.0.1:8000/analyze", json={"idea": idea}, timeout=40)
    data = res.json()
    
    for i, comp in enumerate(data.get("competitors", [])):
        print(f"\n--- Competitor {i+1}: {comp.get('name')} ---")
        print(f"Weakness: {comp.get('weakness')}")
        print(f"Market & Fin: {comp.get('market_fin')}")
        print(f"Product Intel: {comp.get('product_intel')}")
        print(f"Tech Health: {comp.get('technical_infra')}")
        print(f"Customer Sentiment: {comp.get('sentiment')}")
        print(f"Marketing Strategy: {comp.get('marketing')}")
except Exception as e:
    print(f"Error: {e}")
