import os
import requests
import json
from dotenv import load_dotenv

# Point to backend/.env
load_dotenv("backend/.env")

api_key = os.getenv("GEMINI_API_KEY")
print(f"Using Key ending in: ...{api_key[-5:]}")
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

response = requests.get(url)
print(json.dumps(response.json(), indent=2))
