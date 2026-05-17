import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.report_credibility import (
    build_citations_from_provenance,
    compute_report_credibility,
    derive_current_tam_from_forecast,
    extract_market_claims,
    sanitize_competitor_candidates,
    verify_market_report_fields,
)


class ReportCredibilityTests(unittest.TestCase):
    def test_extract_market_claims_finds_tam_and_cagr(self):
        sources = [
            {
                "title": "HR onboarding software market outlook",
                "url": "https://example.com/report",
                "snippet": (
                    "The global employee onboarding software market was valued at "
                    "USD 1.4 billion in 2025 and is expected to reach USD 3.2 billion by 2030, "
                    "growing at a CAGR of 18.0% from 2025 to 2030."
                ),
            }
        ]

        claims = extract_market_claims(sources, "employee onboarding software")

        self.assertTrue(any(c["claim_type"] == "current_tam" for c in claims))
        self.assertTrue(any(c["claim_type"] == "forecast_tam" for c in claims))
        self.assertTrue(any(c["claim_type"] == "growth" for c in claims))

    def test_derive_current_tam_from_forecast(self):
        derived = derive_current_tam_from_forecast("$3.2B", "18.0%", "2025", "2030")
        self.assertEqual(derived, "$1.40B")

    def test_verify_market_report_fields_downgrades_unsupported_values(self):
        report = {
            "market": {
                "current_tam": "$40B",
                "forecast_tam": "$90B",
                "growth": "55%",
                "current_year": "2025",
                "forecast_year": "2030",
            }
        }
        fact_table = {
            "market": {
                "current_tam": {"value": "$1.40B", "status": "verified"},
                "forecast_tam": {"value": "$3.20B", "status": "verified"},
                "growth": {"value": "18.0%", "status": "verified"},
            }
        }

        verified = verify_market_report_fields(report, fact_table)

        self.assertEqual(verified["market"]["current_tam"], "$1.40B")
        self.assertEqual(verified["market"]["forecast_tam"], "$3.20B")
        self.assertEqual(verified["market"]["growth"], "18.0%")

    def test_compute_report_credibility_counts_statuses(self):
        field_provenance = {
            "market.current_tam": {"status": "verified"},
            "market.forecast_tam": {"status": "estimated"},
            "market.growth": {"status": "unsupported"},
            "competitors.0.weakness": {"status": "inferred"},
        }

        credibility = compute_report_credibility(field_provenance, conflict_fields=["market.growth"], stale_sources=1)

        self.assertEqual(credibility["grounded_fields"], 1)
        self.assertEqual(credibility["estimated_fields"], 1)
        self.assertEqual(credibility["unsupported_fields"], 1)
        self.assertEqual(credibility["inferred_fields"], 1)
        self.assertEqual(credibility["stale_sources"], 1)
        self.assertIn("market.growth", credibility["conflicts_detected"])

    def test_build_citations_from_provenance_uses_supported_fields(self):
        field_provenance = {
            "market.current_tam": {
                "status": "verified",
                "source_url": "https://example.com/tam",
                "source_title": "TAM report",
            },
            "market.growth": {
                "status": "verified",
                "source_url": "https://example.com/growth",
                "source_title": "Growth report",
            },
            "market.forecast_tam": {
                "status": "unsupported",
                "source_url": "",
                "source_title": "",
            },
        }

        citations = build_citations_from_provenance(field_provenance)

        self.assertEqual(len(citations), 2)
        self.assertEqual(citations[0]["title"], "TAM report")

    def test_sanitize_competitor_candidates_filters_generic_placeholders(self):
        names, low_confidence = sanitize_competitor_candidates(
            ["Industry Leader", "Global Incumbent", "Rippling", "Rippling"],
            [{"url": "https://bamboohr.com", "title": "BambooHR"}],
        )

        self.assertEqual(names, ["Rippling"])
        self.assertTrue(low_confidence)


if __name__ == "__main__":
    unittest.main()
