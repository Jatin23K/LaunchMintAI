import sys
import os
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

from app.services.llm_engine import _gemini_request, _KEY_POOL

for model in ["gemini-1.5-flash", "gemini-2.5-flash", "gemini-2.5-flash-lite"]:
    print(f"Testing {model}...")
    res = _gemini_request("Tell me a short joke.", model, _KEY_POOL[0])
    if res:
        print(f"Success for {model}")
    else:
        print(f"Failed for {model}")
