import os
import shutil

# 1. DEFINE PATHS
BASE_DIR = os.path.join(os.getcwd(), "app", "extensions")
REQUIRED_EXTENSIONS = [
    "market_research", "competitor_deepdive", "business_model", 
    "roadmap_generator", "people_analysis", "risk_scanner", 
    "gtm_strategy", "financial_projection", "decision_simulator", 
    "user_persona", "fundraising_intelligence", "strategy_war_room", 
    "hiring_team", "product_storytelling", "vision_north_star", 
    "metrics_kpi", "legal_compliance", "document_intelligence"
]

# 2. THE LOGIC
EXTENSION_CODE = """from app.services.llm_engine import llm
import json

class Extension:
    def execute(self, payload):
        prompt = f"You are an expert AI consultant. Task: {payload}"
        result_json = llm.analyze(prompt)
        try:
            return json.loads(result_json)
        except:
            return {"error": "JSON Parse Error", "raw": result_json}
"""

def reset():
    print("🔥 INITIATING FORCE RESET...")
    
    # DELETE OLD FOLDER IF EXISTS
    if os.path.exists(BASE_DIR):
        print(f"   🗑️ Deleting corrupted folder: {BASE_DIR}")
        shutil.rmtree(BASE_DIR)
    
    # RECREATE
    os.makedirs(BASE_DIR)
    print("   ✨ Created fresh 'extensions' folder.")

    # GENERATE EXTENSIONS
    for ext in REQUIRED_EXTENSIONS:
        ext_path = os.path.join(BASE_DIR, ext)
        os.makedirs(ext_path)
        
        # Create __init__.py
        with open(os.path.join(ext_path, "__init__.py"), "w") as f:
            f.write("")
            
        # Create extension.py
        with open(os.path.join(ext_path, "extension.py"), "w") as f:
            f.write(EXTENSION_CODE)
            
        print(f"   ✅ Generated: {ext}")

    print("🎉 RESET COMPLETE. All 18 Extensions are fresh.")

if __name__ == "__main__":
    reset()