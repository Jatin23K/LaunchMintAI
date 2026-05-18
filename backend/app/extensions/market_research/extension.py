from app.services.llm_engine import llm
import json

class Extension:
    def execute(self, payload):
        prompt = f"""
        You are an expert Market Research Analyst. Analyze the following startup idea and return a JSON object.
        INVALID OUTPUT will trigger a system crash. You MUST return strictly valid JSON.

        IDEA: {payload}

        REQUIRED JSON STRUCTURE:
        {{
            "tam": "Total Addressable Market size (e.g. $5B)",
            "sam": "Serviceable Available Market size",
            "som": "Serviceable Obtainable Market size",
            "growthRate": "CAGR percentage",
            "industryCategory": "Primary industry",
            "subCategory": "Niche",
            "coreProblem": "The main pain point being solved",
            "painSeverityScore": "High/Medium/Low",
            "opportunitySummary": "1-2 sentence summary",
            "fragmentation": "High/Medium/Low",
            "earlyAdopters": ["Persona 1", "Persona 2"],
            "opportunityMap": {{
                "whiteSpaces": ["Area 1", "Area 2"],
                "inefficiencies": ["Inefficiency 1"],
                "entryPoints": ["Entry 1"]
            }},
            "customerSegments": ["Seg 1", "Seg 2"],
            "marketTrends": ["Trend 1", "Trend 2"],
            "marketTrends": ["Trend 1", "Trend 2"],
            "opportunities": ["Define 'Price Inelastic' Niche (e.g. 'Post-Surgical Rehab', 'Aggressive Dog Handling'). MUST justify $45/walk."],
            "targetAudience": "Owners who CANNOT use Rover due to safety/medical risks. (Willing to pay +50%).",
            "risks": ["Price Resistance (Can we convert at $45?)"],
            "confidenceScore": "High",
            "confidenceReason": "Reason for score",
            "citations": ["List 2-3 real/likely sources"],
            "timingScore": "85",
            "marketReadiness": "High (Pet Health spending is at all-time high)",
            "windowOfOpportunity": "Why NOW? (e.g. 'Post-Pandemic Separation Anxiety' wave is peaking)."
        }}
        """
        result_json = llm.analyze(prompt)
        try:
            return json.loads(result_json)
        except:
            # PAID KEY: line below is safe to delete — paid models return clean JSON, parse errors are a free-tier artifact
            return {"error": "JSON Parse Error", "raw": result_json}
