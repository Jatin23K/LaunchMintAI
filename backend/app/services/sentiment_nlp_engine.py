"""
Layer 4: Aspect-Based Competitor Sentiment NLP Engine
Parses customer feedback, extracts aspect-targeted pain points across 3 vectors
(Pricing, Reliability/Bugs, Customer Support), and computes the Competitor Vulnerability Index (CVI).
"""

import re
import time
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_ANALYZER = SentimentIntensityAnalyzer()

# WHAT: Curated domain-specific aspect lexicons mapping customer feedback to 3 critical churn vectors.
# WHY: Unsupervised sentiment fails in SaaS evaluation because high-level generic praise ("love the sleek UI")
# masks fatal operational flaws ("billing doubled, support unresponsive"). Explicit lexicon-directed aspect routing
# isolates discrete operational failure modes to calculate actionable incumbent vulnerability.
ASPECT_LEXICONS = {
    "pricing_friction": [
        "price", "pricing", "expensive", "cost", "costs", "fee", "fees", "subscription",
        "overpriced", "rip off", "ripoff", "hike", "hikes", "renewal", "tier", "paywall",
        "contract", "annual", "charge", "charged", "billing", "bill", "refund", "credit card",
        "per seat", "seat minimum", "hidden cost", "cancel", "cancellation", "lock-in"
    ],
    "product_reliability": [
        "bug", "bugs", "buggy", "crash", "crashes", "crashed", "slow", "lag", "laggy",
        "down", "downtime", "broken", "error", "errors", "failed", "glitch", "glitches",
        "latency", "freeze", "freezes", "unresponsive", "sync", "outage", "broken update",
        "lost data", "performance", "overheat", "overheating", "hardware issue", "clunky"
    ],
    "support_friction": [
        "support", "customer service", "agent", "ticket", "tickets", "unresponsive", "ignore",
        "ignored", "no response", "terrible service", "waiting for days", "automated reply",
        "bot", "canned response", "escalate", "escalation", "rude", "unhelpful", "useless",
        "phone support", "chat support", "sla", "representative", "contact"
    ]
}

class CompetitorSentimentRequest(BaseModel):
    competitor_name: str = "Eight Sleep"
    customer_reviews_corpus: str = Field(
        ...,
        description="Raw text containing customer reviews, G2/Trustpilot feedback, or Reddit complaint threads"
    )
    competitor_market_cap_tier: str = "INCUMBENT" # INCUMBENT, UNICORN, EARLY_STAGE

# WHAT: Regex-based sentence boundary segmentation filtering out fragments under 10 characters.
# WHY: Eliminates punctuation artifacts, conversational emojis, and single-token fragments
# from distorting aspect occurrence distributions and skewing empirical sentiment polarity scores.
def split_into_sentences(text: str) -> List[str]:
    """Splits raw text corpus into individual sentences."""
    # Split on periods, exclamation marks, question marks, newlines
    raw_sentences = re.split(r'[.!?\n]+', text)
    sentences = [s.strip() for s in raw_sentences if len(s.strip()) > 10]
    return sentences

def analyze_competitor_vulnerability(
    competitor_name: str,
    customer_reviews_corpus: str,
    competitor_market_cap_tier: str = "INCUMBENT"
) -> Dict[str, Any]:
    """
    Executes Aspect-Based Sentiment Analysis on competitor review text.
    Computes aspect polarities, negative pain densities, and composite CVI.
    """
    start_time = time.time()
    sentences = split_into_sentences(customer_reviews_corpus)
    total_sentences = len(sentences)

    if total_sentences == 0:
        return {
            "status": "error",
            "message": "Empty or invalid review text corpus provided."
        }

    # Tracking metrics per aspect
    aspect_data = {
        "pricing_friction": {"sentences": [], "compound_scores": [], "neg_count": 0},
        "product_reliability": {"sentences": [], "compound_scores": [], "neg_count": 0},
        "support_friction": {"sentences": [], "compound_scores": [], "neg_count": 0},
        "general": {"sentences": [], "compound_scores": [], "neg_count": 0}
    }

    # WHAT: Sentence-level tokenization and rule-based VADER compound polarity scoring.
    # WHY: Latency vs. Accuracy SLA trade-off. Fine-tuned Transformer encoders (e.g., RoBERTa) add 1.5-3.0s
    # latency and ~1.2GB CPU RAM overhead. VADER evaluates in <20ms on pure CPU, natively handles informal social
    # syntax (capitalization emphasis, slang, exclamation intensity), and delivers sufficient polarity separation.
    # 1. Aspect Extraction & VADER Sentiment Scoring
    for sent in sentences:
        sent_lower = sent.lower()
        vs = _ANALYZER.polarity_scores(sent)
        compound = vs['compound']
        is_negative = compound < -0.05

        matched_any = False
        for aspect_name, keywords in ASPECT_LEXICONS.items():
            if any(re.search(r'\b' + re.escape(kw) + r'\b', sent_lower) for kw in keywords):
                aspect_data[aspect_name]["sentences"].append(sent)
                aspect_data[aspect_name]["compound_scores"].append(compound)
                if is_negative:
                    aspect_data[aspect_name]["neg_count"] += 1
                matched_any = True

        if not matched_any:
            aspect_data["general"]["sentences"].append(sent)
            aspect_data["general"]["compound_scores"].append(compound)
            if is_negative:
                aspect_data["general"]["neg_count"] += 1

    # 2. Calculate Aspect-Level Polarity & Negative Pain Density
    aspect_results = {}
    for aspect_name in ["pricing_friction", "product_reliability", "support_friction"]:
        data = aspect_data[aspect_name]
        count = len(data["sentences"])
        
        if count > 0:
            avg_polarity = float(sum(data["compound_scores"]) / count)
            pain_density = float(data["neg_count"] / count)
        else:
            avg_polarity = 0.0
            pain_density = 0.0

        aspect_results[aspect_name] = {
            "mention_count": count,
            "mention_percentage": f"{round((count / total_sentences) * 100, 1)}%",
            "average_sentiment_polarity": round(avg_polarity, 3),
            "negative_pain_density": round(pain_density, 3),
            "negative_pain_percentage": f"{round(pain_density * 100, 1)}%",
            "top_complaint_sample": data["sentences"][0] if data["sentences"] else "No direct aspect complaints detected"
        }

    # WHAT: Weighted combination of aspect pain densities scaled by an incumbent inertia multiplier.
    # WHY: Economic churn elasticity weighting. Pricing friction is prioritized at 40% due to direct correlation
    # with contract cancellations, followed by reliability (35%) and support (25%). Incumbents (>5y presence)
    # receive a 1.15x inertia multiplier reflecting heightened customer migration propensity when agile rivals emerge.
    # 3. Compute Composite Competitor Vulnerability Index (CVI)
    # Weights: Pricing (40%), Reliability (35%), Support (25%)
    p_pricing = aspect_results["pricing_friction"]["negative_pain_density"]
    p_rel = aspect_results["product_reliability"]["negative_pain_density"]
    p_supp = aspect_results["support_friction"]["negative_pain_density"]

    # Incumbent inertia multiplier: incumbents (>5y) with high dissatisfaction are easier to disrupt
    tier_multiplier = 1.15 if competitor_market_cap_tier == "INCUMBENT" else 1.0

    raw_cvi = (0.40 * p_pricing + 0.35 * p_rel + 0.25 * p_supp) * tier_multiplier
    cvi = round(min(1.0, max(0.0, raw_cvi)), 3)

    # Vulnerability Rating
    if cvi >= 0.60:
        vuln_rating = "CRITICAL_VULNERABILITY (Prime Disruption Target)"
    elif cvi >= 0.35:
        vuln_rating = "HIGH_VULNERABILITY (Exploitable Weak Points)"
    elif cvi >= 0.15:
        vuln_rating = "MODERATE_VULNERABILITY (Standard Industry Friction)"
    else:
        vuln_rating = "LOW_VULNERABILITY (Defensible Customer Moat)"

    # WHAT: Deterministic generation of tactical counter-positioning plays sorted by empirical aspect pain severity.
    # WHY: Prevents generic LLM hallucinated strategic advice by anchoring disruption recommendations directly to
    # the highest verified customer grievance vectors surpassing the 20% pain density threshold.
    # 4. Generate Mathematically Grounded Kill Strategies
    kill_strategies = []
    
    # Check highest vulnerability vector
    pain_ranks = sorted([
        ("Pricing & Billing Friction", p_pricing, "Introduce transparent flat-rate pricing with zero hidden subscription locks or annual seat minimums."),
        ("Product Stability & Bugs", p_rel, "Highlight 99.99% uptime SLA and instant zero-lag performance as the primary marketing differentiator."),
        ("Customer Support Friction", p_supp, "Offer dedicated 24/7 human engineer support and sub-10 minute ticket resolution guarantees.")
    ], key=lambda x: x[1], reverse=True)

    for rank, (name, score, strat) in enumerate(pain_ranks, 1):
        if score > 0.20:
            kill_strategies.append({
                "rank": rank,
                "target_vector": name,
                "pain_density": f"{round(score * 100, 1)}%",
                "tactical_kill_strategy": strat
            })

    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    return {
        "status": "success",
        "competitor_name": competitor_name,
        "competitor_tier": competitor_market_cap_tier,
        "corpus_statistics": {
            "total_sentences_analyzed": total_sentences,
            "aspect_matched_sentences": sum(len(aspect_data[k]["sentences"]) for k in ["pricing_friction", "product_reliability", "support_friction"]),
            "execution_latency_ms": elapsed_ms
        },
        "vulnerability_index": {
            "cvi_score": cvi,
            "cvi_percentage": f"{round(cvi * 100, 1)}%",
            "vulnerability_grade": vuln_rating
        },
        "aspect_breakdown": {
            "pricing_friction": aspect_results["pricing_friction"],
            "product_reliability": aspect_results["product_reliability"],
            "support_friction": aspect_results["support_friction"]
        },
        "recommended_kill_strategies": kill_strategies
    }
