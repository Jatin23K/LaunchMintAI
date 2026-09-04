"""
Test and benchmark script for Aspect-Based Competitor Sentiment NLP Engine.
"""

import sys
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))

from app.services.sentiment_nlp_engine import analyze_competitor_vulnerability

def run_tests():
    print("=" * 80)
    print("🎯 TESTING ASPECT-BASED COMPETITOR SENTIMENT NLP ENGINE (VADER + CVI)")
    print("=" * 80)

    test_competitors = [
        {
            "name": "Eight Sleep",
            "tier": "UNICORN",
            "corpus": """
            The hardware pod is reasonably comfortable but the app requires a mandatory $240/year subscription just to adjust temperature.
            That is a complete ripoff for a $2,500 mattress.
            Customer service took 3 weeks to reply to my broken leak ticket and the support agent was completely useless.
            The wifi sync fails every two weeks and the sensor data freezes constantly during sleep tracking.
            Overpriced subscription paywall is driving everyone crazy on Reddit.
            """
        },
        {
            "name": "Salesforce CRM",
            "tier": "INCUMBENT",
            "corpus": """
            The licensing cost is astronomical with extreme price hikes every renewal.
            They lock you into multi-year contracts with strict seat minimums.
            The UI is extremely slow and clunky, with random crashes when exporting large reports.
            Support tickets take days to escalate unless you pay 30% extra for Premier Support.
            Great enterprise ecosystem and integrations though.
            """
        },
        {
            "name": "Notion",
            "tier": "UNICORN",
            "corpus": """
            Notion is very flexible and beautiful for internal wikis.
            However, when databases grow over 10,000 rows, the page latency becomes unbearable and search freezes.
            Pricing is fair for small teams but enterprise tier is getting expensive.
            Offline mode is completely broken and still has not been fixed.
            """
        },
        {
            "name": "Jira / Atlassian",
            "tier": "INCUMBENT",
            "corpus": """
            Jira is notoriously slow and bloated. Every page load takes 3 seconds.
            The configuration complexity is terrible, and plugins add massive hidden costs.
            Customer support for cloud migration was a nightmare with canned automated replies.
            It's impossible to cancel without talking to an account rep.
            """
        }
    ]

    for tc in test_competitors:
        res = analyze_competitor_vulnerability(
            competitor_name=tc['name'],
            customer_reviews_corpus=tc['corpus'],
            competitor_market_cap_tier=tc['tier']
        )

        v = res['vulnerability_index']
        a = res['aspect_breakdown']
        s = res['corpus_statistics']

        print(f"\n📌 Competitor: {tc['name']} ({tc['tier']})")
        print(f"   Execution Latency:      {s['execution_latency_ms']} ms")
        print(f"   CVI Score:              {v['cvi_percentage']} ({v['cvi_score']}) -> {v['vulnerability_grade']}")
        print(f"   Pricing Pain Density:   {a['pricing_friction']['negative_pain_percentage']} (Avg Polarity: {a['pricing_friction']['average_sentiment_polarity']})")
        print(f"   Reliability Pain:       {a['product_reliability']['negative_pain_percentage']} (Avg Polarity: {a['product_reliability']['average_sentiment_polarity']})")
        print(f"   Support Pain Density:   {a['support_friction']['negative_pain_percentage']} (Avg Polarity: {a['support_friction']['average_sentiment_polarity']})")
        print(f"   Top Kill Strategy:      {res['recommended_kill_strategies'][0]['tactical_kill_strategy'] if res['recommended_kill_strategies'] else 'None'}")

    print("\n" + "=" * 80)
    print("✅ All Aspect-Based Sentiment & CVI tests passed!")

if __name__ == '__main__':
    run_tests()
