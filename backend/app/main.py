from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any
import sys
import os
import re
import asyncio

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

class CompareRequest(BaseModel):
    idea_a: str
    market_a: dict = {}
    idea_b: str
    market_b: dict = {}

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


def infer_extension_provenance(ext_id: str, payload: Any, result: Any) -> tuple[str, list[str], str | None]:
    inferred_only = {
        'market-research', 'business-model', 'roadmap-generator', 'decision-simulator',
        'user-persona', 'fundraising-intelligence', 'strategy-war-room', 'hiring-team',
        'product-storytelling', 'vision-north-star', 'metrics-kpi', 'financial-projection',
        'gtm-strategy', 'risk-scanner', 'people-analysis', 'pricing-strategy',
        'funding-readiness', 'traction-signals', 'moat-analysis', 'exit-scenarios',
    }
    if isinstance(result, dict) and result.get("error"):
        return "generated", [], str(result.get("error"))
    evidence_used = []
    if isinstance(payload, dict):
        if payload.get("market_size"):
            evidence_used.append("market_size")
        if payload.get("growth_rate"):
            evidence_used.append("growth_rate")
        if payload.get("idea"):
            evidence_used.append("idea")
    if ext_id in {'legal-risks', 'legal-compliance', 'document-intelligence', 'competitor-deepdive'}:
        level = "inferred"
    elif ext_id in inferred_only:
        level = "generated"
    else:
        level = "inferred"
    return level, evidence_used, None

@app.post("/run")
async def run_extension(req: ExtensionRequest):
    ext_id = req.extension_id.replace("_", "-")
    print(f"[REQ] REQ: {ext_id}")
    
    if ext_id not in EXTENSIONS:
        raise HTTPException(404, detail=f"Extension '{ext_id}' not found.")
    
    try:
        result = EXTENSIONS[ext_id].execute(req.payload)
        provenance_level, evidence_used, error_reason = infer_extension_provenance(ext_id, req.payload, result)
        return {
            "status": "success" if not error_reason else "partial",
            "data": result,
            "provenance_level": provenance_level,
            "evidence_used": evidence_used,
            "error_reason": error_reason,
        }
    except Exception as e:
        print(f"    ERROR: {e}")
        return {
            "status": "error",
            "data": {"error": str(e)},
            "provenance_level": "generated",
            "evidence_used": [],
            "error_reason": str(e),
        }

# =============================================================================
# BATTLE ROOM — /compare endpoint
# =============================================================================

def _parse_tam(val) -> float:
    """Parse TAM string to float in billions. Handles $15.2B, $850M, $2.1T."""
    if val is None:
        return 0.0
    s = str(val).upper().replace(',', '').replace(' ', '')
    m = re.search(r'(\d+(?:\.\d+)?)', s)
    if not m:
        return 0.0
    num = float(m.group(1))
    rest = s[m.end():m.end()+3]
    if rest.startswith('T') and not rest.startswith('TH'):
        num *= 1000       # trillion → billions
    elif rest.startswith('M') and 'MI' not in rest and 'MO' not in rest:
        num /= 1000       # million → billions
    # B or bare number = already in billions
    return round(num, 2)

def _parse_pct(val) -> float:
    """Extract numeric value — handles growth %, risk scores, and text tiers."""
    if val is None:
        return 0.0
    s = str(val).strip().upper()
    # Map text risk tiers to numeric scores (1-10 scale)
    risk_map = {
        'LOW': 2.0, 'MINIMAL': 2.0, 'VERY LOW': 2.0,
        'MEDIUM': 5.0, 'MODERATE': 5.0,
        'HIGH': 7.5, 'ELEVATED': 7.5,
        'CRITICAL': 9.0, 'EXTREME': 9.0, 'VERY HIGH': 9.0,
    }
    if s in risk_map:
        return risk_map[s]
    m = re.search(r'(\d+(?:\.\d+)?)', s)
    return round(float(m.group(1)), 2) if m else 0.0

def _execution_score(idea: str) -> float:
    """Score execution feasibility 0-10 from idea text alone."""
    idea_lower = idea.lower()
    score = 5.0
    b2b = ["saas", "enterprise", "b2b", "platform", "tool", "api",
           "accounting", "legal", "compliance", "workflow", "automation",
           "recruiter", "co-pilot", "copilot", "forecasting"]
    ai  = ["ai", "ai-powered", "machine learning", "llm", "intelligent",
           "predictive", "generative", "nlp"]
    if any(k in idea_lower for k in b2b):
        score += 1.5   # B2B = clearer monetisation path
    if any(k in idea_lower for k in ai):
        score += 1.0   # AI = current investor tailwind
    if len(idea.split()) > 6:
        score += 0.5   # specific idea = focused execution
    return round(min(score, 10.0), 1)

@app.post("/compare")
async def compare_ideas(req: CompareRequest):
    a, b = req.market_a, req.market_b

    # ── Parse all signals ───────────────────────────────────────────────────
    tam_a    = _parse_tam(a.get('forecast_tam') or a.get('size'))
    tam_b    = _parse_tam(b.get('forecast_tam') or b.get('size'))
    growth_a = _parse_pct(a.get('growth'))
    growth_b = _parse_pct(b.get('growth'))
    risk_a   = _parse_pct(a.get('risk_score', '5'))   # lower = better
    risk_b   = _parse_pct(b.get('risk_score', '5'))
    exec_a   = _execution_score(req.idea_a)
    exec_b   = _execution_score(req.idea_b)

    # Investor appeal: weighted composite (TAM × growth × safety)
    def _invest(tam, growth, risk):
        return round(max(tam, 0.1) * 0.4 + max(growth, 0.1) * 0.3 + (10 - risk) * 0.3, 2)
    inv_a = _invest(tam_a, growth_a, risk_a)
    inv_b = _invest(tam_b, growth_b, risk_b)

    # ── Score 5 categories ─────────────────────────────────────────────────
    scorecard = {
        'market_size': {
            'a': f"${tam_a}B TAM",
            'b': f"${tam_b}B TAM",
            'winner': 'A' if tam_a >= tam_b else 'B',
        },
        'growth_rate': {
            'a': f"{growth_a}% CAGR",
            'b': f"{growth_b}% CAGR",
            'winner': 'A' if growth_a >= growth_b else 'B',
        },
        'competition': {
            'a': f"Risk {risk_a}/10",
            'b': f"Risk {risk_b}/10",
            'winner': 'A' if risk_a <= risk_b else 'B',   # lower risk wins
        },
        'execution': {
            'a': f"Score {exec_a}/10",
            'b': f"Score {exec_b}/10",
            'winner': 'A' if exec_a >= exec_b else 'B',
        },
        'investor_appeal': {
            'a': f"Index {inv_a}",
            'b': f"Index {inv_b}",
            'winner': 'A' if inv_a >= inv_b else 'B',
        },
    }

    # ── Determine overall winner ────────────────────────────────────────────
    wins_a = sum(1 for c in scorecard.values() if c['winner'] == 'A')
    wins_b = sum(1 for c in scorecard.values() if c['winner'] == 'B')

    if wins_a > wins_b:
        winner = 'A'
    elif wins_b > wins_a:
        winner = 'B'
    else:
        # Tie-breaker: larger TAM wins
        winner = 'A' if tam_a >= tam_b else 'B'

    w_idea = req.idea_a if winner == 'A' else req.idea_b
    l_idea = req.idea_b if winner == 'A' else req.idea_a
    w_mkt  = a if winner == 'A' else b
    l_mkt  = b if winner == 'A' else a

    # ── Gemini verdict (2 sentences) ───────────────────────────────────────
    verdict_prompt = (
        f'You are a brutal startup investment analyst. '
        f'In exactly 2 sentences explain why "{w_idea}" beats "{l_idea}".\n'
        f'Winner — TAM: {w_mkt.get("forecast_tam","?")}, '
        f'Growth: {w_mkt.get("growth","?")}, Risk: {w_mkt.get("risk_score","?")}\n'
        f'Loser  — TAM: {l_mkt.get("forecast_tam","?")}, '
        f'Growth: {l_mkt.get("growth","?")}, Risk: {l_mkt.get("risk_score","?")}\n'
        f'Be specific, reference actual numbers, no fluff. Exactly 2 sentences.'
    )
    try:
        verdict = await asyncio.to_thread(call_gemini_fast, verdict_prompt)
        if not verdict or len(verdict.strip()) < 20:
            raise ValueError("empty verdict")
    except Exception:
        verdict = (
            f'"{w_idea}" wins on stronger market fundamentals — '
            f'larger TAM and better growth trajectory make it the clear investment priority.'
        )

    # Strip escaped quotes Gemini sometimes returns
    clean_verdict = verdict.strip().replace('\\"', '"').replace("\\'", "'")
    # Strip JSON wrapper if Gemini returns {"explanation": "..."} or {"verdict": "..."}
    import json as _json
    try:
        parsed = _json.loads(clean_verdict)
        if isinstance(parsed, dict):
            clean_verdict = next((v for v in parsed.values() if isinstance(v, str)), clean_verdict)
    except Exception:
        pass

    return {
        "winner":    winner,
        "verdict":   clean_verdict,
        "scorecard": scorecard,
        "wins_a":    wins_a,
        "wins_b":    wins_b,
    }


# =============================================================================
# LIVE RESEARCH ENGINE ENDPOINT
# =============================================================================
# NOTE: The /analyze endpoint is now defined in llm_engine.py
# We'll mount it here to make it accessible

from app.services.llm_engine import app as llm_app, call_gemini_fast

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
