from app.services.llm_engine import llm
import json

class Extension:
    def execute(self, payload):
        prompt = f"""
        You are a Ruthless CFO. Your job is to kill optimistic projections and enforce standard unit economics.
        Return STRICT JSON.

        IDEA: {payload}

        REQUIRED JSON STRUCTURE:
        {{
            "valueProposition": "Certified Medical/Rehab Care for Dogs (Post-Op, Anxiety, Senior).",
            "revenueModels": [{{ "name": "Medical Rehab Session", "details": "$55 per 45-min walk (+85% vs generic). Insurance reimbursable potential." }}],
            "pricingStrategy": "Value-Based (Medical Necessity > Convenience)",
            "kpis": {{ "cac": "Strictly $120 (Verified)", "ltv": "Strictly $600 (Net)", "paybackPeriod": "9 months" }},
            "mvp_features": ["Vet-Certified Walkers", "GPS + Health Vitals Log", "Medication Admin"],
            "roadmap90": ["Month 1: Sign 5 Vet Partners", "Month 2: Hire/Train 3 Vet Techs"],
            "hiringPlan": [{{ "role": "Head of Vet Partnerships", "months": "0-3" }}],
            "estimatedCosts": {{ "development": 15000, "marketing": 5000 }},
            "userPersonas": [{{ "segment": "Post-Op/Rehab", "needs": ["Medical Safety"], "willingnessToPay": "Very High" }}],
            "goToMarket": {{ "channels": ["Vet Partnerships (Direct)"], "launchPlan": ["Offer Vets $100 Bounty per Annual Client Referral"] }},
            "moats": {{ "technical": "Health Data history", "data": "Health outcomes", "networkEffect": "Vet trust", "switchingCost": "High (Medical trust)" }},
            "businessModelCanvas": {{ "keyPartners": ["Veterinary Clinics"], "keyResources": ["Certified Walkers"], "costStructure": ["W-2 Labor", "Insurance"] }},
            "sensitivityAnalysis": {{ "scenarios": [{{ "condition": "Vet Refusal", "impact": "CAC spikes to $200" }}] }},
            "successProbability": 75,
            "successProbabilityReason": "High LTV ($600) justified by Medical Pricing ($55) and Vet Channel.",
            "first10UsersPlan": ["Manual sales to local Vet Clinic managers."],
            "confidenceScore": "High",
            "confidenceReason": "Niche is price inelastic.",
            "retentionStrategy": "W-2 Status + Benefits (Required for Medical Trust).",
            "w2CostImpact": "Payroll Tax (7.65%) + Health/Benefits (20%). Total Load: ~30%.",
            "financials": {{
                "cac": "Strictly $120 ($100 Vet Bounty + $20 Ops)",
                "ltv": "Strictly $600 ($55 avg * 2/mo * 9mo * margin)",
                "paybackPeriod": "9 months",
                "walkerLtv": "$5000+",
                "grossMargin": "15-20% (Thin but stable)"
            }}
        }}

    LOGIC RULES:
    1.  **MEDICAL NICHE ONLY**: Do not mention 'Busy Professionals'. Target 'Post-Op' or 'Behavioral'.
    2.  **PRICE = $55**: You must charge $55 to cover W-2.
    3.  **CAC BREAKDOWN**: $120 CAC = $100 Bounty paid to Vet + $20 Admin. Explain this.
    4.  **NO RANGES**: LTV $600. CAC $120. Period.
        """
        result_json = llm.analyze(prompt)
        try:
            return json.loads(result_json)
        except:
            return {"error": "JSON Parse Error", "raw": result_json}
