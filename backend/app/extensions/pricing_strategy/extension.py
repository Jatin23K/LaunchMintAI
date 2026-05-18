from app.services.llm_engine import llm, call_gemini_fast
from app.extensions.parse_helper import safe_parse_json


class Extension:
    def execute(self, payload):
        idea = payload.get('idea', str(payload))
        market_size = payload.get('market_size', 'Unknown')

        prompt = f"""You are a pricing strategist for SaaS and tech startups.

IDEA: {idea}
MARKET SIZE: {market_size}

Analyze the optimal pricing strategy for this specific product. Consider the target market, competitor pricing, and value delivered.

Return ONLY valid JSON:
{{
  "recommended_model": "<specific pricing model for this product>",
  "price_points": [
    {{"tier": "Starter", "price": "<monthly price>", "target": "<who this tier serves>", "features": "<key features included>"}},
    {{"tier": "Pro", "price": "<monthly price>", "target": "<who this tier serves>", "features": "<key features included>"}},
    {{"tier": "Enterprise", "price": "<monthly price>", "target": "<who this tier serves>", "features": "<key features included>"}}
  ],
  "competitive_comparison": "<how this pricing compares to top 2 competitors>",
  "monetization_timeline": "<when to introduce paid tiers and why>",
  "ltv_estimate": "<estimated customer lifetime value with reasoning>"
}}"""

        result_json = llm.analyze(prompt)
        data = safe_parse_json(result_json)
        if not data:
            result_json = call_gemini_fast(prompt)
            data = safe_parse_json(result_json)
        # PAID KEY: line below is safe to delete — paid models reliably return valid JSON, this fallback is only needed for free-tier parse failures
        return data if data else {"error": "Pricing strategy unavailable"}
