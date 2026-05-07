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

# 3. REGISTER CORE ENDPOINTS
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

# 4. DYNAMIC EXTENSION ROUTER
@app.post("/extension/{ext_id}")
async def run_extension(ext_id: str, req: Request):
    """
    Dynamic Router: Loads any extension from the app/extensions folder.
    Usage: POST /extension/market_research { "payload": { ... } }
    """
    try:
        import importlib
        payload = await req.json()
        
        # Security check: Prevent path traversal
        if ".." in ext_id or "/" in ext_id:
             raise HTTPException(status_code=400, detail="Invalid extension ID")
             
        module_path = f"app.extensions.{ext_id}.extension"
        module = importlib.import_module(module_path)
        
        if hasattr(module, "execute"):
            # Run in a thread to prevent blocking if the extension isn't fully async
            result = await asyncio.to_thread(module.execute, payload)
            return result
        else:
            raise HTTPException(status_code=404, detail=f"Extension '{ext_id}' has no execute() method")
            
    except ImportError:
        raise HTTPException(status_code=404, detail=f"Extension '{ext_id}' not found")
    except Exception as e:
        logger.error(f"Extension Error [{ext_id}]: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def health():
    return {"status": "LaunchMint AI Platinum Online", "gateways": ["analyze", "war_room", "vc_roast", "pitch_forge"]}

# Register Startup
app.add_event_handler("startup", startup_event)

if __name__ == "__main__":
    import uvicorn
    logger.info("🌟 Launching High-Availability Backend...")
    uvicorn.run(app, host="0.0.0.0", port=8000)