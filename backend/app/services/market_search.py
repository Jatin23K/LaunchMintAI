"""
Market Data Search Module using Tavily API
Provides real-time, grounded market intelligence with Elite Source Tiering.
"""

import os
try:
    from tavily import TavilyClient
except ImportError:
    TavilyClient = None
from typing import Dict, List, Optional
import logging

# Initialize logger
logger = logging.getLogger(__name__)

# --- TAVILY KEY VAULT (Multi-Key Rotation) ---
raw_tavily_keys = [
    os.getenv("TAVILY_API_KEY"),
    os.getenv("TAVILY_API_KEY_1"),
    os.getenv("TAVILY_API_KEY_2"),
    os.getenv("TAVILY_API_KEY_3"),
    os.getenv("TAVILY_API_KEY_4"),
    os.getenv("TAVILY_API_KEY_5"),
    os.getenv("TAVILY_API_KEY_6")
]
TAVILY_KEYS = list(set([k for k in raw_tavily_keys if k]))
tav_key_index = 0

def get_next_tavily_key():
    global tav_key_index
    if not TAVILY_KEYS: return None
    key = TAVILY_KEYS[tav_key_index % len(TAVILY_KEYS)]
    tav_key_index += 1
    return key

def get_tavily_client():
    if TavilyClient is None:
        return None
    key = get_next_tavily_key()
    if not key: return None
    return TavilyClient(api_key=key)

# TIER 0: The "Elite Researchers" (TAM/CAGR Authority)
# These are prioritized above all else because they always provide exact digits.
TIER_0_DOMAINS = [
    "grandviewresearch.com", "statista.com", "fortunebusinessinsights.com", 
    "gartner.com", "mordorintelligence.com", "precedenceresearch.com"
]

# TIER 1: The "Strategic Authority" (Consulting & Finance)
TIER_1_DOMAINS = [
    "mckinsey.com", "bcg.com", "bain.com", "deloitte.com", "pwc.com", 
    "forrester.com", "bloomberg.com", "techcrunch.com", 
    "reuters.com", "pitchbook.com", "cbinsights.com",
    "alliedmarketresearch.com", "marketsandmarkets.com"
]

# TIER 3: The "Garbage List" (Explicit Exclusions for Open Web)
GARBAGE_DOMAINS = [
    "linkedin.com", "quora.com", "glassdoor.com", "zoominfo.com",
    "owlery.com", "reddit.com", "pinterest.com", "facebook.com", "crunchbase.com"
]

def is_valid_market_source(url, title):
    """
    DIRECTORY BLACKLIST:
    Reject company profiles which are often mistaken for market reports.
    """
    blacklisted_terms = ["company profile", "overview", "competitors", "financials", "funding", "stock price", "tips", "how to", "best dog breeds"]
    
    if "advisor" in url.lower() or "tips" in url.lower():
        if "market size" not in title.lower() and "revenue" not in title.lower():
            return False

    if any(term in title.lower() for term in blacklisted_terms):
        return False
        
    return True

def is_outdated_source(title, snippet):
    """
    FRESHNESS GUARD:
    Strictly reject pre-2023 data unless 2024+ is mentioned.
    """
    combined = (str(title) + " " + str(snippet)).lower()
    old_years = ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"]
    for y in old_years:
        if y in combined:
            if any(ny in combined for ny in ["2024", "2025", "2026", "2030"]):
                continue
            return True
    return False

async def search_market_data(idea: str, query: str) -> Dict:
    """
    Executes a prioritized 3-stage waterfall search asynchronously.
    """
    import asyncio
    client = get_tavily_client()
    if not client:
        return {"raw_context": "No Tavily API Key found.", "top_source_url": "", "top_source_name": "Config Error", "results_count": 0, "industry": idea}
    
    # STAGE 1: TIER 0 (ELITE RESEARCHERS)
    logger.info(f"🌊 [ELITE SEARCH] Querying Tier 0 researchers for '{idea}'...")
    try:
        res_tier0 = await asyncio.to_thread(client.search,
            query=f"{query} market size report 2025",
            include_domains=TIER_0_DOMAINS,
            search_depth="advanced",
            max_results=5
        )
        results = res_tier0.get('results', [])
        if results:
            return process_results(results, "Elite Research (Tier 0)", idea)
    except Exception as e: logger.error(f"Tier 0 Error: {e}")

    # STAGE 2: TIER 1 (CONSULTING/FINANCE)
    logger.info(f"🌊 [STRATEGIC SEARCH] Querying Tier 1 strategic firms...")
    try:
        res_tier1 = await asyncio.to_thread(client.search,
            query=f"{query} industry analysis 2025",
            include_domains=TIER_1_DOMAINS,
            search_depth="advanced",
            max_results=5
        )
        results = res_tier1.get('results', [])
        if results:
            return process_results(results, "Strategic Authority (Tier 1)", idea)
    except Exception as e: logger.error(f"Tier 1 Error: {e}")

    # STAGE 3: OPEN WEB (FILTERED)
    logger.info("🌊 [OPEN SEARCH] Tier 1 silent. Scanning Open Web...")
    try:
        res_open = await asyncio.to_thread(client.search,
            query=f"{query} market report global 2025",
            exclude_domains=GARBAGE_DOMAINS,
            search_depth="advanced",
            max_results=10
        )
        if res_open.get('results'):
            return process_results(res_open['results'], "General Web (Filtered)", idea)
    except Exception as e: logger.error(f"Open Search Error: {e}")

    return {
        "raw_context": "No verified market data found.",
        "top_source_url": "",
        "top_source_name": "Data Unavailable",
        "results_count": 0,
        "industry": idea
    }

def process_results(results: List[Dict], source_tier: str, subject: str) -> Dict:
    """Helper to format results from any tier"""
    context_parts = []
    
    # Filter for Freshness First AND Valid Source Type
    fresh_results = [
        r for r in results 
        if not is_outdated_source(r.get('title', ''), r.get('content', '')) 
        and is_valid_market_source(r.get('url', ''), r.get('title', ''))
    ]
    
    # Score and Sort Tier 0 results to the very top if they exist
    def get_score(r):
        url = r.get('url', '').lower()
        if any(d in url for d in TIER_0_DOMAINS): return 100
        if any(d in url for d in TIER_1_DOMAINS): return 50
        return 0
    
    fresh_results.sort(key=get_score, reverse=True)

    for i, result in enumerate(fresh_results[:5], 1):
        context_parts.append(
            f"[SOURCE {i}]\n"
            f"Title: {result.get('title', 'N/A')}\n"
            f"URL: {result.get('url', 'N/A')}\n"
            f"Content: {result.get('content', 'N/A')}\n"
            f"---"
        )
    
    raw_context = "\n\n".join(context_parts)
    
    if not fresh_results:
        return {
            "raw_context": "All found sources were filtered/outdated. Data unavailable.",
            "top_source_url": "",
            "top_source_name": "Data Unavailable",
            "results_count": 0,
            "industry": subject
        }

    top_source = fresh_results[0]
    
    return {
        "raw_context": raw_context,
        "source_objects": fresh_results,
        "top_source_url": top_source.get('url', ''),
        "top_source_name": f"{top_source.get('title', 'Market Source')} ({source_tier})",
        "results_count": len(results),
        "industry": subject
    }

def format_search_results_for_prompt(search_data: Dict) -> str:
    """
    Format search results for injection into LLM prompt
    """
    if search_data['results_count'] == 0 or "unavailable" in search_data['top_source_name'].lower():
        return """
===== REAL-TIME MARKET DATA =====
STATUS: No verified data found
STRICT INSTRUCTION: 
You MUST respond with "Data verification pending" for the market fields.
DO NOT GUESS.
"""
    
    return f"""
===== REAL-TIME MARKET DATA (VERIFIED WEB SEARCH RESULTS) =====
{search_data['raw_context']}

VERIFIED SOURCE FOR CITATION:
- URL: {search_data['top_source_url']}
- Source Name: {search_data['top_source_name']}

===== CRITICAL EXTRACTION RULES =====
1. ISOLATION: Use only numbers from the top source.
2. NO HALLUCINATION: If the text doesn't explicitly state the value, say "Data Unavailable".
3. NO GUESSING: Do not use your internal knowledge.
"""
