from app.services.llm_engine import llm, call_gemini_fast
from app.extensions.parse_helper import safe_parse_json
import random

_ECHO_MARKERS = ["e.g.", "D2C Brand Owner", "WhatsApp queries", "Cart abandonment rate of 68%",
                 "Alex Chen", "Ethan Kim", "Sarah Johnson", "Michael Lee"]

# Name pools to inject variety
_FIRST_NAMES = ["Priya", "Marcus", "Fatima", "Diego", "Yuki", "Leila", "Owen", "Anya",
                "Rafael", "Ingrid", "Kwame", "Mei", "Tobias", "Zara", "Soren", "Amara"]
_LAST_NAMES  = ["Sharma", "Williams", "Hassan", "Reyes", "Tanaka", "Patel", "Osei", "Berg",
                "Costa", "Nielsen", "Kim", "Mueller", "Adeyemi", "Rivera", "Santos", "Blake"]

def _sample_names(n: int = 3) -> list:
    firsts = random.sample(_FIRST_NAMES, min(n, len(_FIRST_NAMES)))
    lasts  = random.sample(_LAST_NAMES,  min(n, len(_LAST_NAMES)))
    return [f"{f} {l}" for f, l in zip(firsts, lasts)]


class Extension:
    def execute(self, payload):
        idea = payload.get('idea', str(payload))
        names = _sample_names(3)

        prompt = f"""You are a UX researcher specializing in customer discovery for early-stage startups.

STARTUP IDEA: {idea}

Create 3 detailed, realistic user personas for THIS specific product. Every field must directly relate to "{idea}".

RULES:
- Use exactly these names (in this order): {names[0]}, {names[1]}, {names[2]}
- Roles and job titles must be plausible users of "{idea}" — no generic "entrepreneur" or "manager".
- Pain points must describe a real frustration that "{idea}" directly solves.
- Goals must describe what the user achieves BY USING this specific product.
- Willingness to pay must reflect real market pricing for this product category.
- Acquisition channels must be specific channels where these exact personas spend time.
- Do NOT use placeholder text, generic roles, or examples from other industries.

Return ONLY valid JSON:
{{
  "personas": [
    {{
      "name": "{names[0]}",
      "role": "<specific job title of a real target user of {idea}>",
      "pain_point": "<exact frustration that {idea} resolves — be specific>",
      "goal": "<what they accomplish with {idea}>",
      "willingness_to_pay": "<realistic monthly price for this product type>",
      "acquisition_channel": "<specific platform or community where this persona is reachable>"
    }},
    {{
      "name": "{names[1]}",
      "role": "<different role, different segment>",
      "pain_point": "<different pain point from the first persona>",
      "goal": "<their specific goal>",
      "willingness_to_pay": "<their price sensitivity>",
      "acquisition_channel": "<their channel>"
    }},
    {{
      "name": "{names[2]}",
      "role": "<third distinct role>",
      "pain_point": "<third unique pain point>",
      "goal": "<third goal>",
      "willingness_to_pay": "<their willingness to pay>",
      "acquisition_channel": "<their channel>"
    }}
  ]
}}"""

        result_json = llm.analyze(prompt)
        data = safe_parse_json(result_json)

        if data and any(marker in str(data) for marker in _ECHO_MARKERS):
            print(f"[PERSONA] Echo detected — retrying with Gemini")
            result_json = call_gemini_fast(prompt)
            data = safe_parse_json(result_json)

        # PAID KEY: line below is safe to delete — paid models reliably return valid JSON, this fallback is only needed for free-tier parse failures
        return data if data else {"error": "Persona generation unavailable", "raw": result_json[:200] if result_json else ""}
