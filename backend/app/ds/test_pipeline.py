"""
Phase 4 Validation — Full Pipeline + API Endpoint
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

test_payload = {
    "idea": "AI Legal Assistant for Small Businesses",
    "market_data": {
        "current_tam": "$12.4B",
        "growth": "17.8%",
        "competitors": ["Clio", "Harvey AI", "Ironclad"]
    },
    "competitors": ["Clio", "Harvey AI", "Ironclad"]
}

print("\n" + "="*60)
print("PHASE 4 VALIDATION — PIPELINE + ENDPOINT TEST")
print("="*60)

try:
    response = requests.post(
        f"{BASE_URL}/ds_insights",
        json=test_payload,
        timeout=30
    )

    assert response.status_code == 200, f"Status: {response.status_code}"
    data = response.json()

    assert data["status"] == "success"
    ds = data["data"]

    # Check survival
    assert "survival" in ds
    assert "error" not in ds["survival"]
    assert 0 <= ds["survival"]["survival_probability"] <= 1
    print(f"  [PASS] survival_probability : {ds['survival']['survival_probability']}")
    print(f"  [PASS] risk_tier            : {ds['survival']['risk_tier']}")

    # Check financials
    assert "financials" in ds
    assert "error" not in ds["financials"]
    assert ds["financials"]["bear"]["runway_months"] <= ds["financials"]["base"]["runway_months"]
    print(f"  [PASS] Bear runway          : {ds['financials']['bear']['runway_months']} months")
    print(f"  [PASS] Base runway          : {ds['financials']['base']['runway_months']} months")
    print(f"  [PASS] Bull runway          : {ds['financials']['bull']['runway_months']} months")

    # Check sentiment
    assert "sentiment" in ds
    assert "error" not in ds["sentiment"]
    assert len(ds["sentiment"]["competitors"]) > 0
    print(f"  [PASS] Competitors analyzed : {len(ds['sentiment']['competitors'])}")

    # Check meta
    assert "meta" in ds
    latency = ds["meta"]["pipeline_latency_ms"]
    assert latency < 5000, f"Too slow: {latency}ms"
    print(f"  [PASS] Pipeline latency     : {latency}ms")

    print("\n[ALL CHECKS PASSED]")

except Exception as e:
    print(f"\n[FAIL] {e}")

print("="*60)
