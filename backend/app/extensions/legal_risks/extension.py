from app.services.llm_engine import llm, call_gemini, _next_gemini_offset
from app.extensions.parse_helper import safe_parse_json


class Extension:
    def execute(self, payload):
        idea = payload.get('idea', str(payload))

        prompt = f"""You are a startup legal advisor specializing in regulatory compliance.

IDEA: {idea}

Identify the key legal and compliance requirements this startup must address before launch and during growth.

Return ONLY valid JSON:
{{
  "risks": [
    {{
      "area": "<specific legal area>",
      "requirement": "<what must be done>",
      "urgency": "<Pre-Launch/Within 6 Months/Within 1 Year>",
      "cost_estimate": "<rough cost to address>"
    }}
  ],
  "jurisdictions": ["<key jurisdictions to consider>"],
  "compliance_checklist": [
    "<specific compliance item needed before launch>",
    "<another item>"
  ],
  "ip_strategy": "<recommended IP protection approach>",
  "biggest_legal_threat": "<the single biggest legal risk and how to mitigate it>"
}}

Return 3-4 risks and 4-5 checklist items."""

        result_json = llm.analyze(prompt)
        data = safe_parse_json(result_json)
        if not data:
            result_json = call_gemini(prompt, key_offset=_next_gemini_offset())
            data = safe_parse_json(result_json)
        return data if data else {"error": "Legal risk analysis unavailable"}
