from app.services.llm_engine import llm, call_gemini_fast
from app.extensions.parse_helper import safe_parse_json

_ECHO_MARKERS = ["e.g.", "No clear moat", "Founder-market fit unclear", "automated messaging in EU"]

class Extension:
    def execute(self, payload):
        idea = payload.get('idea', str(payload))

        prompt = f"""You are a startup red-flag analyst. Identify critical red flags that could kill this startup.

IDEA: {idea}

RULES:
- Each red flag MUST be specific to "{idea}" — not generic startup advice.
- Focus on founder-market, business model, and execution risks (NOT regulatory/legal — those are handled separately).
- Do NOT copy example text — generate original analysis.

Return ONLY valid JSON:
{{
  "red_flags": [
    {{
      "flag": "<specific red flag for this idea>",
      "severity": "<Critical/High/Medium>",
      "explanation": "<why this is dangerous for this specific idea>",
      "fix": "<actionable mitigation>"
    }}
  ],
  "verdict": "<one sentence overall red flag assessment>"
}}

Return exactly 3 red flags."""

        result_json = llm.analyze(prompt)
        data = safe_parse_json(result_json)

        if data and any(marker in str(data) for marker in _ECHO_MARKERS):
            print(f"[RED-FLAGS] Echo detected — retrying with Gemini")
            result_json = call_gemini_fast(prompt)
            data = safe_parse_json(result_json)

        return data if data else {"error": "Red flag analysis unavailable", "raw": result_json[:200] if result_json else ""}
