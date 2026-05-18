from app.services.llm_engine import llm, call_gemini_fast
from app.extensions.parse_helper import safe_parse_json

_SCORE_DEFAULT = ["\"defensibility_score\": 8", '"defensibility_score":8',
                  "'defensibility_score': 8", "'defensibility_score':8"]


class Extension:
    def execute(self, payload):
        idea = payload.get('idea', str(payload))

        prompt = f"""You are a top-tier venture capital competitive strategy analyst.

STARTUP IDEA: {idea}

Your job: Analyze the specific competitive moat this exact startup can realistically build.
Every answer MUST be tailored to "{idea}" — generic or reusable answers are unacceptable.

SCORING RULES for defensibility_score (MUST vary — do not default to 7 or 8):
- 9-10: Multi-sided network effect or regulated data monopoly already established
- 7-8: Strong switching costs or proprietary data with 12+ month lead
- 5-6: Moderate differentiation but replicable within 6-12 months by a funded competitor
- 3-4: Thin moat, mostly execution-dependent, no structural lock-in
- 1-2: Commodity market, no defensibility
Score "{idea}" honestly — most seed-stage ideas score 4-6.

Rules:
- moat_type must reflect the actual mechanics of how THIS idea creates lock-in or advantage.
- moat_building_steps must be concrete actions specific to this product (not generic "build a great team").
- threats must name real companies or dynamics that threaten THIS specific moat.
- comparison must reference actual incumbents in THIS specific market.
- Do NOT reuse phrases from examples. Every word must apply to "{idea}".

Return ONLY valid JSON (defensibility_score must be an INTEGER, not a string):
{{
  "moat_type": "<the single primary moat type and WHY it applies to this specific idea>",
  "durability": "<Weak/Moderate/Strong — with one sentence reason>",
  "defensibility_score": <integer between 1-10, scored honestly per the rules above>,
  "moat_building_steps": [
    "<concrete step 1 specific to {idea}>",
    "<concrete step 2 specific to {idea}>",
    "<concrete step 3 specific to {idea}>"
  ],
  "threats": [
    "<specific named competitor or market force that could erode this moat>",
    "<second threat specific to this market>"
  ],
  "time_to_moat": "<realistic timeline e.g. 18-24 months>",
  "comparison": "<how this moat compares to top 1-2 incumbents in THIS specific space>"
}}"""

        result_json = llm.analyze(prompt)
        data = safe_parse_json(result_json)

        if data and any(marker in result_json for marker in _SCORE_DEFAULT):
            print(f"[MOAT] Defensibility score defaulted to 8 — retrying with Gemini")
            result_json = call_gemini_fast(prompt)
            data = safe_parse_json(result_json)

        if data and not data.get('error'):
            score = data.get('defensibility_score')
            if isinstance(score, str):
                try:
                    data['defensibility_score'] = int(score)
                except (ValueError, TypeError):
                    pass

        # PAID KEY: line below is safe to delete — paid models reliably return valid JSON, this fallback is only needed for free-tier parse failures
        return data if data else {"error": "Moat analysis unavailable"}
