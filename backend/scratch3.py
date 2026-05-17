import sys
import os
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

from app.services.llm_engine import _gemini_request, PRIMARY_MODEL, _KEY_POOL

print("Model:", PRIMARY_MODEL)
for i, k in enumerate(_KEY_POOL):
    print(f"Key {i} ({k[-6:]}):")
    res = _gemini_request("Tell me a short joke.", PRIMARY_MODEL, k)
    if res:
        print("Success")
    else:
        print("Failed")
