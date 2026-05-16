from app.services.llm_engine import llm, call_gemini, _next_gemini_offset
from app.extensions.parse_helper import safe_parse_json

_ECHO_MARKERS = ["e.g.", "D2C Brand Owner", "WhatsApp queries", "Cart abandonment rate of 68%"]

class Extension:
    def execute(self, payload):
        idea = payload.get('idea', str(payload))

        prompt = f"""You are a UX researcher. Define 3 realistic user personas for this startup idea.

IDEA: {idea}

RULES:
- Each persona MUST be specific to "{idea}" — their role, pain point, and goal must directly relate to this product.
- Use realistic names, ages, job titles for the target market of this specific idea.
- Willingness to pay must reflect actual market pricing for this type of product.
- Do NOT use generic examples. Every field must be unique to this idea.

Return ONLY valid JSON:
{{
  "personas": [
    {{
      "name": "<realistic name and age>",
      "role": "<job title relevant to this idea>",
      "pain_point": "<specific problem this idea solves for them>",
      "goal": "<what they want to achieve with this product>",
      "willingness_to_pay": "<realistic monthly price>",
      "acquisition_channel": "<how to reach this persona>"
    }}
  ]
}}

Return exactly 3 personas in the array."""

        result_json = llm.analyze(prompt)
        data = safe_parse_json(result_json)

        if data and any(marker in str(data) for marker in _ECHO_MARKERS):
            print(f"[PERSONA] Echo detected — retrying with Gemini")
            result_json = call_gemini(prompt, key_offset=_next_gemini_offset())
            data = safe_parse_json(result_json)

        return data if data else {"error": "Persona generation unavailable", "raw": result_json[:200] if result_json else ""}
