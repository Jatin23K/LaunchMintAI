import requests
BASE_URL = "http://localhost:8000"
idea = "AI Supply Chain SaaS"
res = requests.post(f"{BASE_URL}/war_room", json={"idea": idea}, timeout=160)
print(res.json())
