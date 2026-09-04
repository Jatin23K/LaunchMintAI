from app.services.llm_engine import llm
import json

class Extension:
    def execute(self, payload):
        prompt = f"""
        You are a Risk Management Officer. Analyze potential failure points.
        Return STRICT JSON.

        IDEA: {payload}

        REQUIRED JSON STRUCTURE:
        {{
            "marketRisks": [{{ "risk": "Low acceptance", "mitigation": "Pilot", "mitigationPlan": "Run 3-month pilot with 20 users..." }}],
            "operationalRisks": [{{ "risk": "Server outage", "mitigation": "Redundancy", "mitigationPlan": "Use AWS multi-region..." }}],
            "financialRisks": [{{ "risk": "High burn rate", "mitigation": "Bootstrap", "mitigationPlan": "Limit hiring to 2 founders..." }}],
            "confidenceScore": "High",
            "confidenceReason": "Standard pattern"
        }}
        
    LOGIC RULES:
    1.  **THE W-2 MOAT**: If competitors are Gig (Uber-for-X), your ONLY differentiation is 'Professionalism/Safety'.
    2.  **PREMIUM PRICING**: You must position as the 'Mercedes' option. "We cost 20% more because our walkers are Employees, not Gig workers."
    3.  **TRUST > COST**: Do not try to be cheaper. Try to be safer.
        """
        result_json = llm.analyze(prompt)
        try:
            return json.loads(result_json)
        except:
            return {"error": "JSON Parse Error", "raw": result_json}
