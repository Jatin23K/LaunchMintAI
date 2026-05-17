"""
Evidence Model — Credibility layer for Validator reports.

Deterministic claim extraction from search text, provenance tracking,
and credibility scoring. Sits between search and LLM synthesis so
the report knows *why* it believes each number.

Status vocabulary (used everywhere):
  verified   — exact regex extraction from a source
  estimated  — derived from verified inputs (e.g. CAGR math)
  inferred   — LLM synthesis from evidence, not direct fact extraction
  unsupported — no adequate evidence available
"""

import re
import time
from typing import Dict, List, Optional

# ── Source tier classification ─────────────────────────────────────────────────
_TIER1 = {
    "statista.com", "gartner.com", "mckinsey.com", "grandviewresearch.com",
    "mordorintelligence.com", "marketsandmarkets.com", "precedenceresearch.com",
    "fortunebusinessinsights.com", "alliedmarketresearch.com", "ibisworld.com",
    "bloomberg.com", "reuters.com", "wsj.com", "ft.com",
    "crunchbase.com", "pitchbook.com", "cbinsights.com",
}
_TIER2 = {
    "businesswire.com", "prnewswire.com", "globenewswire.com", "businessinsider.com",
    "forbes.com", "entrepreneur.com", "venturebeat.com", "techcrunch.com",
    "marketwatch.com", "seekingalpha.com",
}

def _domain_tier(url: str) -> str:
    try:
        from urllib.parse import urlparse
        d = urlparse(url).netloc.lower().replace("www.", "")
        if any(t in d for t in _TIER1):
            return "tier1"
        if any(t in d for t in _TIER2):
            return "tier2"
        return "tier3"
    except Exception:
        return "tier3"

def _tier_confidence(tier: str) -> float:
    return {"tier1": 0.90, "tier2": 0.75, "tier3": 0.60}.get(tier, 0.60)


# ── Regex patterns ─────────────────────────────────────────────────────────────
_SIZE_RE = re.compile(
    r'(?:'
    r'valued?\s+at|market\s+(?:size\s+)?(?:of|was|is|worth|reached?|estimated?\s+at?)|'
    r'reach(?:ing|es|ed)?\s+(?:a\s+value\s+of\s+)?|'
    r'projected?\s+(?:to\s+)?(?:reach\s+)?|expected?\s+(?:to\s+)?(?:reach\s+)?|'
    r'USD\s*)?'
    r'[\$£€]?\s*(\d{1,6}(?:\.\d{1,3})?)\s*'
    r'(trillion|billion|million|tn|bn|mn|T|B|M)\b',
    re.IGNORECASE,
)

_CAGR_RE = re.compile(
    r'(\d+(?:\.\d{1,2})?)\s*%\s*(?:CAGR|compound\s+annual\s+growth(?:\s+rate)?)|'
    r'(?:CAGR|compound\s+annual\s+growth(?:\s+rate)?)\s+of\s+(\d+(?:\.\d{1,2})?)\s*%',
    re.IGNORECASE,
)

_YEAR_RE = re.compile(r'\b(20[2-4]\d)\b')

_FORECAST_LEAD_RE = re.compile(
    r'\b(?:by|reach(?:ing|es|ed)?|forecast(?:ed)?\s+(?:to\s+be\s+)?(?:at\s+)?|projected?\s+(?:to\s+)?(?:reach\s+)?|expected?\s+(?:to\s+)?(?:reach\s+)?)\s*(20[2-4]\d)\b',
    re.IGNORECASE,
)


def _to_billions(val: float, unit: str) -> float:
    u = unit.lower()
    if u in ("trillion", "tn", "t"):
        return val * 1000
    if u in ("million", "mn", "m"):
        return val / 1000
    return val


def _nearest_year_to(text: str, anchor: int) -> tuple:
    """Return (year_int, distance) of the year token nearest to anchor position."""
    best_year, best_dist = None, float("inf")
    for m in _YEAR_RE.finditer(text):
        dist = abs(m.start() - anchor)
        if dist < best_dist:
            best_dist = dist
            best_year = int(m.group(1))
    return best_year, best_dist


def _is_forecast_context(window: str, year: int) -> bool:
    """True only if the year is the direct target of a forecast/forward-looking marker."""
    for m in _FORECAST_LEAD_RE.finditer(window):
        if int(m.group(1)) == year:
            return True
    return False


# ── Core extraction ────────────────────────────────────────────────────────────

def extract_market_claims(source_objects: list) -> List[dict]:
    """
    Deterministically parse market size and CAGR claims from search results.
    Returns a list of EvidenceClaim dicts.
    No LLM call — pure regex over provided text.
    """
    claims: List[dict] = []
    cid = 0

    for src in source_objects[:6]:
        text = ((src.get("content") or src.get("snippet") or "") + " " + (src.get("title") or "")).strip()
        if not text:
            continue
        url = src.get("url", "")
        title = src.get("title", "")
        tier = _domain_tier(url)
        conf = _tier_confidence(tier)

        # Market size
        for m in _SIZE_RE.finditer(text):
            try:
                raw_v = float(m.group(1))
                unit = m.group(2)
                val_b = _to_billions(raw_v, unit)
                if not (0.005 < val_b < 10000):
                    continue

                s = max(0, m.start() - 250)
                e = min(len(text), m.end() + 250)
                window = text[s:e]
                # Use year nearest to the match position, not just first in window
                anchor_in_window = m.start(1) - s
                year, _ = _nearest_year_to(window, anchor_in_window)
                is_fc = _is_forecast_context(window, year) if year else False

                cid += 1
                claims.append({
                    "claim_id": f"size_{cid}",
                    "claim_type": "forecast_tam" if is_fc else "current_tam",
                    "raw_text": m.group(0),
                    "normalized_value": round(val_b, 2),
                    "unit": "USD_B",
                    "year": year,
                    "quote": window[:300],
                    "source_url": url,
                    "source_title": title,
                    "domain_tier": tier,
                    "status": "verified",
                    "confidence": conf,
                    "extraction_method": "regex",
                })
            except (ValueError, TypeError):
                continue

        # CAGR
        for m in _CAGR_RE.finditer(text):
            try:
                raw_v = m.group(1) or m.group(2)
                val = float(raw_v)
                if not (0.5 < val < 100):
                    continue

                s = max(0, m.start() - 200)
                window = text[s : m.end() + 200]
                cid += 1
                claims.append({
                    "claim_id": f"cagr_{cid}",
                    "claim_type": "cagr",
                    "raw_text": m.group(0),
                    "normalized_value": round(val, 2),
                    "unit": "PCT",
                    "year": None,
                    "quote": window[:300],
                    "source_url": url,
                    "source_title": title,
                    "domain_tier": tier,
                    "status": "verified",
                    "confidence": conf,
                    "extraction_method": "regex",
                })
            except (ValueError, TypeError):
                continue

    return claims


def build_fact_table(claims: List[dict]) -> Dict[str, dict]:
    """Pick the highest-confidence claim per type."""
    best: Dict[str, dict] = {}
    for c in claims:
        t = c["claim_type"]
        if t not in best or c["confidence"] > best[t]["confidence"]:
            best[t] = c
    return best


def format_fact_table_for_prompt(fact_table: Dict[str, dict]) -> str:
    """Compact string injected into LLM synthesis prompt."""
    if not fact_table:
        return "No verified market figures extracted from search sources."
    lines = ["VERIFIED FACTS FROM SEARCH SOURCES (prefer these numbers):"]
    for ct, c in fact_table.items():
        src = (c.get("source_title") or "")[:60]
        if ct == "current_tam":
            lines.append(f"  • Current market size: ${c['normalized_value']}B  (source: {src})")
        elif ct == "forecast_tam":
            yr = c.get("year", "future")
            lines.append(f"  • Forecast market size ({yr}): ${c['normalized_value']}B  (source: {src})")
        elif ct == "cagr":
            lines.append(f"  • CAGR: {c['normalized_value']}%  (source: {src})")
    return "\n".join(lines)


# ── Provenance builder ─────────────────────────────────────────────────────────

def _prov(status: str, source_url: str = "", source_quote: str = "",
          source_year: Optional[int] = None, notes: str = "") -> dict:
    return {
        "status": status,
        "source_url": source_url,
        "source_quote": source_quote[:200] if source_quote else "",
        "source_year": source_year,
        "notes": notes,
    }


def _is_placeholder(val) -> bool:
    if not val:
        return True
    s = str(val).strip().lower()
    bad = {"", "not_found", "n/a", "unavailable", "unknown"}
    if s in bad:
        return True
    # generic hardcoded fallbacks that were inserted server-side
    if s.startswith("~$") and ("est." in s or "(est)" in s):
        return True
    return False


def build_provenance(market: dict, claims: List[dict],
                     competitor_names: List[str], giant_kb_names: List[str]) -> dict:
    """
    Map final report fields to provenance records.
    Returns field_provenance dict keyed by dotted field path.
    """
    fact = build_fact_table(claims)
    prov: dict = {}

    # market.current_tam
    tam = market.get("current_tam", "")
    if fact.get("current_tam") and not _is_placeholder(tam):
        c = fact["current_tam"]
        prov["market.current_tam"] = _prov("verified", c["source_url"], c["quote"], c.get("year"))
    elif _is_placeholder(tam):
        prov["market.current_tam"] = _prov("unsupported", notes="No source evidence; field left empty")
    else:
        prov["market.current_tam"] = _prov("inferred", notes="From LLM training knowledge — not source-backed")

    # market.forecast_tam
    ftam = market.get("forecast_tam", "")
    if fact.get("forecast_tam") and not _is_placeholder(ftam):
        c = fact["forecast_tam"]
        prov["market.forecast_tam"] = _prov("verified", c["source_url"], c["quote"], c.get("year"))
    elif fact.get("current_tam") and market.get("growth") and not _is_placeholder(ftam):
        prov["market.forecast_tam"] = _prov("estimated", notes="Derived: current TAM × CAGR × years")
    elif _is_placeholder(ftam):
        prov["market.forecast_tam"] = _prov("unsupported", notes="No source evidence; field left empty")
    else:
        prov["market.forecast_tam"] = _prov("inferred", notes="From LLM training knowledge")

    # market.growth (CAGR)
    if fact.get("cagr") and not _is_placeholder(market.get("growth", "")):
        c = fact["cagr"]
        prov["market.growth"] = _prov("verified", c["source_url"], c["quote"])
    else:
        prov["market.growth"] = _prov("inferred", notes="Estimated from LLM training knowledge")

    # competitors
    giant_lower = {n.lower() for n in giant_kb_names}
    for name in competitor_names:
        if name.lower() in giant_lower:
            prov[f"competitor.{name}"] = _prov(
                "verified",
                notes="Curated knowledge base (verified Jan 2025); pricing/funding may be stale",
            )
        else:
            prov[f"competitor.{name}"] = _prov(
                "inferred",
                notes="Web search snippets + LLM synthesis — treat as directional",
            )

    # narrative sections
    for dept in ("dept_legal", "dept_product", "dept_marketing", "dept_finance", "god_mode"):
        prov[dept] = _prov("inferred", notes="LLM strategy synthesis — not factual extraction")

    return prov


# ── Credibility meta ───────────────────────────────────────────────────────────

def build_credibility_meta(field_provenance: dict, claims: List[dict]) -> dict:
    buckets: Dict[str, list] = {
        "verified": [], "estimated": [], "inferred": [], "unsupported": []
    }
    for field, p in field_provenance.items():
        s = p.get("status", "unsupported")
        if s in buckets:
            buckets[s].append(field)

    total = sum(len(v) for v in buckets.values())
    grounded = len(buckets["verified"]) + len(buckets["estimated"])
    score = round(grounded / total, 2) if total > 0 else 0.0

    return {
        "verified_fields": buckets["verified"],
        "estimated_fields": buckets["estimated"],
        "inferred_fields": buckets["inferred"],
        "unsupported_fields": buckets["unsupported"],
        "grounded_fields": buckets["verified"] + buckets["estimated"],
        "conflicts_detected": _detect_conflicts(claims),
        "stale_sources": [],
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "overall_score": score,
        "claims_extracted": len(claims),
    }


def determine_report_status(credibility: dict) -> str:
    score = credibility.get("overall_score", 0)
    unsupported = len(credibility.get("unsupported_fields", []))
    if score >= 0.6:
        return "complete"
    if score >= 0.3:
        return "partial_grounded"
    if unsupported == 0 and score > 0:
        return "partial_grounded"
    return "partial_inferred"


def _detect_conflicts(claims: List[dict]) -> List[str]:
    by_type: Dict[str, list] = {}
    for c in claims:
        by_type.setdefault(c["claim_type"], []).append(c)

    conflicts = []
    for ct, cs in by_type.items():
        if len(cs) < 2:
            continue
        vals = [c["normalized_value"] for c in cs]
        lo, hi = min(vals), max(vals)
        if hi > lo * 2.5:
            if ct in ("current_tam", "forecast_tam"):
                conflicts.append(f"{ct}: sources disagree — ${lo:.1f}B vs ${hi:.1f}B")
            else:
                conflicts.append(f"{ct}: sources disagree — {lo:.1f}% vs {hi:.1f}%")
    return conflicts
