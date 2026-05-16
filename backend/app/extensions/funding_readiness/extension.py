from app.services.llm_engine import llm, call_gemini, _next_gemini_offset
from app.extensions.parse_helper import safe_parse_json


class Extension:
    def execute(self, payload):
        idea = payload.get('idea', str(payload))
        market_size = payload.get('market_size', 'Unknown')
        growth_rate = payload.get('growth_rate', 'Unknown')

        prompt = f"""You are a venture capital analyst assessing funding readiness for an early-stage startup.

IDEA: {idea}
MARKET SIZE: {market_size}
GROWTH RATE: {growth_rate}

Evaluate how ready this startup is to raise funding and what gaps need to be filled.

Return ONLY valid JSON:
{{
  "readiness_score": "<1-10 score>",
  "recommended_round": "<Pre-Seed/Seed/Series A with target amount>",
  "strengths": [
    "<specific strength that makes this fundable>",
    "<another strength>"
  ],
  "gaps": [
    "<specific gap that would concern investors>",
    "<another gap>"
  ],
  "investor_targets": "<types of VCs/angels that invest in this space>",
  "timeline": "<realistic timeline to raise given current state>",
  "key_metrics_needed": "<what traction metrics investors will want to see>"
}}"""

        result_json = llm.analyze(prompt)
        data = safe_parse_json(result_json)
        if not data:
            result_json = call_gemini(prompt, key_offset=_next_gemini_offset())
            data = safe_parse_json(result_json)
        return data if data else {"error": "Funding readiness unavailable"}
