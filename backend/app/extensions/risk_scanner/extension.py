from app.services.llm_engine import llm, call_gemini_fast
from app.extensions.parse_helper import safe_parse_json

_ECHO_MARKERS = ["e.g.", "D2C brands may resist", "Policy changes can break"]

class Extension:
    def execute(self, payload):
        idea = payload.get('idea', str(payload))

        prompt = f"""You are a regulatory and structural risk analyst for startups.

IDEA: {idea}

Focus ONLY on these risk categories (do NOT overlap with general business/operational risks):
1. REGULATORY: Government regulations, licensing requirements, industry-specific compliance
2. LEGAL: IP risks, patent conflicts, liability exposure, terms of service violations
3. MARKET STRUCTURAL: Market concentration, platform dependency, winner-take-all dynamics
4. COMPLIANCE: Data privacy (GDPR/CCPA), industry certifications (SOC2/HIPAA), audit requirements

Do NOT include generic risks like "competition" or "market adoption" — those are covered elsewhere.

Return ONLY valid JSON:
{{
  "overall_risk": "<Low/Medium/High/Critical>",
  "risks": [
    {{
      "title": "<specific regulatory/legal/structural risk>",
      "category": "<regulatory/legal/market_structural/compliance>",
      "severity": "<Low/Medium/High>",
      "description": "<specific description for {idea}>",
      "mitigation": "<actionable mitigation step>"
    }}
  ],
  "kill_condition": "<the single regulatory or legal scenario that would kill this startup>"
}}

Return exactly 3-4 risks."""

        result_json = llm.analyze(prompt)
        data = safe_parse_json(result_json)

        if data and any(marker in str(data) for marker in _ECHO_MARKERS):
            print(f"[RISK] Echo detected — retrying with Gemini")
            result_json = call_gemini_fast(prompt)
            data = safe_parse_json(result_json)

        return data if data else {"error": "Risk scan unavailable", "raw": result_json[:200] if result_json else ""}
