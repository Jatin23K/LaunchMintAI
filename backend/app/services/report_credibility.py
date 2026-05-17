import math
import re
import time
from datetime import UTC, datetime
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse


STATUS_VERIFIED = "verified"
STATUS_ESTIMATED = "estimated"
STATUS_INFERRED = "inferred"
STATUS_UNSUPPORTED = "unsupported"

CURRENT_TAM = "current_tam"
FORECAST_TAM = "forecast_tam"
GROWTH = "growth"
GENERIC_COMPETITOR_NAMES = {"industry leader", "global incumbent", "challenger", "global player", "innovation rival"}


def _extract_domain(url: str) -> str:
    try:
        return urlparse(url).netloc.lower().replace("www.", "")
    except Exception:
        return ""


def _detect_source_tier(domain: str) -> str:
    if any(d in domain for d in ("statista.com", "gartner.com", "grandviewresearch.com", "mckinsey.com", "bcg.com")):
        return "high"
    if any(d in domain for d in ("reuters.com", "bloomberg.com", "techcrunch.com", "cbinsights.com")):
        return "medium"
    return "standard"


def build_evidence_sources(raw_sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    now = datetime.now(UTC).isoformat().replace("+00:00", "Z")
    sources = []
    for src in raw_sources or []:
        url = src.get("url", "")
        title = src.get("title", "Market Source")
        domain = _extract_domain(url)
        published_at = _extract_year(src.get("snippet", "") or src.get("content", "") or title)
        sources.append(
            {
                "url": url,
                "title": title,
                "domain": domain,
                "published_at": str(published_at) if published_at else None,
                "source_tier": _detect_source_tier(domain),
                "retrieved_at": now,
            }
        )
    return sources


def is_generic_competitor_name(name: str) -> bool:
    return (name or "").strip().lower() in GENERIC_COMPETITOR_NAMES


def sanitize_competitor_candidates(names: List[str], source_objects: List[Dict[str, Any]]) -> Tuple[List[str], bool]:
    cleaned: List[str] = []
    seen = set()
    low_confidence = False
    for name in names or []:
        candidate = re.sub(r"[^A-Za-z0-9&\-\.\s]", "", str(name)).strip()
        if not candidate:
            continue
        lowered = candidate.lower()
        if lowered in seen:
            continue
        if is_generic_competitor_name(candidate):
            low_confidence = True
            continue
        if len(candidate) < 3:
            continue
        cleaned.append(candidate)
        seen.add(lowered)

    if cleaned:
        return cleaned[:3], low_confidence

    derived = []
    for src in source_objects or []:
        url = src.get("url", "")
        domain = _extract_domain(url)
        if not domain:
            continue
        root = domain.split(".")[0].replace("-", " ").strip()
        if not root or root.lower() in seen or root.lower() in {"statista", "gartner", "mckinsey", "bcg", "reuters", "bloomberg"}:
            continue
        label = " ".join(part.capitalize() for part in root.split())
        if is_generic_competitor_name(label):
            continue
        derived.append(label)
        seen.add(root.lower())
        if len(derived) >= 3:
            break
    return derived[:3], True


def _extract_year(text: str) -> Optional[int]:
    years = [int(y) for y in re.findall(r"\b(20\d{2})\b", text or "")]
    return years[0] if years else None


def _normalize_money(raw_num: str, unit: str) -> Optional[str]:
    try:
        num = float(raw_num.replace(",", ""))
    except ValueError:
        return None
    unit = (unit or "").lower()
    if unit.startswith("t") or "trillion" in unit:
        num *= 1000
    elif unit.startswith("m") or "million" in unit:
        num /= 1000
    return f"${num:.2f}B"


def _money_claims(text: str) -> List[Tuple[str, str, str]]:
    pattern = re.compile(
        r"(?:USD|US\$|\$)\s?(\d[\d,]*\.?\d*)\s*(trillion|billion|million|T|B|M)\b",
        re.IGNORECASE,
    )
    return [(m.group(0), m.group(1), m.group(2)) for m in pattern.finditer(text or "")]


def _growth_claims(text: str) -> List[Tuple[str, str]]:
    patterns = [
        re.compile(r"(\d[\d,]*\.?\d*)\s*%\s*(?:CAGR|annual growth rate|growth)", re.IGNORECASE),
        re.compile(r"(?:CAGR|annual growth rate|growth)\s*(?:of)?\s*(\d[\d,]*\.?\d*)\s*%", re.IGNORECASE),
    ]
    matches: List[Tuple[str, str]] = []
    seen = set()
    for pattern in patterns:
        for m in pattern.finditer(text or ""):
            pair = (m.group(0), m.group(1))
            if pair not in seen:
                matches.append(pair)
                seen.add(pair)
    return matches


def extract_market_claims(raw_sources: List[Dict[str, Any]], scope: str) -> List[Dict[str, Any]]:
    claims: List[Dict[str, Any]] = []
    for idx, src in enumerate(raw_sources or []):
        text = src.get("snippet") or src.get("content") or ""
        years = [int(y) for y in re.findall(r"\b(20\d{2})\b", text)]
        money_matches = _money_claims(text)
        growth_matches = _growth_claims(text)

        for i, (raw_text, raw_num, unit) in enumerate(money_matches):
            claim_type = CURRENT_TAM if i == 0 else FORECAST_TAM if i == 1 else "market_value"
            year = years[i] if i < len(years) else None
            claims.append(
                {
                    "claim_id": f"market-{idx}-{i}-{claim_type}",
                    "claim_type": claim_type,
                    "raw_text": raw_text,
                    "normalized_value": _normalize_money(raw_num, unit),
                    "unit": "B",
                    "year": str(year) if year else None,
                    "quote": text,
                    "source_url": src.get("url", ""),
                    "source_title": src.get("title", "Market Source"),
                    "source_tier": _detect_source_tier(_extract_domain(src.get("url", ""))),
                    "status": STATUS_VERIFIED,
                    "confidence": "high" if scope and scope.lower() in text.lower() else "medium",
                    "extraction_method": "regex",
                }
            )

        for i, (raw_text, raw_num) in enumerate(growth_matches):
            claims.append(
                {
                    "claim_id": f"market-{idx}-{i}-growth",
                    "claim_type": GROWTH,
                    "raw_text": raw_text,
                    "normalized_value": f"{float(raw_num):.1f}%",
                    "unit": "%",
                    "year": str(years[-1]) if years else None,
                    "quote": text,
                    "source_url": src.get("url", ""),
                    "source_title": src.get("title", "Market Source"),
                    "source_tier": _detect_source_tier(_extract_domain(src.get("url", ""))),
                    "status": STATUS_VERIFIED,
                    "confidence": "high",
                    "extraction_method": "regex",
                }
            )
    return claims


def derive_current_tam_from_forecast(forecast_tam: str, growth: str, current_year: str, forecast_year: str) -> Optional[str]:
    try:
        forecast_b = float(re.sub(r"[^\d.]", "", forecast_tam or ""))
        growth_pct = float(re.sub(r"[^\d.]", "", growth or ""))
        current = int(current_year)
        forecast = int(forecast_year)
    except (TypeError, ValueError):
        return None
    delta = forecast - current
    if delta <= 0:
        return None
    base = forecast_b / ((1 + (growth_pct / 100.0)) ** delta)
    return f"${base:.2f}B"


def _select_best_claim(claims: List[Dict[str, Any]], claim_type: str) -> Optional[Dict[str, Any]]:
    eligible = [c for c in claims if c.get("claim_type") == claim_type and c.get("normalized_value")]
    if not eligible:
        return None
    eligible.sort(
        key=lambda c: (
            0 if c.get("source_tier") == "high" else 1 if c.get("source_tier") == "medium" else 2,
            0 if c.get("confidence") == "high" else 1,
            -(int(c.get("year")) if str(c.get("year", "")).isdigit() else 0),
        )
    )
    return eligible[0]


def build_market_fact_table(claims: List[Dict[str, Any]]) -> Tuple[Dict[str, Dict[str, str]], List[str]]:
    fact_table: Dict[str, Dict[str, str]] = {}
    conflicts: List[str] = []

    best_current = _select_best_claim(claims, CURRENT_TAM)
    best_forecast = _select_best_claim(claims, FORECAST_TAM)
    best_growth = _select_best_claim(claims, GROWTH)

    for claim_type, best in ((CURRENT_TAM, best_current), (FORECAST_TAM, best_forecast), (GROWTH, best_growth)):
        if best:
            fact_table[claim_type] = {
                "value": best["normalized_value"],
                "status": STATUS_VERIFIED,
                "source_url": best["source_url"],
                "source_title": best["source_title"],
                "source_quote": best["quote"],
                "source_year": best.get("year"),
            }
        else:
            fact_table[claim_type] = {"value": "NOT_FOUND", "status": STATUS_UNSUPPORTED}

    current_vals = {c["normalized_value"] for c in claims if c.get("claim_type") == CURRENT_TAM and c.get("normalized_value")}
    forecast_vals = {c["normalized_value"] for c in claims if c.get("claim_type") == FORECAST_TAM and c.get("normalized_value")}
    growth_vals = {c["normalized_value"] for c in claims if c.get("claim_type") == GROWTH and c.get("normalized_value")}
    if len(current_vals) > 1:
        conflicts.append("market.current_tam")
    if len(forecast_vals) > 1:
        conflicts.append("market.forecast_tam")
    if len(growth_vals) > 1:
        conflicts.append("market.growth")

    if fact_table[CURRENT_TAM]["status"] == STATUS_UNSUPPORTED and best_forecast and best_growth:
        derived = derive_current_tam_from_forecast(
            best_forecast["normalized_value"],
            best_growth["normalized_value"],
            best_growth.get("year") or "2025",
            best_forecast.get("year") or "2030",
        )
        if derived:
            fact_table[CURRENT_TAM] = {
                "value": derived,
                "status": STATUS_ESTIMATED,
                "source_url": best_forecast["source_url"],
                "source_title": best_forecast["source_title"],
                "source_quote": best_forecast["quote"],
                "source_year": best_forecast.get("year"),
                "notes": "Derived from forecast TAM and CAGR",
            }

    return fact_table, conflicts


def verify_market_report_fields(report: Dict[str, Any], fact_table: Dict[str, Any]) -> Dict[str, Any]:
    market = dict(report.get("market", {}))
    verified_market = fact_table.get("market", fact_table)
    for field in (CURRENT_TAM, FORECAST_TAM, GROWTH):
        fact = verified_market.get(field, {})
        if fact.get("status") in (STATUS_VERIFIED, STATUS_ESTIMATED):
            market[field] = fact.get("value")
        else:
            market[field] = "NOT_FOUND"
    report["market"] = market
    return report


def build_field_provenance(fact_table: Dict[str, Dict[str, str]], competitor_provenance: Optional[Dict[str, Any]] = None) -> Dict[str, Dict[str, Any]]:
    provenance: Dict[str, Dict[str, Any]] = {}
    for field, fact in fact_table.items():
        path = f"market.{field}"
        provenance[path] = {
            "field_path": path,
            "status": fact.get("status", STATUS_UNSUPPORTED),
            "source_url": fact.get("source_url", ""),
            "source_title": fact.get("source_title", ""),
            "source_quote": fact.get("source_quote", ""),
            "source_year": fact.get("source_year"),
            "notes": fact.get("notes", ""),
        }
    for key, value in (competitor_provenance or {}).items():
        provenance[key] = value
    return provenance


def compute_report_credibility(field_provenance: Dict[str, Dict[str, Any]], conflict_fields: Optional[List[str]] = None, stale_sources: int = 0) -> Dict[str, Any]:
    counts = {
        "grounded_fields": 0,
        "estimated_fields": 0,
        "inferred_fields": 0,
        "unsupported_fields": 0,
    }
    for item in field_provenance.values():
        status = item.get("status")
        if status == STATUS_VERIFIED:
            counts["grounded_fields"] += 1
        elif status == STATUS_ESTIMATED:
            counts["estimated_fields"] += 1
        elif status == STATUS_INFERRED:
            counts["inferred_fields"] += 1
        else:
            counts["unsupported_fields"] += 1
    counts["conflicts_detected"] = conflict_fields or []
    counts["stale_sources"] = stale_sources
    counts["generated_at"] = datetime.now(UTC).isoformat().replace("+00:00", "Z")
    return counts


def build_citations_from_provenance(field_provenance: Dict[str, Dict[str, Any]]) -> List[Dict[str, str]]:
    citations = []
    seen = set()
    for item in field_provenance.values():
        if item.get("status") not in (STATUS_VERIFIED, STATUS_ESTIMATED):
            continue
        url = item.get("source_url", "")
        title = item.get("source_title", "") or "Market Source"
        if not url or url in seen:
            continue
        citations.append({"title": title, "url": url})
        seen.add(url)
    return citations


def count_stale_sources(sources: List[Dict[str, Any]], stale_before_year: int = 2024) -> int:
    total = 0
    for src in sources:
        try:
            year = int(src.get("published_at"))
        except (TypeError, ValueError):
            continue
        if year < stale_before_year:
            total += 1
    return total


def build_fact_table_for_prompt(market_fact_table: Dict[str, Dict[str, str]], competitors: List[Dict[str, Any]]) -> str:
    competitor_lines = []
    for comp in competitors[:3]:
        competitor_lines.append(
            f"- {comp.get('name', 'Unknown')}: pricing={comp.get('product_intel', {}).get('pricing', 'Unknown')}, "
            f"funding={comp.get('market_fin', {}).get('funding', 'Unknown')}, "
            f"weakness={comp.get('weakness', 'Unknown')}"
        )
    return (
        "VERIFIED FACT TABLE\n"
        f"- Current TAM: {market_fact_table.get(CURRENT_TAM, {}).get('value', 'NOT_FOUND')} "
        f"({market_fact_table.get(CURRENT_TAM, {}).get('status', STATUS_UNSUPPORTED)})\n"
        f"- Forecast TAM: {market_fact_table.get(FORECAST_TAM, {}).get('value', 'NOT_FOUND')} "
        f"({market_fact_table.get(FORECAST_TAM, {}).get('status', STATUS_UNSUPPORTED)})\n"
        f"- CAGR: {market_fact_table.get(GROWTH, {}).get('value', 'NOT_FOUND')} "
        f"({market_fact_table.get(GROWTH, {}).get('status', STATUS_UNSUPPORTED)})\n"
        "COMPETITOR FACTS\n"
        + ("\n".join(competitor_lines) if competitor_lines else "- No direct competitors resolved")
    )


def attach_report_credibility(
    report: Dict[str, Any],
    market_fact_table: Dict[str, Dict[str, str]],
    evidence_sources: List[Dict[str, Any]],
    evidence_claims: Optional[List[Dict[str, Any]]] = None,
    competitor_provenance: Optional[Dict[str, Any]] = None,
    conflict_fields: Optional[List[str]] = None,
) -> Dict[str, Any]:
    field_provenance = build_field_provenance(market_fact_table, competitor_provenance=competitor_provenance)
    report["field_provenance"] = field_provenance
    report["evidence"] = {
        "sources": evidence_sources,
        "claims": evidence_claims or [],
    }
    report["credibility"] = compute_report_credibility(
        field_provenance,
        conflict_fields=conflict_fields or [],
        stale_sources=count_stale_sources(evidence_sources),
    )
    report["citations"] = build_citations_from_provenance(field_provenance)
    report["report_status"] = (
        "failed_validation"
        if report["credibility"]["grounded_fields"] == 0 and report["credibility"]["estimated_fields"] == 0
        else "partial_inferred"
        if report["credibility"]["unsupported_fields"] > 0
        else "complete"
    )
    return report
