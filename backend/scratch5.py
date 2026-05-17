import requests
BASE_URL = "http://localhost:8000"
idea = "AI Supply Chain SaaS"
res = requests.post(f"{BASE_URL}/ds_insights", json={"idea": idea, "market_data": {}, "competitors": []}, timeout=30)
print(res.json())
