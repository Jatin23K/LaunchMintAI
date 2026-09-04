import os

# The full list of 18 extensions your App needs
REQUIRED_EXTENSIONS = [
    "market_research", "competitor_deepdive", "business_model", 
    "roadmap_generator", "people_analysis", "risk_scanner", 
    "gtm_strategy", "financial_projection", "decision_simulator", 
    "user_persona", "fundraising_intelligence", "strategy_war_room", 
    "hiring_team", "product_storytelling", "vision_north_star", 
    "metrics_kpi", "legal_compliance", "document_intelligence"
]

BASE_DIR = os.path.join(os.getcwd(), "app", "extensions")

# The Universal "Hybrid" Logic Code
EXTENSION_CODE = """from app.services.llm_engine import llm
import json

class Extension:
    def execute(self, payload):
        # 1. Construct the Prompt
        prompt = f"You are an expert AI startup consultant. Analyze this request: {payload}"
        
        # 2. Call Google Gemini via LLM Engine
        result_json = llm.analyze(prompt)
        
        # 3. Return Data
        try:
            return json.loads(result_json)
        except:
            return {"error": "Failed to parse JSON", "raw": result_json}
"""

def repair():
    print(f"🔧 Starting Backend Repair in: {BASE_DIR}...")
    
    if not os.path.exists(BASE_DIR):
        os.makedirs(BASE_DIR)

    count = 0
    for ext in REQUIRED_EXTENSIONS:
        ext_path = os.path.join(BASE_DIR, ext)
        
        # 1. Create Folder if missing
        if not os.path.exists(ext_path):
            os.makedirs(ext_path)
            print(f"   ➕ Created folder: {ext}")
        
        # 2. Create __init__.py (Makes it a Python Package)
        init_file = os.path.join(ext_path, "__init__.py")
        if not os.path.exists(init_file):
            with open(init_file, "w") as f:
                f.write("")
        
        # 3. Create extension.py (The Logic)
        code_file = os.path.join(ext_path, "extension.py")
        if not os.path.exists(code_file):
            with open(code_file, "w") as f:
                f.write(EXTENSION_CODE)
            print(f"   📝 Injected Logic: {ext}/extension.py")
            count += 1
            
    print(f"✅ REPAIR COMPLETE. Restored {count} extensions.")
    print("👉 NOW: Restart your 'uvicorn' server to load them.")

if __name__ == "__main__":
    repair()