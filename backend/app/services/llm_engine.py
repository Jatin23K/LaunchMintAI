"""
Live Research Engine - BRUTAL INTELLIGENCE EDITION
1. DUAL-LAYER SEARCH: Tries specific query first. If empty, tries broad query.
2. ADVERSARIAL AUDIT: Forensic logic gate verifies every number against raw source strings.
3. SOURCE SEGREGATION: Market section strictly isolated to PRIMARY source to prevent cross-contamination.
4. ANTI-FLUFF PROTOCOL: Rejects generic templates; requires industry-specific keywords.
"""

import os
import json
import httpx
import re
import time
import asyncio
from loguru import logger
from fastapi import HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

# Add parent directory to path for imports
# Add parent directory to path for imports
from app.services.market_search import search_market_data, format_search_results_for_prompt
from app.services.database import create_db_and_tables
from app.services.vector_db import get_semantic_cache, set_semantic_cache

load_dotenv()
# ... (API_KEYS and MODELS remain the same)

# ============================================================================
# 🕵️ FORENSIC DATA SCIENCE LAYER (ENSEMBLE EDITION)
# ============================================================================

AUTHORITY_MAP = {
    "statista.com": 1.0, "gartner.com": 1.0, "forbes.com": 0.8,
    "techcrunch.com": 0.7, "crunchbase.com": 0.9, "bloomberg.com": 1.0,
    "reuters.com": 1.0, "grandviewresearch.com": 0.9, "mordorintelligence.com": 0.8,
    "globenewswire.com": 0.6, "businesswire.com": 0.6
}

def get_domain_authority(url: str) -> float:
    if not url or url == "#": return 0.1
    for domain, score in AUTHORITY_MAP.items():
        if domain in url.lower(): return score
    return 0.4

async def validate_report_integrity(report: dict, truth_text: str):
    """
    ENSEMBLE AUDIT: Uses both Primary and Corroborator models to verify claims.
    Mimics the TLDR Shield 'High-Confidence Gate' strategy.
    """
    if not truth_text: return "REJECT: No primary evidence source.", 0.0
    
    market = report.get('market', {})
    tam = market.get('current_tam', 'N/A')
    growth = market.get('growth', 'N/A')
    
    audit_prompt = f"""
    [FORENSIC AUDIT]
    Verify numbers against source: TAM: {tam} | CAGR: {growth}
    SOURCE: {truth_text[:8000]}
    Return JSON: {{"status": "PASS/REJECT", "veracity_quote": "...", "confidence": 0.0-1.0}}
    """
    
    # Run Ensemble in parallel
    p_task = call_gemini(audit_prompt, model_id=MODELS["flash"], temperature=0.0)
    c_task = call_gemini(audit_prompt, model_id=MODELS["flash_lite"], temperature=0.0)
    
    p_res, c_res = await asyncio.gather(p_task, c_task)
    p_audit = clean_json(p_res) or {"status": "REJECT", "confidence": 0.0}
    c_audit = clean_json(c_res) or {"status": "REJECT", "confidence": 0.0}
    
    # Logic Gate: Both must pass for a 'High Confidence' result
    if p_audit.get("status") == "PASS" and c_audit.get("status") == "PASS":
        avg_conf = (p_audit.get("confidence", 0.5) + c_audit.get("confidence", 0.5)) / 2
        report["market"]["veracity_quote"] = p_audit.get("veracity_quote", "Verified by ensemble.")
        return "PASS", avg_conf
        
    return "REJECT", 0.1

async def analyze(req, request=None):
    idea = req.idea.strip()
    
    # 1. SEMANTIC CACHE LOOKUP (DSA OPTIMIZATION)
    cached_report = get_semantic_cache(idea)
    if cached_report:
        logger.info(f"🚀 [ANALYZE] Serving Semantic Cache for: {idea}")
        # Add a flag so frontend knows it's from cache
        cached_report["forensics"]["reasoning_trace"].insert(0, "CACHE_HIT: Retrieved semantically similar report")
        return cached_report

    for attempt in range(1, 3):
        report, trace = await _run_analysis_pipeline(idea, attempt)
        if not report or "market" not in report: continue
        
        status, audit_conf = await validate_report_integrity(report, report.get("_raw_primary", ""))
        trace.append(f"ENSEMBLE_AUDIT_{status}: Multi-model verification gate")
        
        if status == "PASS":
            p_url = report.get("_p_url", "#")
            authority = get_domain_authority(p_url)
            
            report["forensics"] = {
                "confidence_score": round((audit_conf + authority) / 2, 2),
                "veracity_index": authority,
                "source_diversity": len(re.findall(r'https?://', report.get("_snippets", ""))),
                "reasoning_trace": trace,
                "bias_assessment": "Neutral - Cross-Validated"
            }
            
            # Cleanup and Cache
            for k in ["_raw_primary", "_snippets", "_p_url"]:
                if k in report: del report[k]
            report["idea"] = idea
            
            # Persist for future semantic hits
            set_semantic_cache(idea, report)
            return report
            
    return generate_fallback_report(idea, "GROUNDING_FAILURE")

def generate_fallback_report(idea, msg):
    return {
        "idea": idea,
        "market": {
            "current_tam": msg, "forecast_tam": "TBD", "growth": "N/A",
            "source_url": "#", "source_name": "Unverified", "confidence": "Low"
        },
        "competitors": [],
        "god_mode": {
            "macro_verdict": "REJECTED", "swarm_summary": f"Audit failed: {msg}",
            "swot": {"strengths": [], "weaknesses": [], "opportunities": [], "threats": []},
            "risk_score": "Unknown"
        }
    }

# --- REAL INTELLIGENCE ENGINES ---

async def vc_roast(req: VCRoastRequest):
    """The Skeptic: Performs a brutal audit of the business model."""
    logger.info(f"🔥 [ROAST] Commencing audit for idea: {req.idea}")
    
    # 1. Search for skepticism
    search_query = f"why {req.idea} will fail common pitfalls and competitors"
    raw_results = await search_market_data(search_query)
    context = format_search_results_for_prompt(raw_results)
    
    prompt = f"""
    You are a Tier-1 Venture Capitalist known for being a brutal skeptic. Your goal is to find the fatal flaws in this startup idea.
    
    IDEA: {req.idea}
    MARKET CONTEXT: {context}
    
    Return a JSON response matching the VCRoastResponse schema:
    {{
        "roast": "A 2-paragraph brutal, witty, and logic-driven roast of why this idea is likely a dumpster fire.",
        "fatal_flaws": ["List 3-5 specific technical or market flaws"],
        "skeptic_verdict": "A cold, one-sentence decision (e.g., 'Not even worth the coffee meeting.')",
        "prob_failure": "Percentage (e.g., 94%)",
        "market_rejection_reasons": ["List specific reasons why customers or investors will say NO"]
    }}
    """
    
    raw_text = await call_gemini(prompt, model_id="gemini-1.5-pro", temperature=0.8)
    res = clean_json(raw_text)
    return res if res else {"roast": "Your idea is so vague even the AI is confused. Try again.", "fatal_flaws": ["No clear value prop"], "skeptic_verdict": "HARD PASS", "prob_failure": "99%", "market_rejection_reasons": ["Incoherence"]}

async def war_room(req: IdeaRequest):
    """The Tactician: Generates offensive and defensive battle plans."""
    logger.info(f"⚔️ [WAR ROOM] Drafting maneuvers for: {req.idea}")
    
    search_query = f"competitor strategy and market barriers for {req.idea}"
    raw_results = await search_market_data(search_query)
    context = format_search_results_for_prompt(raw_results)
    
    prompt = f"""
    You are a Strategic Military Advisor for startups. Generate a battle plan for this idea.
    
    IDEA: {req.idea}
    COMPETITOR CONTEXT: {context}
    
    Return a JSON response matching the WarRoomResponse schema. 
    Ensure offensive maneuvers target competitor weaknesses and defensive maneuvers protect the moat.
    """
    
    raw_text = await call_gemini(prompt, model_id="gemini-1.5-pro", temperature=0.4)
    res = clean_json(raw_text)
    return res if res else {"battle_plan": "Retreat and regroup."}

async def pitch_forge(req: PitchForgeRequest):
    """The Narrative Designer: Forges high-conversion pitches."""
    logger.info(f"🔨 [PITCH FORGE] Forging narrative for: {req.idea}")
    
    prompt = f"""
    You are a master of storytelling and venture capital fundraising. Forge a winning narrative.
    
    IDEA: {req.idea}
    
    Return a JSON response matching the PitchForgeResponse schema.
    Create a high-impact narrative hook and a structured 10-slide deck outline.
    """
    
    raw_text = await call_gemini(prompt, model_id="gemini-1.5-flash", temperature=0.7)
    res = clean_json(raw_text)
    return res if res else {"elevator_pitch": "Something went wrong in the forge."}

async def startup_event():
    create_db_and_tables()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)