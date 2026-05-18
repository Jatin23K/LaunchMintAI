"""
Market Data Search Module — Serper (Google) + Exa (Semantic) dual-engine.
Tier 0: Exa semantic search → finds Statista/Gartner/GrandView market reports.
Tier 1: Serper Google search → news, competitor data, industry analysis.
Fallback: Gemini training knowledge with Medium confidence.
"""

import os
import random
import asyncio
import httpx
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

# ── EXA KEY VAULT ─────────────────────────────────────────────────────────────
_raw_exa = [
    os.getenv("EXA_API_KEY"),
    os.getenv("EXA_API_KEY_1"),
    os.getenv("EXA_API_KEY_2"),
    os.getenv("EXA_API_KEY_3"),
    os.getenv("EXA_API_KEY_4"),
    os.getenv("EXA_API_KEY_5"),
    os.getenv("EXA_API_KEY_6"),
]
EXA_KEYS = list(dict.fromkeys(k for k in _raw_exa if k))

def _next_exa_key() -> str | None:
    if not EXA_KEYS:
        return None
    return random.choice(EXA_KEYS)

# ── SERPER KEY VAULT ──────────────────────────────────────────────────────────
_raw_serper = [
    os.getenv("SERPER_API_KEY"),
    os.getenv("SERPER_API_KEY_1"),
    os.getenv("SERPER_API_KEY_2"),
    os.getenv("SERPER_API_KEY_3"),
    os.getenv("SERPER_API_KEY_4"),
    os.getenv("SERPER_API_KEY_5"),
    os.getenv("SERPER_API_KEY_6"),
]
SERPER_KEYS = list(dict.fromkeys(k for k in _raw_serper if k))

def _next_serper_key() -> str | None:
    if not SERPER_KEYS:
        return None
    return random.choice(SERPER_KEYS)

# ── SOURCE QUALITY FILTERS ────────────────────────────────────────────────────
TIER_0_DOMAINS = [
    "grandviewresearch.com", "statista.com", "fortunebusinessinsights.com",
    "gartner.com", "mordorintelligence.com", "precedenceresearch.com",
    "marketsandmarkets.com", "alliedmarketresearch.com", "imarc.com",
    "businessresearchinsights.com", "transparencymarketresearch.com",
]

TIER_1_DOMAINS = [
    "mckinsey.com", "bcg.com", "bain.com", "deloitte.com", "pwc.com",
    "forrester.com", "bloomberg.com", "techcrunch.com",
    "reuters.com", "pitchbook.com", "cbinsights.com",
]

GARBAGE_DOMAINS = [
    "linkedin.com", "quora.com", "glassdoor.com", "zoominfo.com",
    "reddit.com", "pinterest.com", "facebook.com", "twitter.com", "x.com",
]

BLACKLISTED_TITLE_TERMS = [
    "company profile", "competitors", "funding", "stock price",
    "how to", "best ", "tips", "review",
]

OLD_YEARS = {"2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"}
FRESH_YEARS = {"2024", "2025", "2026", "2030"}


def _is_valid(url: str, title: str) -> bool:
    tl = title.lower()
    if any(t in tl for t in BLACKLISTED_TITLE_TERMS):
        return False
    if any(d in url for d in GARBAGE_DOMAINS):
        return False
    return True


def _is_outdated(title: str, snippet: str) -> bool:
    combined = (title + " " + snippet).lower()
    for y in OLD_YEARS:
        if y in combined and not any(ny in combined for ny in FRESH_YEARS):
            return True
    return False


def _score(url: str) -> int:
    ul = url.lower()
    if any(d in ul for d in TIER_0_DOMAINS):
        return 100
    if any(d in ul for d in TIER_1_DOMAINS):
        return 50
    return 0


def _build_output(results: List[Dict], tier_label: str, idea: str) -> Dict:
    fresh = [
        r for r in results
        if _is_valid(r.get("url", ""), r.get("title", ""))
        and not _is_outdated(r.get("title", ""), r.get("snippet", r.get("content", "")))
    ]
    fresh.sort(key=lambda r: _score(r.get("url", "")), reverse=True)

    if not fresh:
        return _no_data(idea)

    parts = []
    for i, r in enumerate(fresh[:5], 1):
        parts.append(
            f"[SOURCE {i}]\n"
            f"Title: {r.get('title', 'N/A')}\n"
            f"URL: {r.get('url', 'N/A')}\n"
            f"Content: {r.get('snippet', r.get('content', 'N/A'))}\n---"
        )

    top = fresh[0]
    return {
        "raw_context": "\n\n".join(parts),
        "source_objects": fresh,
        "top_source_url": top.get("url", ""),
        "top_source_name": f"{top.get('title', 'Market Source')} ({tier_label})",
        "results_count": len(fresh),
        "industry": idea,
    }


def _no_data(idea: str) -> Dict:
    return {
        "raw_context": "No verified market data found.",
        "top_source_url": "",
        "top_source_name": "Data Unavailable",
        "results_count": 0,
        "industry": idea,
    }


# ── EXA SEARCH (Tier 0 — semantic, finds market research reports) ─────────────
async def _exa_search(query: str, num_results: int = 8) -> List[Dict]:
    key = _next_exa_key()
    if not key:
        return []
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                "https://api.exa.ai/search",
                headers={"x-api-key": key, "Content-Type": "application/json"},
                json={
                    "query": query,
                    "numResults": num_results,
                    "contents": {"text": {"maxCharacters": 800}},
                    "includeDomains": TIER_0_DOMAINS,
                },
            )
            resp.raise_for_status()
            raw = resp.json().get("results", [])
            # Normalise Exa field names → common schema
            return [
                {
                    "title": r.get("title", ""),
                    "url": r.get("url", ""),
                    "snippet": (r.get("text") or r.get("summary") or "")[:800],
                }
                for r in raw
            ]
    except Exception as e:
        logger.error(f"[EXA] Error: {e}")
        return []


# ── SERPER SEARCH (Tier 1 — Google results, fast) ────────────────────────────
async def _serper_search(query: str, num_results: int = 10) -> List[Dict]:
    key = _next_serper_key()
    if not key:
        return []
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://google.serper.dev/search",
                headers={"X-API-KEY": key, "Content-Type": "application/json"},
                json={"q": query, "num": num_results},
            )
            resp.raise_for_status()
            data = resp.json()
            # Merge organic + news results
            items = data.get("organic", []) + data.get("news", [])
            return [
                {
                    "title": r.get("title", ""),
                    "url": r.get("link", ""),
                    "snippet": r.get("snippet", ""),
                }
                for r in items
            ]
    except Exception as e:
        logger.error(f"[SERPER] Error: {e}")
        return []


# ── PUBLIC API ────────────────────────────────────────────────────────────────
async def search_market_data(idea: str, query: str) -> Dict:
    """
    3-stage waterfall:
      Stage 1 — Exa semantic search restricted to Tier 0 market-report domains.
      Stage 2 — Serper Google search on Tier 1 consulting/finance domains.
      Stage 3 — Serper open web search (garbage-domain filtered).
    """
    if not EXA_KEYS and not SERPER_KEYS:
        logger.warning("[SEARCH] No Exa or Serper keys configured.")
        return _no_data(idea)

    # Stage 1: Exa → market research reports
    logger.info(f"[EXA] Semantic market report search for '{idea}'")
    exa_results = await _exa_search(f"{query} market size revenue forecast 2025 2030")
    if exa_results:
        out = _build_output(exa_results, "Exa Semantic (Tier 0)", idea)
        if out["results_count"] > 0:
            logger.info(f"[EXA] Hit — {out['results_count']} sources")
            return out

    # Stage 2: Serper → consulting/finance/news
    logger.info(f"[SERPER] Google search (Tier 1) for '{idea}'")
    serper_t1 = await _serper_search(
        f"{query} market size industry analysis 2025 site:mckinsey.com OR site:statista.com OR site:gartner.com OR site:techcrunch.com"
    )
    if serper_t1:
        out = _build_output(serper_t1, "Serper Google (Tier 1)", idea)
        if out["results_count"] > 0:
            logger.info(f"[SERPER T1] Hit — {out['results_count']} sources")
            return out

    # Stage 3: Serper open web (filtered)
    logger.info(f"[SERPER] Open web search for '{idea}'")
    serper_open = await _serper_search(f"{query} market report global 2025 revenue forecast")
    if serper_open:
        # Strip garbage domains
        serper_open = [r for r in serper_open if not any(d in r["url"] for d in GARBAGE_DOMAINS)]
        out = _build_output(serper_open, "Serper Open Web", idea)
        if out["results_count"] > 0:
            logger.info(f"[SERPER OPEN] Hit — {out['results_count']} sources")
            return out

    logger.warning(f"[SEARCH] All stages exhausted for '{idea}'")
    return _no_data(idea)


# ── kept for backward-compat (llm_engine.py imports these) ───────────────────
def is_valid_market_source(url: str, title: str) -> bool:
    return _is_valid(url, title)

def is_outdated_source(title: str, snippet: str) -> bool:
    return _is_outdated(title, snippet)

def get_tavily_client():
    """Stub — Tavily replaced by Serper + Exa. Returns None gracefully."""
    return None


def format_search_results_for_prompt(search_data: Dict) -> str:
    if search_data["results_count"] == 0 or "unavailable" in search_data["top_source_name"].lower():
        return """
===== REAL-TIME MARKET DATA =====
STATUS: Web search returned no verified sources for this query.
INSTRUCTION: Use your training knowledge to provide estimates for this market.
Label confidence as "Medium" and note figures are from AI knowledge, not live data.
"""
    return f"""
===== REAL-TIME MARKET DATA (VERIFIED WEB SEARCH RESULTS) =====
{search_data['raw_context']}

VERIFIED SOURCE FOR CITATION:
- URL: {search_data['top_source_url']}
- Source Name: {search_data['top_source_name']}

===== CRITICAL EXTRACTION RULES =====
1. ISOLATION: Extract numbers from the sources above. If a specific figure isn't stated, estimate based on your training knowledge and label confidence as "Medium".
2. SUB-MARKET MATCH: Use figures for the EXACT sub-market (e.g., "Employee Onboarding Software"), NOT the parent industry (e.g., "HR Tech" or "HCM"). If only parent-industry numbers exist, scale down proportionally.
3. SANITY CHECK: TAM for a niche SaaS sub-market is typically $0.5B-$10B, not $50B+. If your number exceeds $20B, verify it's the right sub-market.
"""
