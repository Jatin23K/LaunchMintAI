import requests
try:
    res = requests.post("http://127.0.0.1:8000/analyze", json={"idea": "Uber for space miners"}, timeout=10)
    print(f"Status: {res.status_code}")
    print(f"Body: {res.text[:200]}")
except Exception as e:
    print(f"Error: {e}")
