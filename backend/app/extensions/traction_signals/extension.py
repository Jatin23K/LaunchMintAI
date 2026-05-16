from app.services.llm_engine import llm, call_gemini, _next_gemini_offset
from app.extensions.parse_helper import safe_parse_json


class Extension:
    def execute(self, payload):
        idea = payload.get('idea', str(payload))

        prompt = f"""You are a startup growth advisor specializing in early-stage traction.

IDEA: {idea}

Identify the key traction signals this startup should pursue and how to validate demand before building.

Return ONLY valid JSON:
{{
  "validation_methods": [
    {{
      "method": "<specific validation approach>",
      "timeline": "<how long it takes>",
      "cost": "<estimated cost>",
      "success_signal": "<what indicates positive validation>"
    }}
  ],
  "early_metrics": [
    {{
      "metric": "<specific measurable metric>",
      "target_30_days": "<realistic 30-day target>",
      "target_90_days": "<realistic 90-day target>"
    }}
  ],
  "signals_to_watch": [
    "<market signal indicating good timing>",
    "<another signal>"
  ],
  "pre_launch_strategy": "<specific approach to build waitlist/interest before product is ready>"
}}

Return 3 validation methods and 3-4 early metrics."""

        result_json = llm.analyze(prompt)
        data = safe_parse_json(result_json)
        if not data:
            result_json = call_gemini(prompt, key_offset=_next_gemini_offset())
            data = safe_parse_json(result_json)
        return data if data else {"error": "Traction signals unavailable"}
