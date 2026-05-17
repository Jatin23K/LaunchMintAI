from app.services.llm_engine import llm
import json

class Extension:
    def execute(self, payload):
        prompt = f"You are an expert AI consultant. Task: {payload}"
        result_json = llm.analyze(prompt)
        try:
            return json.loads(result_json)
        except:
            return {"error": "JSON Parse Error", "raw": result_json}
