import requests
import json
import time

def audit_quality(idea):
    print(f"\n--- AUDITING QUALITY FOR: {idea} ---")
    start = time.time()
    try:
        res = requests.post("http://localhost:8000/analyze", json={"idea": idea}, timeout=120)
        duration = time.time() - start
        
        if res.status_code != 200:
            print(f"FAILED: {res.status_code} - {res.text}")
            return

        report = res.json()
        
        # 1. COMPLETENESS CHECK
        print("\n[📊 COMPLETENESS]")
        fields = ["market", "competitors", "god_mode", "dept_product", "citations"]
        missing = [f for f in fields if not report.get(f)]
        print(f"Status: {'✅ FULL' if not missing else '❌ GAPS: ' + ', '.join(missing)}")
        
        # 2. ACCURACY / VERACITY CHECK (Check for Placeholders)
        print("\n[🎯 ACCURACY (placeholder check)]")
        comp_names = [c.get('name') for c in report.get("competitors", [])]
        placeholders = [n for n in comp_names if "Competitor" in n or "Industry Leader" in n]
        print(f"Status: {'✅ REAL DATA' if not placeholders else '❌ PLACEHOLDERS DETECTED: ' + ', '.join(placeholders)}")

        # 3. RELEVANCE CHECK (Check market size formatting and years)
        market = report.get("market", {})
        print("\n[🔍 RELEVANCE (market data)]")
        print(f"Industry identified: {market.get('classified_industry')}")
        print(f"Current TAM: {market.get('current_tam')} ({market.get('current_year')})")
        print(f"Growth: {market.get('growth')}")
        
        # 4. TRUSTWORTHINESS (Citations)
        print("\n[🔗 TRUSTWORTHINESS (citations)]")
        citations = report.get("citations", [])
        if not citations:
            print("❌ NO CITATIONS FOUND. Report is ungrounded.")
        else:
            for c in citations[:3]:
                print(f"- {c.get('title')}: {c.get('url')}")

        print(f"\nTotal Processing Time: {duration:.2f}s")
        
    except Exception as e:
        print(f"ERROR during audit: {e}")

if __name__ == "__main__":
    audit_quality("decentralized gpu marketplace")
