"""
DS Pipeline Orchestrator — Phase 4
Runs all 3 DS modules and returns unified JSON.
Each module fails independently — partial results always return.
"""

import time
import sys
import os
from typing import Dict

# Path fix for direct imports
sys.path.insert(0, os.path.dirname(__file__))

from classifier import predict as classify, extract_sector
from monte_carlo import simulate
from sentiment  import analyze_competitors


def run(idea: str, market_data: dict = None, competitors: list = None) -> Dict:
    """
    Orchestrates all 3 DS modules.

    Args:
        idea         : Raw startup idea string
        market_data  : Optional dict from /analyze (market size, growth, etc.)
        competitors  : Optional list of competitor name strings

    Returns:
        Unified DS insights dict
    """
    if market_data is None:
        market_data = {}
    if competitors is None:
        competitors = []

    start = time.time()
    results = {}

    # ── Module 1: Classifier ───────────────────────────────────────────
    try:
        survival = classify(idea, market_data)
        results["survival"] = survival
    except Exception as e:
        results["survival"] = {"error": str(e)}

    # ── Module 2: Monte Carlo ──────────────────────────────────────────
    try:
        import hashlib
        # Deterministic seed per idea
        seed = int(hashlib.sha256(idea.encode()).hexdigest(), 16) % (2**32)
        
        sector  = results.get("survival", {}).get("features_used", {}).get("sector_encoded", 9)
        financials = simulate(sector=sector, seed=seed)
        results["financials"] = financials
    except Exception as e:
        results["financials"] = {"error": str(e)}

    # ── Module 3: Sentiment ────────────────────────────────────────────
    try:
        sector = results.get("survival", {}).get("features_used", {}).get("sector_encoded", 9)
        if not competitors:
            competitors = ["Industry Leader", "Global Incumbent", "Challenger"]
        sentiment = analyze_competitors(competitors, sector=sector)
        results["sentiment"] = {"competitors": sentiment}
    except Exception as e:
        results["sentiment"] = {"error": str(e)}

    # ── Meta ───────────────────────────────────────────────────────────
    elapsed_ms = int((time.time() - start) * 1000)
    results["meta"] = {
        "idea":              idea,
        "model_version":     "xgb_v1",
        "pipeline_latency_ms": elapsed_ms,
        "modules_run":       ["classifier", "monte_carlo", "sentiment"],
    }

    return results
