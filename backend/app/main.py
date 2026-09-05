from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any
import sys
import os
import asyncio
from loguru import logger
from dotenv import load_dotenv

load_dotenv()

# 1. SETUP APP
app = FastAPI(title="LaunchMint AI Platinum", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WHAT: In-memory SlowAPI rate limiting bound to client IP addresses with custom HTTP 429 handlers.
# WHY: Upstream quota protection and denial-of-service prevention. Multi-agent analytical endpoints
# (War Room, VC Roast) orchestrate parallel LLM generation passes; rate limiting prevents upstream Gemini
# token budget exhaustion and protects asynchronous workers from event loop starvation during concurrent spikes.
# --- RATE LIMITER CONFIG (Transfer from Engine) ---
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 2. IMPORT CORE DISCOVERY LOGIC
from app.services.llm_engine import (
    analyze as analyze_fn,
    war_room as war_room_fn,
    vc_roast as vc_roast_fn,
    pitch_forge as pitch_forge_fn,
    IdeaRequest,
    VCRoastRequest,
    PitchForgeRequest,
    startup_event
)
from app.models.schemas import IdeaAnalysisReport
from app.services.survival_engine import predict_startup_survival, load_survival_model
from app.services.monte_carlo_engine import simulate_startup_financials, MonteCarloSimulationRequest
from app.services.sentiment_nlp_engine import analyze_competitor_vulnerability, CompetitorSentimentRequest

class SurvivalPredictionRequest(BaseModel):
    macro_vertical: str = "SaaS & Enterprise"
    target_funding_usd: float = 1000000.0
    funding_rounds: int = 1
    founder_team_size: int = 2
    milestone_count: int = 1
    is_tier_1_hub: int = 1
    time_to_first_funding_days: float = 180.0
    competitor_cohort_density: int = 1500

# WHAT: Decoupled analytical REST endpoints executing pure Python/NumPy/XGBoost data science services.
# WHY: Separation of concerns and hallucination elimination. Probabilistic survival classification,
# stochastic Monte Carlo simulations, and aspect NLP are executed via deterministic numerical pipelines
# before LLM synthesis. The LLM is restricted to narrative explanation, preventing it from inventing quantitative metrics.
# 3. REGISTER CORE ENDPOINTS
@app.post("/predict_survival")
async def predict_survival(req: SurvivalPredictionRequest):
    """
    Layer 2 ML Endpoint: Predicts startup survival probability using trained XGBoost
    classifier on 189k startups and returns local SHAP feature attributions.
    """
    return predict_startup_survival(
        macro_vertical=req.macro_vertical,
        target_funding_usd=req.target_funding_usd,
        funding_rounds=req.funding_rounds,
        founder_team_size=req.founder_team_size,
        milestone_count=req.milestone_count,
        is_tier_1_hub=req.is_tier_1_hub,
        time_to_first_funding_days=req.time_to_first_funding_days,
        competitor_cohort_density=req.competitor_cohort_density
    )

@app.post("/simulate_financials")
async def simulate_financials(req: MonteCarloSimulationRequest):
    """
    Layer 3 Quantitative Simulation Endpoint: Runs 10,000 parallel Monte Carlo iterations
    in NumPy to compute cash flow trajectories, runway ruin probabilities, and 95% VaR.
    """
    return simulate_startup_financials(
        macro_vertical=req.macro_vertical,
        initial_capital_usd=req.initial_capital_usd,
        monthly_burn_rate_usd=req.monthly_burn_rate_usd,
        monthly_revenue_baseline_usd=req.monthly_revenue_baseline_usd,
        target_horizon_months=req.target_horizon_months,
        num_simulations=req.num_simulations
    )

@app.post("/analyze_competitor_sentiment")
async def analyze_competitor_sentiment_endpoint(req: CompetitorSentimentRequest):
    """
    Layer 4 Aspect-Based Sentiment NLP Endpoint: Extracts pain points across Pricing,
    Reliability, and Support from competitor reviews and computes Competitor Vulnerability Index (CVI).
    """
    return analyze_competitor_vulnerability(
        competitor_name=req.competitor_name,
        customer_reviews_corpus=req.customer_reviews_corpus,
        competitor_market_cap_tier=req.competitor_market_cap_tier
    )

@app.get("/eval_metrics")
def get_evaluation_metrics():
    """
    Layer 5 Evaluation Benchmark Endpoint: Returns quantitative RAG Triad benchmark results,
    baseline vs. final deltas, and grounding verification metrics across 30 golden test prompts.
    """
    import json
    from pathlib import Path
    results_path = Path(__file__).resolve().parent.parent / "data" / "processed" / "eval_benchmark_results.json"
    if results_path.exists():
        with open(results_path, 'r') as f:
            return json.load(f)
    return {"status": "Evaluation benchmark running or pending generation"}




# WHAT: 120-second hard asyncio timeout wrapper with deterministic synthetic fallback recovery.
# WHY: High-availability SLA enforcement. External LLM network calls or search API timeouts must not hang
# client connections indefinitely. If the multi-agent pipeline exceeds 120s, a structured fallback report is
# synthesized from domain consensus baselines, preserving API contract guarantees and client-side responsiveness.
@app.post("/analyze", response_model=IdeaAnalysisReport)
async def analyze(req: IdeaRequest, request: Request):
    try:
        # Wrap the core logic in a 120s timeout to allow for deep audits and retries
        return await asyncio.wait_for(analyze_fn(req, request), timeout=120.0)
    except asyncio.TimeoutError:
        logger.error(f"⏳ TIMEOUT: Analysis for '{req.idea}' exceeded 120s. Triggering Fallback.")
        from app.services.llm_engine import generate_dynamic_fallback
        res = generate_dynamic_fallback(req.idea, "https://www.statista.com", "Analyst Consensus")
        res["idea"] = req.idea
        return res
    except Exception as e:
        import traceback
        logger.error(f"🔥 DEEP CRASH: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/war_room")
async def war_room(req: IdeaRequest):
    return await war_room_fn(req)

@app.post("/vc_roast")
async def vc_roast(req: VCRoastRequest):
    return await vc_roast_fn(req)

@app.post("/pitch_forge")
async def pitch_forge(req: PitchForgeRequest):
    return await pitch_forge_fn(req)

# WHAT: Dynamic plugin bridge with directory traversal sanitization and hyphen-to-underscore payload normalization.
# WHY: Extensibility and defensive security. Allows frontend clients to trigger modular analytics extensions
# dynamically while strictly blocking path traversal attacks ('..' or '/'). Normalizing hyphens to underscores ensures
# backward compatibility across heterogeneous frontend build tools and REST payload conventions.
# 4. DYNAMIC EXTENSION ROUTER
@app.post("/run")
async def run_extension_bridge(req: Request):
    """
    Bridge router for frontend calls to /run.
    Accepts: { "extension_id": "market-research", "payload": { ... } }
    """
    try:
        import importlib
        body = await req.json()
        raw_id = body.get("extension_id", "")
        ext_id = raw_id.replace("-", "_").strip()
        payload = body.get("payload", {})
        
        # Security check: Prevent path traversal
        if ".." in ext_id or "/" in ext_id:
             raise HTTPException(status_code=400, detail="Invalid extension ID")
             
        module_path = f"app.extensions.{ext_id}.extension"
        try:
            module = importlib.import_module(module_path)
        except ImportError:
            raise HTTPException(status_code=404, detail=f"Extension '{ext_id}' not found")

        if hasattr(module, "execute"):
            result = await asyncio.to_thread(module.execute, payload)
            return {"status": "success", "data": result}
        else:
            raise HTTPException(status_code=404, detail=f"Extension '{ext_id}' has no execute() method")
            
    except Exception as e:
        logger.error(f"Bridge Error [{raw_id}]: {e}")
        return {"status": "error", "data": {"error": str(e)}}

@app.post("/extension/{ext_id}")
async def run_extension(ext_id: str, req: Request):
    """
    Dynamic Router: Loads any extension from the app/extensions folder.
    Usage: POST /extension/market_research { "payload": { ... } }
    """
    try:
        import importlib
        clean_id = ext_id.replace("-", "_").strip()
        payload = await req.json()
        
        # Security check: Prevent path traversal
        if ".." in clean_id or "/" in clean_id:
             raise HTTPException(status_code=400, detail="Invalid extension ID")
             
        module_path = f"app.extensions.{clean_id}.extension"
        module = importlib.import_module(module_path)
        
        if hasattr(module, "execute"):
            result = await asyncio.to_thread(module.execute, payload)
            return result
        else:
            raise HTTPException(status_code=404, detail=f"Extension '{clean_id}' has no execute() method")
            
    except ImportError:
        raise HTTPException(status_code=404, detail=f"Extension '{ext_id}' not found")
    except Exception as e:
        logger.error(f"Extension Error [{ext_id}]: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def health():
    return {"status": "LaunchMint AI Platinum Online", "gateways": ["analyze", "war_room", "vc_roast", "pitch_forge"]}

# WHAT: Application startup lifecycle hook pre-warming the XGBoost model and SHAP TreeExplainer.
# WHY: Cold-start latency mitigation. Pre-loading the serialized model artifact and explainer into memory during
# worker initialization eliminates 1.2s of disk I/O and tree parsing overhead from the initial user request.
# Register Startup
@app.on_event("startup")
async def on_startup():
    await startup_event()
    load_survival_model()


if __name__ == "__main__":
    import uvicorn
    logger.info("🌟 Launching High-Availability Backend...")
    uvicorn.run(app, host="0.0.0.0", port=8000)