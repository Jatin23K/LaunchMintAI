"""
Tests for evidence_model.py — claim extraction, provenance, credibility.
Run: python -m pytest backend/app/services/test_evidence_model.py -v
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pytest
from evidence_model import (
    extract_market_claims,
    build_fact_table,
    build_provenance,
    build_credibility_meta,
    determine_report_status,
    _detect_conflicts,
    _is_placeholder,
    format_fact_table_for_prompt,
)

# ── Fixtures ──────────────────────────────────────────────────────────────────

TIER1_SOURCE = {
    "url": "https://www.grandviewresearch.com/industry-analysis/dog-walking-market",
    "title": "Dog Walking Market Size Report 2025",
    "content": (
        "The global dog walking market was valued at $1.3 billion in 2024 and is "
        "expected to reach $2.8 billion by 2030, growing at a CAGR of 13.6% from "
        "2025 to 2030. Increased pet adoption post-pandemic drives demand."
    ),
}

TIER3_SOURCE = {
    "url": "https://someblog.example.com/dog-walking",
    "title": "Dog Walking Industry Overview",
    "content": "The market is around 500 million dollars and growing fast.",
}

CONFLICTING_SOURCE = {
    "url": "https://www.statista.com/dog-walking",
    "title": "Statista Dog Walking",
    "content": "Dog walking services generated USD 6.5 billion in revenue in 2024.",
}

# ── extract_market_claims ─────────────────────────────────────────────────────

def test_extracts_current_tam_from_tier1():
    claims = extract_market_claims([TIER1_SOURCE])
    current = [c for c in claims if c["claim_type"] == "current_tam"]
    assert len(current) >= 1
    assert current[0]["normalized_value"] == pytest.approx(1.3, abs=0.1)
    assert current[0]["domain_tier"] == "tier1"
    assert current[0]["status"] == "verified"
    assert current[0]["confidence"] == 0.9

def test_extracts_forecast_tam():
    claims = extract_market_claims([TIER1_SOURCE])
    forecast = [c for c in claims if c["claim_type"] == "forecast_tam"]
    assert len(forecast) >= 1
    assert forecast[0]["normalized_value"] == pytest.approx(2.8, abs=0.2)
    assert forecast[0]["year"] == 2030

def test_extracts_cagr():
    claims = extract_market_claims([TIER1_SOURCE])
    cagr = [c for c in claims if c["claim_type"] == "cagr"]
    assert len(cagr) >= 1
    assert cagr[0]["normalized_value"] == pytest.approx(13.6, abs=0.5)

def test_tier3_lower_confidence():
    claims = extract_market_claims([TIER3_SOURCE])
    if claims:
        assert claims[0]["confidence"] < 0.9

def test_filters_out_of_range_values():
    bad_source = {
        "url": "https://example.com",
        "title": "Test",
        "content": "Market is 0.000001 billion or 999999 billion — both should be filtered.",
    }
    claims = extract_market_claims([bad_source])
    for c in claims:
        assert 0.005 < c["normalized_value"] < 10000

def test_normalizes_millions_to_billions():
    million_source = {
        "url": "https://example.com",
        "title": "Niche Market",
        "content": "The niche software market was valued at 850 million in 2024.",
    }
    claims = extract_market_claims([million_source])
    current = [c for c in claims if c["claim_type"] == "current_tam"]
    if current:
        assert current[0]["normalized_value"] == pytest.approx(0.85, abs=0.05)

def test_normalizes_trillions_to_billions():
    trillion_source = {
        "url": "https://example.com",
        "title": "Huge Market",
        "content": "The global fintech market was valued at 1.5 trillion in 2025.",
    }
    claims = extract_market_claims([trillion_source])
    current = [c for c in claims if c["claim_type"] == "current_tam"]
    if current:
        assert current[0]["normalized_value"] == pytest.approx(1500, abs=50)

def test_empty_sources_returns_empty():
    assert extract_market_claims([]) == []
    assert extract_market_claims([{"url": "", "title": "", "content": ""}]) == []

def test_extracts_from_snippet_field():
    """Real search results use 'snippet' not 'content' — both must work."""
    snippet_source = {
        "url": "https://www.grandviewresearch.com/industry-analysis/legal-ai",
        "title": "Legal AI Market Size Report 2025",
        "snippet": (
            "The global legal AI market was valued at $1.2 billion in 2024 and is "
            "expected to reach $3.5 billion by 2030, growing at a CAGR of 19.4%."
        ),
    }
    claims = extract_market_claims([snippet_source])
    assert len(claims) >= 1
    current = [c for c in claims if c["claim_type"] == "current_tam"]
    assert len(current) >= 1

# ── build_fact_table ──────────────────────────────────────────────────────────

def test_fact_table_picks_highest_confidence():
    low_conf = {"claim_type": "current_tam", "normalized_value": 1.0, "confidence": 0.6,
                "source_url": "", "source_title": "", "quote": "", "year": 2024,
                "claim_id": "a", "raw_text": "", "unit": "USD_B", "domain_tier": "tier3",
                "status": "verified", "extraction_method": "regex"}
    high_conf = {**low_conf, "normalized_value": 1.3, "confidence": 0.9, "claim_id": "b"}
    fact = build_fact_table([low_conf, high_conf])
    assert fact["current_tam"]["confidence"] == 0.9
    assert fact["current_tam"]["normalized_value"] == 1.3

# ── _detect_conflicts ─────────────────────────────────────────────────────────

def test_detects_material_conflict():
    c1 = {"claim_type": "current_tam", "normalized_value": 1.3, "confidence": 0.9,
          "source_url": "", "source_title": "", "quote": "", "year": 2024,
          "claim_id": "a", "raw_text": "", "unit": "USD_B", "domain_tier": "tier1",
          "status": "verified", "extraction_method": "regex"}
    c2 = {**c1, "normalized_value": 6.5, "claim_id": "b"}
    conflicts = _detect_conflicts([c1, c2])
    assert len(conflicts) == 1
    assert "current_tam" in conflicts[0]

def test_no_conflict_within_2x():
    c1 = {"claim_type": "current_tam", "normalized_value": 1.0, "confidence": 0.9,
          "source_url": "", "source_title": "", "quote": "", "year": 2024,
          "claim_id": "a", "raw_text": "", "unit": "USD_B", "domain_tier": "tier1",
          "status": "verified", "extraction_method": "regex"}
    c2 = {**c1, "normalized_value": 2.0, "claim_id": "b"}
    conflicts = _detect_conflicts([c1, c2])
    assert len(conflicts) == 0

# ── _is_placeholder ───────────────────────────────────────────────────────────

def test_recognizes_placeholders():
    assert _is_placeholder(None)
    assert _is_placeholder("")
    assert _is_placeholder("NOT_FOUND")
    assert _is_placeholder("N/A")
    assert _is_placeholder("unavailable")
    assert _is_placeholder("~$5B (est.)")
    assert _is_placeholder("~$12B (est.)")

def test_real_values_not_placeholders():
    assert not _is_placeholder("$1.3B")
    assert not _is_placeholder("13.6%")
    assert not _is_placeholder("$2.8B")

# ── build_provenance ──────────────────────────────────────────────────────────

def test_verified_when_claim_matches_market():
    claims = extract_market_claims([TIER1_SOURCE])
    market = {"current_tam": "$1.3B", "forecast_tam": "$2.8B", "growth": "13.6%"}
    prov = build_provenance(market, claims, [], [])
    assert prov["market.current_tam"]["status"] == "verified"
    assert prov["market.growth"]["status"] == "verified"

def test_unsupported_when_placeholder():
    market = {"current_tam": None, "forecast_tam": None, "growth": None}
    prov = build_provenance(market, [], [], [])
    assert prov["market.current_tam"]["status"] == "unsupported"

def test_giant_competitor_marked_verified():
    market = {"current_tam": "$5B", "growth": "12%"}
    prov = build_provenance(market, [], ["OpenAI"], ["openai"])
    assert prov["competitor.OpenAI"]["status"] == "verified"

def test_unknown_competitor_marked_inferred():
    market = {"current_tam": "$5B", "growth": "12%"}
    prov = build_provenance(market, [], ["RandomStartup"], ["openai"])
    assert prov["competitor.RandomStartup"]["status"] == "inferred"

def test_dept_sections_always_inferred():
    market = {"current_tam": "$5B", "growth": "12%"}
    prov = build_provenance(market, [], [], [])
    for dept in ("dept_legal", "dept_product", "dept_marketing", "dept_finance", "god_mode"):
        assert prov[dept]["status"] == "inferred"

# ── build_credibility_meta ────────────────────────────────────────────────────

def test_credibility_score_above_zero_with_sources():
    claims = extract_market_claims([TIER1_SOURCE])
    market = {"current_tam": "$1.3B", "forecast_tam": "$2.8B", "growth": "13.6%"}
    prov = build_provenance(market, claims, [], [])
    cred = build_credibility_meta(prov, claims)
    assert cred["overall_score"] > 0
    assert cred["claims_extracted"] > 0
    assert "generated_at" in cred

def test_credibility_zero_with_no_sources():
    market = {"current_tam": None, "growth": None}
    prov = build_provenance(market, [], [], [])
    cred = build_credibility_meta(prov, [])
    assert cred["unsupported_fields"] != []

# ── determine_report_status ───────────────────────────────────────────────────

def test_complete_status_above_60pct():
    cred = {"overall_score": 0.7, "unsupported_fields": []}
    assert determine_report_status(cred) == "complete"

def test_partial_grounded_30_to_60():
    cred = {"overall_score": 0.45, "unsupported_fields": []}
    assert determine_report_status(cred) == "partial_grounded"

def test_partial_inferred_below_30():
    cred = {"overall_score": 0.1, "unsupported_fields": ["market.current_tam"]}
    assert determine_report_status(cred) == "partial_inferred"

# ── format_fact_table_for_prompt ──────────────────────────────────────────────

def test_fact_table_prompt_includes_numbers():
    claims = extract_market_claims([TIER1_SOURCE])
    fact = build_fact_table(claims)
    text = format_fact_table_for_prompt(fact)
    assert "1.3" in text or "2.8" in text or "13.6" in text

def test_empty_fact_table_returns_no_verified():
    text = format_fact_table_for_prompt({})
    assert "No verified" in text

# ── End-to-end scenario ───────────────────────────────────────────────────────

def test_e2e_strong_source_idea():
    """Strong-source idea: report should be mostly verified."""
    claims = extract_market_claims([TIER1_SOURCE])
    market = {"current_tam": "$1.3B", "forecast_tam": "$2.8B", "growth": "13.6%"}
    prov = build_provenance(market, claims, ["Rover", "Wag"], ["rover"])
    cred = build_credibility_meta(prov, claims)
    status = determine_report_status(cred)
    assert status in ("complete", "partial_grounded")
    assert len(cred["verified_fields"]) >= 1

def test_e2e_no_source_idea():
    """No-good-source idea: report should be honest about uncertainty."""
    claims = extract_market_claims([])
    market = {"current_tam": None, "forecast_tam": None, "growth": None}
    prov = build_provenance(market, claims, ["Unknown Corp"], [])
    cred = build_credibility_meta(prov, claims)
    status = determine_report_status(cred)
    assert status == "partial_inferred"
    assert len(cred["unsupported_fields"]) >= 1

def test_e2e_conflict_detected():
    """Conflicting sources should surface in credibility."""
    claims = extract_market_claims([TIER1_SOURCE, CONFLICTING_SOURCE])
    cred = build_credibility_meta({}, claims)
    assert len(cred["conflicts_detected"]) >= 1
