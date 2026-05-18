from app.services.llm_engine import llm, call_gemini_fast
from app.extensions.parse_helper import safe_parse_json

_TEMPLATE_MARKERS = ["<Pre-Seed>", "<Seed>", "<Series A>", "<6 months>", "<realistic", "<specific"]


class Extension:
    def execute(self, payload):
        idea = payload.get('idea', str(payload))
        market_size = payload.get('market_size', 'Unknown')
        growth_rate = payload.get('growth_rate', 'Unknown')

        prompt = f"""You are a venture capital analyst at a top-tier fund assessing funding readiness.

STARTUP IDEA: {idea}
MARKET SIZE: {market_size}
MARKET GROWTH RATE: {growth_rate}

Critically evaluate how fundable THIS specific startup is RIGHT NOW (pre-traction, concept stage).

SCORING RULES — readiness_score must reflect these realities:
- Score 8-10: Clear category leader potential, large TAM (>$10B), proven monetization in adjacent markets
- Score 6-7: Solid idea, large market, but undifferentiated or unproven monetization
- Score 4-5: Niche market, unclear moat, high regulatory risk, or crowded space with entrenched players
- Score 1-3: Tiny TAM, no clear differentiation, or regulatory minefield
- Score honestly — do NOT default to 6 or 7. Most seed-stage ideas with unproven traction score 5-7.

CRITICAL FORMAT RULES:
- recommended_round: write a clean value like "Pre-Seed — $500K" or "Seed — $1.5M". No angle brackets.
- timeline: write a clean value like "4-6 months" or "9-12 months". No angle brackets. No full sentences.
- readiness_score: must be an INTEGER (e.g. 5, not "5/10" or "5 out of 10")
- All string values must be complete sentences or short phrases — NO angle bracket placeholders.

RULES:
- strengths must reference specific aspects of "{idea}" (not generic like "large market")
- gaps must name concrete obstacles THIS idea faces (regulatory hurdles, competition, tech risk)
- investor_targets must name real fund types or notable investors that invest in this exact space
- key_metrics_needed must be the actual KPIs investors in this space track

Return ONLY valid JSON:
{{
  "readiness_score": <integer 1-10>,
  "recommended_round": "Pre-Seed — $XXX or Seed — $XM (specific amount for {idea})",
  "strengths": [
    "Specific strength of {idea}",
    "Second strength",
    "Third strength"
  ],
  "gaps": [
    "Specific gap investors will probe for {idea}",
    "Second gap",
    "Third gap"
  ],
  "investor_targets": "Specific fund types or named funds that invest in this exact space",
  "timeline": "X-Y months",
  "key_metrics_needed": "Specific KPIs investors track in this sector"
}}"""

        result_json = llm.analyze(prompt)
        data = safe_parse_json(result_json)

        if data and any(marker in str(data) for marker in _TEMPLATE_MARKERS):
            print(f"[FUNDING] Template leak detected — retrying with Gemini")
            result_json = call_gemini_fast(prompt)
            data = safe_parse_json(result_json)

        if data and not data.get('error'):
            score = data.get('readiness_score')
            if isinstance(score, str):
                try:
                    data['readiness_score'] = int(str(score).split('/')[0].strip())
                except (ValueError, TypeError):
                    pass
            for field in ('recommended_round', 'timeline'):
                val = data.get(field, '')
                if val:
                    data[field] = str(val).strip('<>').strip()

        # PAID KEY: line below is safe to delete — paid models reliably return valid JSON, this fallback is only needed for free-tier parse failures
        return data if data else {"error": "Funding readiness unavailable"}
