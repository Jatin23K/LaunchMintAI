import sys
import os
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

from app.services.llm_engine import _gemini_request, PRIMARY_MODEL, _KEY_POOL

print("Keys:", len(_KEY_POOL))
print("Model:", PRIMARY_MODEL)

print("Calling gemini directly...")
res = _gemini_request("Tell me a short joke.", PRIMARY_MODEL, _KEY_POOL[0])
print(f"Result: {res}")
