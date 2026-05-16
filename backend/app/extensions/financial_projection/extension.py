from app.services.llm_engine import llm, call_gemini_fast
from app.extensions.parse_helper import safe_parse_json

_ECHO_MARKERS = ["e.g.", "SaaS Subscription $99/mo", "Pre-Seed $500K", "60% product, 30% GTM"]

class Extension:
    def execute(self, payload):
        idea = payload.get('idea', str(payload))
        market_size = payload.get('market_size', 'Unknown')
        growth_rate = payload.get('growth_rate', 'Unknown')

        prompt = f"""You are a startup CFO creating a 3-year financial projection.

IDEA: {idea}
MARKET SIZE: {market_size}
GROWTH RATE: {growth_rate}

RULES:
- Every value MUST be specific to this exact idea. Generic placeholders are FORBIDDEN.
- Pricing must reflect the actual product type and target customer.
- ARR projections must be realistic for a startup in this specific market.
- Do NOT copy example text — generate original values tailored to "{idea}".

Return ONLY valid JSON:
{{
  "assumptions": {{
    "pricing_model": "<specific pricing for this product>",
    "ltv_cac_ratio": "<calculated ratio>",
    "gross_margin": "<percentage>",
    "payback_period": "<months>"
  }},
  "projections": [
    {{"year": "Year 1", "revenue": "<revenue>", "users": "<count>", "burn": "<amount>"}},
    {{"year": "Year 2", "revenue": "<revenue>", "users": "<count>", "burn": "<amount>"}},
    {{"year": "Year 3", "revenue": "<revenue>", "users": "<count>", "burn": "<amount>"}}
  ],
  "fundraising": {{
    "recommended_round": "<round and amount>",
    "use_of_funds": "<allocation breakdown>",
    "runway_months": "<months>"
  }},
  "verdict": "<one sentence financial outlook>"
}}"""

        result_json = llm.analyze(prompt)
        data = safe_parse_json(result_json)

        if data and any(marker in str(data) for marker in _ECHO_MARKERS):
            print(f"[FIN-PROJ] Echo detected — retrying with Gemini")
            result_json = call_gemini_fast(prompt)
            data = safe_parse_json(result_json)

        return data if data else {"error": "Financial projection unavailable", "raw": result_json[:200] if result_json else ""}
