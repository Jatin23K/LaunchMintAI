from app.services.llm_engine import llm, call_gemini_fast
from app.extensions.parse_helper import safe_parse_json

class Extension:
    def execute(self, payload):
        idea = payload.get('idea', str(payload))

        prompt = f"""You are a startup risk analyst. Identify the 3 most critical risks for this specific startup idea.

STARTUP IDEA: {idea}

RULES:
- Every risk must be SPECIFIC to "{idea}" — name actual regulations, agencies, or competitors that apply.
- Do NOT list generic risks like "data privacy" without naming the specific law (e.g. HIPAA, GDPR, CCPA).
- kill_condition must describe the single most realistic scenario that ends this specific company.
- overall_risk should reflect the actual regulatory and legal exposure for this sector.

Return ONLY a JSON object — no markdown, no explanation:
{{"overall_risk":"<High/Medium/Low>","risks":[{{"title":"<specific risk name for {idea}>","category":"<regulatory/legal/privacy/competitive>","severity":"<High/Medium/Low>","description":"<specific description referencing actual laws, agencies, or market dynamics for {idea}>","mitigation":"<concrete mitigation step for this specific risk>"}}],"kill_condition":"<the single most realistic scenario that kills {idea}>"}}

Include exactly 3 risks. Respond with valid JSON only."""

        result_json = llm.analyze(prompt)
        data = safe_parse_json(result_json)

        if not data or not data.get('risks'):
            print(f"[RISK] First attempt failed — retrying with Gemini")
            result_json = call_gemini_fast(prompt)
            data = safe_parse_json(result_json)

        if not data or not data.get('risks'):
            print(f"[RISK] Second attempt failed — trying simplified prompt")
            simple_prompt = f"""For the startup "{idea}", list 3 specific risks as JSON:
{{"overall_risk":"Medium","risks":[{{"title":"Risk 1","category":"regulatory","severity":"High","description":"Description specific to {idea}","mitigation":"Fix"}}],"kill_condition":"Scenario specific to {idea}"}}
JSON only:"""
            result_json = call_gemini_fast(simple_prompt)
            data = safe_parse_json(result_json)

        return data if (data and data.get('risks')) else {
            "overall_risk": "Unknown",
            "risks": [],
            "kill_condition": "Unable to assess — please re-run analysis.",
            # PAID KEY: this entire fallback dict is safe to delete — paid models reliably return valid JSON
            "error": "Risk scan unavailable"
        }
