from app.services.llm_engine import llm
import json

class Extension:
    def execute(self, payload):
        prompt = f"""
        You are a Competitive Intelligence Expert. Analyze the competitive landscape for this idea.
        Return STRICT JSON.

        IDEA: {payload}

        REQUIRED JSON STRUCTURE:
        {{
            "topCompetitors": [
                {{
                    "name": "Competitor Name",
                    "description": "Brief description",
                    "strengths": ["Strength 1"],
                    "weaknesses": ["Weakness 1"],
                    "moats": ["Moat 1"],
                    "pricing": "e.g. Freemium / $10/mo"
                }}
            ],
                }}
            ],
            "confidenceScore": "High",
            "confidenceReason": "Data availability",
            "citations": ["Source 1", "Source 2"]
        }}
        """
        result_json = llm.analyze(prompt)
        try:
            return json.loads(result_json)
        except:
            # PAID KEY: line below is safe to delete — paid models return clean JSON, parse errors are a free-tier artifact
            return {"error": "JSON Parse Error", "raw": result_json}
