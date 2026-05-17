import sys
import os
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

from app.services.llm_engine import call_gemini

print("Calling gemini...")
res = call_gemini("Tell me a short joke.")
print(f"Result: {res}")
