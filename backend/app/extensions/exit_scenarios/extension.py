from app.services.llm_engine import llm, call_gemini, _next_gemini_offset
from app.extensions.parse_helper import safe_parse_json


class Extension:
    def execute(self, payload):
        idea = payload.get('idea', str(payload))
        market_size = payload.get('market_size', 'Unknown')

        prompt = f"""You are an M&A analyst specializing in startup exit strategies.

IDEA: {idea}
MARKET SIZE: {market_size}

Analyze potential exit scenarios for this startup.

Return ONLY valid JSON:
{{
  "most_likely_exit": "<IPO/Acquisition/Acqui-hire>",
  "timeline": "<realistic years to exit>",
  "valuation_range": "<estimated exit valuation range>",
  "scenarios": [
    {{
      "type": "<exit type>",
      "probability": "<Low/Medium/High>",
      "valuation": "<estimated valuation>",
      "reasoning": "<why this exit is plausible>"
    }}
  ],
  "likely_acquirers": [
    "<company name and why they'd acquire>",
    "<another potential acquirer>"
  ],
  "value_drivers": "<what will drive the valuation up>",
  "exit_blockers": "<what could prevent or delay an exit>"
}}

Return 2-3 scenarios and 2-3 likely acquirers."""

        result_json = llm.analyze(prompt)
        data = safe_parse_json(result_json)
        if not data:
            result_json = call_gemini(prompt, key_offset=_next_gemini_offset())
            data = safe_parse_json(result_json)
        return data if data else {"error": "Exit scenario analysis unavailable"}
