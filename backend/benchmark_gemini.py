# -*- coding: utf-8 -*-
"""
Benchmark Gemini 2.5 Flash vs 2.5 Flash Lite - real latency test.
Tests both models with the same heavy JSON prompt used in ANALYZE_PROMPT.
"""
import os, time, json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Use first available key
KEY = os.environ.get("GEMINI_API_KEY_3") or os.environ.get("GEMINI_API_KEY")

MODELS_TO_TEST = [
    "gemini-2.5-flash-preview-05-20",   # Latest 2.5 Flash
    "gemini-2.5-flash",                  # Stable alias
    "gemini-2.5-flash-lite-preview-06-17",  # 2.5 Lite
    "gemini-2.5-flash-lite",             # Lite stable alias
    "gemini-flash-latest",               # Current production (2.0)
    "gemini-2.0-flash",                  # Explicit 2.0
]

# Same prompt used in ANALYZE_PROMPT - heavy JSON synthesis
HEAVY_PROMPT = """
You are a Market Intelligence Analyst. Return ONLY valid JSON with no extra text:
{
  "market": {
    "current_tam": "$6.2B",
    "forecast_tam": "$18.4B",
    "forecast_year": "2030",
    "growth": "15.2%",
    "confidence": "High"
  },
  "competitors": [
    {"name": "Salesforce", "weakness": "Enterprise bloat", "kill_strategy": "Mobile-first undercut"}
  ],
  "god_mode": {
    "macro_verdict": "Strong market timing with clear differentiation window.",
    "risk_score": "Medium"
  }
}
Task: Generate the above structure for idea: "AI legal assistant for small businesses"
"""

print("\n" + "="*65)
print("  GEMINI MODEL BENCHMARK - Heavy JSON Task")
print("="*65 + "\n")

for model_id in MODELS_TO_TEST:
    try:
        genai.configure(api_key=KEY)
        model = genai.GenerativeModel(model_id)

        t0 = time.time()
        resp = model.generate_content(
            HEAVY_PROMPT,
            generation_config=genai.GenerationConfig(
                temperature=0.2,
                max_output_tokens=512,
            )
        )
        latency_ms = int((time.time() - t0) * 1000)
        reply = resp.text.strip()

        # Check JSON validity
        clean = reply.replace("```json","").replace("```","").strip()
        try:
            json.loads(clean)
            json_ok = "YES"
        except:
            json_ok = "PARTIAL"

        # Token info if available
        try:
            tokens_in  = resp.usage_metadata.prompt_token_count
            tokens_out = resp.usage_metadata.candidates_token_count
            token_info = f"{tokens_in}in/{tokens_out}out"
        except:
            token_info = "N/A"

        print(f"  Model: {model_id}")
        print(f"    Latency  : {latency_ms}ms")
        print(f"    JSON OK  : {json_ok}")
        print(f"    Tokens   : {token_info}")
        print(f"    Preview  : {reply[:80]}...")
        print()

    except Exception as e:
        err = str(e)
        if "not found" in err.lower() or "404" in err:
            status = "MODEL NOT AVAILABLE"
        elif "429" in err:
            status = "RATE LIMITED (model exists)"
        else:
            status = f"ERROR: {err[:80]}"
        print(f"  Model: {model_id}")
        print(f"    Status: {status}")
        print()

print("="*65)
print("  BENCHMARK COMPLETE")
print("="*65 + "\n")
