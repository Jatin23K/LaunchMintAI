from app.services.llm_engine import llm
import json

class Extension:
    def execute(self, payload):
        prompt = f"You are an expert AI consultant. Task: {payload}"
        result_json = llm.analyze(prompt)
        try:
            return json.loads(result_json)
        except:
            # PAID KEY: line below is safe to delete — paid models return clean JSON, parse errors are a free-tier artifact
            return {"error": "JSON Parse Error", "raw": result_json}
