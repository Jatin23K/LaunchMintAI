import re
from app.services.llm_engine import llm, call_gemini_fast
from app.extensions.parse_helper import safe_parse_json


def _extract_valuation_billions(val_str: str) -> float | None:
    """Parse a valuation string like '$250M', '$1.2B', '$15B' → float in billions."""
    if not val_str:
        return None
    s = str(val_str).upper().replace(",", "").replace(" ", "")
    m = re.search(r"\$?([\d.]+)\s*([BM])", s)
    if not m:
        return None
    num = float(m.group(1))
    unit = m.group(2)
    return num if unit == "B" else num / 1000


def _cap_valuation(val_str: str, cap_b: float = 5.0) -> str:
    """If a valuation string exceeds cap_b billion, replace with a sane ceiling."""
    v = _extract_valuation_billions(val_str)
    if v is not None and v > cap_b:
        return f"${cap_b:.0f}B (capped — seed-stage realistic ceiling)"
    return val_str


class Extension:
    def execute(self, payload):
        idea = payload.get('idea', str(payload))
        market_size = payload.get('market_size', 'Unknown')

        prompt = f"""You are an M&A analyst specializing in startup exit strategies.

STARTUP IDEA: {idea}
MARKET SIZE: {market_size}

Analyze realistic exit scenarios for this specific startup. Every answer must be specific to "{idea}".

VALUATION REALISM RULES — this is a SEED-STAGE startup:
- Acquisition exit: realistically $50M–$500M within 5 years. Only category-defining breakouts reach $1B+.
- IPO: only if revenue exceeds $100M ARR, which takes 7-10 years minimum. Do NOT forecast $10B+ IPOs.
- valuation_range must reflect where THIS startup would realistically land, not a fantasy ceiling.
- NEVER write valuations above $2B unless the market_size is >$100B AND you explain the path clearly.
- A seed startup in a $15B market does NOT exit at $15B–$30B. That is the whole market. Realistic acquisition is $100M–$600M.

FORMAT RULES:
- likely_acquirers must be plain strings naming a REAL company (e.g. "Salesforce — would acquire for CRM integration"). Do NOT return objects.
- value_drivers must be an ARRAY of specific strings, each describing one driver (not a single comma-separated string).
- exit_blockers must be an ARRAY of specific strings, each describing one blocker (not a single comma-separated string).
- Name 2-3 real companies in this space that would plausibly acquire this startup and explain why.

Return ONLY valid JSON:
{{
  "most_likely_exit": "<IPO/Acquisition/Acqui-hire>",
  "timeline": "<realistic years to exit, e.g. 5-7 years>",
  "valuation_range": "<realistic exit valuation — seed-stage range, e.g. $80M–$400M>",
  "scenarios": [
    {{
      "type": "<exit type>",
      "probability": "<Low/Medium/High>",
      "valuation": "<realistic valuation for this scenario>",
      "reasoning": "<why this exit is plausible for {idea}>"
    }}
  ],
  "likely_acquirers": [
    "<Company Name — specific reason they'd acquire {idea}>",
    "<Company Name — specific reason they'd acquire {idea}>",
    "<Company Name — specific reason they'd acquire {idea}>"
  ],
  "value_drivers": [
    "<specific value driver 1 for {idea}>",
    "<specific value driver 2 for {idea}>",
    "<specific value driver 3 for {idea}>"
  ],
  "exit_blockers": [
    "<specific exit blocker 1 for {idea}>",
    "<specific exit blocker 2 for {idea}>"
  ]
}}

Return 2-3 scenarios. likely_acquirers, value_drivers, and exit_blockers MUST be arrays of strings."""

        result_json = llm.analyze(prompt)
        data = safe_parse_json(result_json)
        if not data:
            result_json = call_gemini_fast(prompt)
            data = safe_parse_json(result_json)

        # ── Post-processing: cap hallucinated valuations ───────────────────
        if data and not data.get("error"):
            # Cap top-level valuation_range
            if "valuation_range" in data:
                data["valuation_range"] = _cap_valuation(data["valuation_range"], cap_b=5.0)

            # Cap per-scenario valuations
            for scenario in data.get("scenarios", []):
                if "valuation" in scenario:
                    scenario["valuation"] = _cap_valuation(scenario["valuation"], cap_b=5.0)

        # PAID KEY: line below is safe to delete — paid models reliably return valid JSON, this fallback is only needed for free-tier parse failures
        return data if data else {"error": "Exit scenario analysis unavailable"}
