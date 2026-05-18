from app.services.llm_engine import llm, call_gemini_fast
from app.extensions.parse_helper import safe_parse_json

_ECHO_MARKERS = ["e.g.", "Monthly Active Brands", "LinkedIn Outreach"]

class Extension:
    def execute(self, payload):
        idea = payload.get('idea', str(payload))
        market_size = payload.get('market_size', 'Unknown')

        prompt = f"""You are a GTM strategist. Build a go-to-market plan for this startup.

IDEA: {idea}
MARKET SIZE: {market_size}

RULES:
- Every value MUST be specific to "{idea}". Generic placeholders are FORBIDDEN.
- Channel names, CAC estimates, and timelines must reflect this specific market.
- Do NOT copy example text — generate original values.
- DATES: All timelines must use 2025 or 2026 quarters (e.g. "Q3 2025", "Q1 2026"). Never use 2023 or 2024 dates — those are in the past.

Return ONLY valid JSON:
{{
  "north_star_metric": "<the key metric for this specific business>",
  "icp": "<ideal customer profile in one sentence>",
  "channels": [
    {{"name": "<specific channel>", "cac": "<estimated cost>", "timeline": "<Q3 2025 or Q1 2026 style>", "priority": "High"}},
    {{"name": "<specific channel>", "cac": "<estimated cost>", "timeline": "<Q3 2025 or Q1 2026 style>", "priority": "Medium"}},
    {{"name": "<specific channel>", "cac": "<estimated cost>", "timeline": "<Q3 2025 or Q1 2026 style>", "priority": "Medium"}}
  ],
  "growth_lever": "<the single most powerful growth mechanism>",
  "first_100_customers": "<specific tactic to get the first 100 paying customers>"
}}"""

        result_json = llm.analyze(prompt)
        data = safe_parse_json(result_json)

        if data and any(marker in str(data) for marker in _ECHO_MARKERS):
            print(f"[GTM] Echo detected — retrying with Gemini")
            result_json = call_gemini_fast(prompt)
            data = safe_parse_json(result_json)

        # PAID KEY: line below is safe to delete — paid models reliably return valid JSON, this fallback is only needed for free-tier parse failures
        return data if data else {"error": "GTM strategy unavailable", "raw": result_json[:200] if result_json else ""}
