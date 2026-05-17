import requests
import json
res = requests.post("http://localhost:8000/war_room", json={"idea": "EdTech Tutoring App"}, timeout=30)
print(json.dumps(res.json()))
