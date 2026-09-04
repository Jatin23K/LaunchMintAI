import requests
import json
import time

def audit_quality(idea):
    print(f"\n--- DEEP RAW AUDIT: {idea} ---")
    try:
        res = requests.post("http://localhost:8000/analyze", json={"idea": idea}, timeout=120)
        if res.status_code == 200:
            data = res.json()
            # Print the structure for debugging
            print("\nAvailable Keys:", list(data.keys()))
            if "market" in data:
                print("Market Keys:", list(data["market"].keys()))
            
            # Print Citations specifically
            print(f"\nCitations found: {len(data.get('citations', []))}")
            if data.get('citations'):
                for c in data['citations']:
                    print(f" - {c.get('title')}: {c.get('url')}")
            else:
                 print("WARNING: 'citations' key present but empty or missing.")

            # Print first 2 depts
            print(f"Dept Product entries: {len(data.get('dept_product', []))}")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    audit_quality("Decentralized GPU marketplace for AI training using gamer hardware")
