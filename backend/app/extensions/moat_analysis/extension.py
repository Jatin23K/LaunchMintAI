from app.services.llm_engine import llm, call_gemini, _next_gemini_offset
from app.extensions.parse_helper import safe_parse_json


class Extension:
    def execute(self, payload):
        idea = payload.get('idea', str(payload))

        prompt = f"""You are a competitive strategy consultant specializing in defensibility analysis.

IDEA: {idea}

Analyze what moat (competitive advantage) this startup can build and how durable it is.

Return ONLY valid JSON:
{{
  "moat_type": "<primary moat type: Network Effects / Data Moat / Switching Costs / Brand / IP / Scale Economies>",
  "durability": "<Weak/Moderate/Strong>",
  "defensibility_score": "<1-10>",
  "moat_building_steps": [
    "<specific action to build this moat>",
    "<next step>"
  ],
  "threats": [
    "<specific threat that could erode the moat>",
    "<another threat>"
  ],
  "time_to_moat": "<how long until meaningful defensibility is built>",
  "comparison": "<how this moat compares to incumbents in this space>"
}}"""

        result_json = llm.analyze(prompt)
        data = safe_parse_json(result_json)
        if not data:
            result_json = call_gemini(prompt, key_offset=_next_gemini_offset())
            data = safe_parse_json(result_json)
        return data if data else {"error": "Moat analysis unavailable"}
