from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any
import sys
import os

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# 1. SETUP APP
app = FastAPI()

from fastapi import Request
@app.middleware("http")
async def log_requests(request: Request, call_next):
    if request.method == "POST":
        body = await request.body()
        print(f"DEBUG: Request to {request.url.path} with body: {body.decode()}")
    response = await call_next(request)
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class ExtensionRequest(BaseModel):
    extension_id: str
    payload: Any

class AnalyzeRequest(BaseModel):
    idea: str

# 2. MANUAL IMPORT (No Try/Except - We want to see the REAL error)
print("[WAIT] Importing Extensions...")
from app.extensions.market_research.extension import Extension as MarketResearch
from app.extensions.competitor_deepdive.extension import Extension as CompetitorDeepDive
from app.extensions.business_model.extension import Extension as BusinessModel
from app.extensions.roadmap_generator.extension import Extension as RoadmapGenerator
from app.extensions.people_analysis.extension import Extension as PeopleAnalysis
from app.extensions.risk_scanner.extension import Extension as RiskScanner
from app.extensions.gtm_strategy.extension import Extension as GtmStrategy
from app.extensions.financial_projection.extension import Extension as FinancialProjection
from app.extensions.decision_simulator.extension import Extension as DecisionSimulator
from app.extensions.user_persona.extension import Extension as UserPersona
from app.extensions.fundraising_intelligence.extension import Extension as Fundraising
from app.extensions.strategy_war_room.extension import Extension as WarRoom
from app.extensions.hiring_team.extension import Extension as HiringTeam
from app.extensions.product_storytelling.extension import Extension as Storytelling
from app.extensions.vision_north_star.extension import Extension as Vision
from app.extensions.metrics_kpi.extension import Extension as KPI
from app.extensions.legal_compliance.extension import Extension as Legal
from app.extensions.document_intelligence.extension import Extension as DocIntel
from app.extensions.pricing_strategy.extension import Extension as PricingStrategy
from app.extensions.funding_readiness.extension import Extension as FundingReadiness
from app.extensions.legal_risks.extension import Extension as LegalRisks
from app.extensions.traction_signals.extension import Extension as TractionSignals
from app.extensions.moat_analysis.extension import Extension as MoatAnalysis
from app.extensions.exit_scenarios.extension import Extension as ExitScenarios
print("[OK] IMPORTS SUCCESSFUL")

# 3. REGISTER EXTENSIONS
EXTENSIONS = {
    'market-research': MarketResearch(),
    'competitor-deepdive': CompetitorDeepDive(),
    'business-model': BusinessModel(),
    'roadmap-generator': RoadmapGenerator(),
    'people-analysis': PeopleAnalysis(),
    'risk-scanner': RiskScanner(),
    'gtm-strategy': GtmStrategy(),
    'financial-projection': FinancialProjection(),
    'decision-simulator': DecisionSimulator(),
    'user-persona': UserPersona(),
    'fundraising-intelligence': Fundraising(),
    'strategy-war-room': WarRoom(),
    'hiring-team': HiringTeam(),
    'product-storytelling': Storytelling(),
    'vision-north-star': Vision(),
    'metrics-kpi': KPI(),
    'legal-compliance': Legal(),
    'document-intelligence': DocIntel(),
    'pricing-strategy': PricingStrategy(),
    'funding-readiness': FundingReadiness(),
    'legal-risks': LegalRisks(),
    'traction-signals': TractionSignals(),
    'moat-analysis': MoatAnalysis(),
    'exit-scenarios': ExitScenarios()
}

@app.post("/run")
async def run_extension(req: ExtensionRequest):
    ext_id = req.extension_id.replace("_", "-")
    print(f"[REQ] REQ: {ext_id}")
    
    if ext_id not in EXTENSIONS:
        raise HTTPException(404, detail=f"Extension '{ext_id}' not found.")
    
    try:
        result = EXTENSIONS[ext_id].execute(req.payload)
        return {"status": "success", "data": result}
    except Exception as e:
        print(f"    ERROR: {e}")
        return {"status": "error", "data": {"error": str(e)}}

# =============================================================================
# LIVE RESEARCH ENGINE ENDPOINT
# =============================================================================
# NOTE: The /analyze endpoint is now defined in llm_engine.py
# We'll mount it here to make it accessible

from app.services.llm_engine import app as llm_app

#  DS Layer moved to llm_engine.py

# Mount the LLM engine's endpoints
app.mount("/", llm_app)

# ==========================================
# 4. SYSTEM DESIGN DEMO ENDPOINTS
# ==========================================
from app.services.tech_demo import TaskManager, IdeaBrain, SmartLookup, ActionHistory, FeedSorter

# Initialize Singletons (In-Memory State)
tasks_engine = TaskManager()
idea_brain = IdeaBrain()
smart_lookup = SmartLookup()
action_history = ActionHistory()
feed_sorter = FeedSorter()

# --- HEAP ---
class TaskInput(BaseModel):
    priority: int
    name: str

@app.post("/demo/tasks/add")
def add_task(t: TaskInput):
    tasks_engine.add_task(t.priority, t.name)
    return {"msg": "Task Added to Heap"}

@app.get("/demo/tasks/next")
def get_next_task():
    return {"task": tasks_engine.get_next_task()}

# --- GRAPH ---
class IdeaConnect(BaseModel):
    a: str
    b: str

@app.post("/demo/ideas/connect")
def connect_ideas(i: IdeaConnect):
    idea_brain.add_connection(i.a, i.b)
    return {"msg": "Ideas Connected"}

@app.get("/demo/ideas/related")
def get_related_ideas(idea: str):
    related = idea_brain.find_related(idea, max_depth=2)
    return {"related": related}

# --- SEARCH ---
class NoteInput(BaseModel):
    topic: str
    content: str

@app.post("/demo/search/add")
def add_note(n: NoteInput):
    smart_lookup.add_note(n.topic, n.content)
    return {"msg": "Note Indexed"}

@app.get("/demo/search/find")
def find_note(topic: str):
    return {"content": smart_lookup.find_note(topic)}

# --- STACK ---
class ActionInput(BaseModel):
    action: str

@app.post("/demo/history/act")
def perform_action(a: ActionInput):
    action_history.perform_action(a.action)
    return {"msg": "Action Pushed to Stack"}

@app.get("/demo/history/undo")
def undo_action():
    return {"msg": action_history.undo()}

# --- SORT ---
class FeedInput(BaseModel):
    items: list 

@app.post("/demo/feed/sort")
def sort_feed(f: FeedInput):
    sorted_items = feed_sorter.merge_sort(f.items)
    return {"sorted": sorted_items}

@app.get("/")
def health():
    return {"status": "Online"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print("[OK] Starting Backend Service...")
    uvicorn.run(app, host="0.0.0.0", port=port)