"""
Market Data Search Module using Tavily API
Provides real-time, grounded market intelligence to prevent LLM hallucinations
"""

import os
from tavily import TavilyClient
from typing import Dict, List, Optional
import logging

# Initialize logger
logger = logging.getLogger(__name__)

# Initialize Tavily client
tavily_client = None

def init_tavily():
    """Initialize Tavily client with API key from environment"""
    global tavily_client
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        logger.warning("TAVILY_API_KEY not found in environment variables")
        return False
    
    try:
        tavily_client = TavilyClient(api_key=api_key)
        logger.info("Tavily client initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize Tavily client: {e}")
        return False

# TIER 1: The "God Mode" Whitelist
# We search these FIRST. If we find data here, we stop and return it.
TIER_1_DOMAINS = [
    "mckinsey.com", "bcg.com", "bain.com", "deloitte.com", "pwc.com", 
    "gartner.com", "forrester.com", "bloomberg.com", "techcrunch.com", 
    "statista.com", "reuters.com", "pitchbook.com", "cbinsights.com",
    "grandviewresearch.com", "fortunebusinessinsights.com", "alliedmarketresearch.com"
]

# TIER 3: The "Garbage List" (Explicit Exclusions)
GARBAGE_DOMAINS = [
    "marketsandmarkets.com", "linkedin.com", 
    "quora.com", "glassdoor.com", "zoominfo.com",
    "crunchbase.com", "owlery.com", "reddit.com"
]

def is_valid_market_source(url, title):
    """
    DIRECTORY BLACKLIST:
    Reject company profiles which are often mistaken for market reports.
    """
    blacklisted_terms = ["company profile", "overview", "competitors", "financials", "funding", "stock price", "tips", "how to", "best dog breeds"]
    blacklisted_domains = ["crunchbase.com", "linkedin.com", "zoominfo.com", "cbinsights.com", "pitchbook.com", "owlery.com", "forbes.com/advisor"]
    
    # 🛡️ THE "ADVISOR" TRAP:
    # Reject "Advisor" or "Tips" sites if they don't explicitly mention "Market Size" in title
    if "advisor" in url.lower() or "tips" in url.lower():
        if "market size" not in title.lower() and "revenue" not in title.lower():
            return False

    # Check if it's just a company profile page
    if any(term in title.lower() for term in blacklisted_terms):
        return False
        
    if any(domain in url.lower() for domain in blacklisted_domains):
        # Exception: Allow specific "Research Reports" from these if URL suggests it
        if "report" in url.lower() or "research" in url.lower():
             return True
        return False
        
    return True

def is_outdated_source(title, snippet):
    """
    FRESHNESS GUARD:
    Reject any result that explicitly mentions an old year (2015-2022) in the title or snippet.
    We want 2023, 2024, 2025, or timeless/undated content only.
    """
    combined = (str(title) + " " + str(snippet)).lower()
    
    # Reject explicit old years
    old_years = ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"]
    for y in old_years:
        if y in combined:
            # Exception: If it ALSO mentions a new year (e.g. "Growth from 2020 to 2030")
            if "2024" in combined or "2025" in combined or "2030" in combined:
                continue
            return True
            
    return False

def search_market_data(idea: str, industry: Optional[str] = None) -> Dict:
    """
    Executes a prioritized search.
    1. Try to find a report from a Top Tier source.
    2. If that fails, search the open web but block known spam sites.
    """
    if tavily_client is None:
        if not init_tavily():
            return {
                "raw_context": "",
                "top_source_url": "",
                "top_source_name": "Search Unavailable",
                "results_count": 0,
                "industry": industry or idea
            }
            
    # Lead with formal industry term if available for massive accuracy boost
    search_subject = industry if industry else idea
    
    # --- STAGE 1: The "God Mode" Search ---
    logger.info(f"🌊 [WATERFALL STAGE 1] Searching Tier 1 Authority for '{search_subject}'...")
    try:
        response_tier1 = tavily_client.search(
            query=f"{search_subject} market size report 2025",
            include_domains=TIER_1_DOMAINS,
            search_depth="advanced",
            max_results=5
        )
        
        # If we got valid results, RETURN THEM IMMEDIATELY.
        tier1_results = response_tier1.get('results', [])
        if tier1_results:
            logger.info("✅ SUCCESS: Found Tier 1 Data.")
            return process_results(tier1_results, source_tier="Premium Authority", subject=search_subject)
            
    except Exception as e:
        logger.error(f"⚠️ Tier 1 Search Error: {e}")

    # --- STAGE 2: The "Safety Net" Fallback ---
    # We only get here if Tier 1 returned NOTHING.
    logger.info(f"🌊 [WATERFALL STAGE 2] Tier 1 silent. Switching to Open Web (excluding garbage)...")
    
    try:
        response_fallback = tavily_client.search(
            query=f"{search_subject} market size statistics 2025",
            exclude_domains=GARBAGE_DOMAINS, # Crucial: Block the SEO farms
            search_depth="advanced",
            max_results=5
        )
        
        fallback_results = response_fallback.get('results', [])
        if fallback_results:
            logger.info("✅ SUCCESS: Found General Web Data.")
            return process_results(fallback_results, source_tier="General Web (Filtered)", subject=search_subject)
            
    except Exception as e:
        logger.error(f"❌ Fallback Search Error: {e}")

    # Last Resort: Return empty/null to handle gracefully in UI
    logger.warning(f"❌ [SEARCH FAILED] No results in Waterfall for: {search_subject}")
    return {
        "raw_context": f"No verified market data found for '{search_subject}'.",
        "top_source_url": "",
        "top_source_name": "Data Unavailable",
        "results_count": 0,
        "industry": search_subject
    }

def process_results(results: List[Dict], source_tier: str, subject: str) -> Dict:
    """Helper to format results from either tier"""
    context_parts = []
    
    # Filter for Freshness First AND Valid Source Type
    fresh_results = [
        r for r in results 
        if not is_outdated_source(r.get('title', ''), r.get('content', '')) 
        and is_valid_market_source(r.get('url', ''), r.get('title', ''))
    ]
    
    # Analyze top 5 fresh results
    for i, result in enumerate(fresh_results[:5], 1):
        context_parts.append(
            f"[SOURCE {i}]\n"
            f"Title: {result.get('title', 'N/A')}\n"
            f"URL: {result.get('url', 'N/A')}\n"
            f"Content: {result.get('content', 'N/A')}\n"
            f"---"
        )
    
    raw_context = "\n\n".join(context_parts)
    raw_context = "\n\n".join(context_parts)
    
    # Handle case where all results were outdated
    if not fresh_results:
        return {
            "raw_context": "All found sources were outdated (pre-2023). Data unavailable.",
            "top_source_url": "",
            "top_source_name": "Data Unavailable",
            "results_count": 0,
            "industry": subject
        }

    top_source = fresh_results[0]
    
    return {
        "raw_context": raw_context,
        "source_objects": fresh_results,  # EXPOSED FOR AI AUDITOR
        "top_source_url": top_source.get('url', ''),
        "top_source_name": f"{top_source.get('title', 'Market Source')} ({source_tier})",
        "results_count": len(results),
        "industry": subject
    }

def format_search_results_for_prompt(search_data: Dict) -> str:
    """
    Format search results for injection into LLM prompt
    """
    if search_data['results_count'] == 0:
        return """
===== REAL-TIME MARKET DATA =====
STATUS: No verified data found
STRICT INSTRUCTION: 
You MUST respond with "Market size: Data unavailable" for the market.size field.
DO NOT GUESS. DO NOT ESTIMATE. DO NOT USE YOUR TRAINING DATA.
"""
    
    return f"""
===== REAL-TIME MARKET DATA (VERIFIED WEB SEARCH RESULTS) =====
{search_data['raw_context']}

VERIFIED SOURCE FOR CITATION:
- URL: {search_data['top_source_url']}
- Source Name: {search_data['top_source_name']}

===== CRITICAL EXTRACTION RULES (AMBITION FILTER) =====
YOU ARE EXTRACTING DATA FOR A VC PITCH DECK. THE "2 TAM" COMPARISON IS THE CORE OF THE PITCH.

GROWTH STORY MANDATE:
- We MUST show a trajectory (e.g., "$10B Today → $50B Tomorrow").
- SCAN ALL SOURCES for both a "base" number (2024/2025) and a "forecast" number (2030/2032).
- Almost all market reports provide both. Look for "Market was $X in 2024..." as well as "...is expected to reach $Y by 2030."

STEP-BY-STEP EXTRACTION:
1. Identify `current_tam`: Use value for 2024 or 2025.
2. Identify `forecast_tam`: Use value for 2030, 2031, or 2032.
3. EXTRACT BOTH: DUAL EXTRACTION IS MANDATORY IF THE DATA EXISTS.
6. PREFERENCE RULE:
   - If you see multiple numbers (e.g. "Platform Revenue $60B" vs "Total Market $325B"), ALWAYS CHOOSE THE TOTAL MARKET SIZE ($325B).
   - "Total Addressable Market" (TAM) > "Serviceable Obtainable Market" (SOM).

7. 🛡️ CITATION VALIDATOR (ANTI-HALLUCINATION):
   - You must identify the EXACT SENTENCE in the text that contains the number. 
   - If the text discusses the topic (e.g. "AI Legal Assistant") but does NOT contain a specific dollar figure, return "Data unavailable" or "Market Emerging".
   - DO NOT ESTIMATE. DO NOT GUESS. DO NOT GENERATE A NUMBER from "General Knowledge".
   - If a source is qualitative (e.g. "2025 Predictions" with no tables), SKIP IT.
   - Better to show "Market Emerging" than a fake number.

SCENARIOS:
✅ SCENARIO A (Ideal): "Market $5B in 2025, CAGR 20%, $15B by 2030"
   -> Extract BOTH.
✅ SCENARIO B (Only forecast mentioned): "Projected to $10B by 2030"
   -> Look at OTHER sources for a 2024/2025 number. If found, use IT.
✅ SCENARIO C (Multiple forecasts): "2027: $8B, 2030: $12B"
   -> Base = 2025 (extrapolate/search), Forecast = 2030.
✅ SCENARIO D (Ambiguous Variance): "Revenue $60B" vs "Market $325B"
   -> Use $325B. Label it "Broader Market".
✅ SCENARIO E (Qualitative Only): "Sector will grow significantly..." (No #)
   -> RETURN: "Data unavailable" (triggers Fallback).

PROHIBITIONS:
❌ DO NOT use the same value for both fields.
❌ DO NOT use your training data. ONLY the verified sources above.
❌ DO NOT invent a number for "Deloitte" if Deloitte didn't say it.
"""

