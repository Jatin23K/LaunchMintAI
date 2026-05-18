"""
Sentiment Pipeline — Phase 3
Competitor pain point analysis using VADER + curated knowledge base.
No scraping. No external API calls. Fast and reliable.
"""

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from typing import Dict, List

analyzer = SentimentIntensityAnalyzer()

# ── Competitor Knowledge Base ──────────────────────────────────────────────
# Curated from G2, Trustpilot, Reddit, ProductHunt reviews
# Format: name → { pain_points, strengths, pricing, kill_strategy }

COMPETITOR_KB = {
    # LegalTech
    "clio": {
        "pain_points": ["Expensive pricing tiers", "No flat-rate option", "Slow mobile app", "Complex onboarding"],
        "strengths":   ["Trusted brand", "Deep integrations", "Large user base"],
        "pricing":     "$39-$99/user/month",
        "kill_strategy": "Launch flat-rate pricing with a mobile-first experience to undercut Clio's per-seat model"
    },
    "harvey ai": {
        "pain_points": ["Enterprise-only access", "No SMB tier", "High minimum contract", "Long sales cycle"],
        "strengths":   ["Cutting-edge LLM", "Big Law adoption", "Strong funding"],
        "pricing":     "Enterprise only (undisclosed)",
        "kill_strategy": "Target SMBs and solo practitioners with self-serve onboarding Harvey ignores"
    },
    "ironclad": {
        "pain_points": ["Steep learning curve", "Expensive for small teams", "Slow support response"],
        "strengths":   ["Best-in-class contract workflows", "Strong integrations"],
        "pricing":     "$700+/month",
        "kill_strategy": "Attack with a simpler UX and transparent pricing for teams under 50 people"
    },
    # Fintech
    "stripe": {
        "pain_points": ["Account freezes without warning", "Slow support", "High fees for small volumes"],
        "strengths":   ["Developer-first", "Best-in-class docs", "Global reach"],
        "pricing":     "2.9% + 30c per transaction",
        "kill_strategy": "Target high-volume SMBs with lower interchange fees and 24/7 human support"
    },
    "plaid": {
        "pain_points": ["Privacy concerns", "High API costs at scale", "Limited international coverage"],
        "strengths":   ["Widest bank coverage", "Trusted brand"],
        "pricing":     "Usage-based (expensive at scale)",
        "kill_strategy": "Launch a privacy-first alternative with transparent flat-rate API pricing"
    },
    # SaaS / CRM
    "salesforce": {
        "pain_points": ["Overwhelming complexity", "Very expensive", "Requires dedicated admin", "Slow implementation"],
        "strengths":   ["Most complete CRM", "Massive ecosystem", "Enterprise trust"],
        "pricing":     "$25-$300+/user/month",
        "kill_strategy": "Build a vertically focused CRM for one industry — win by being 80% simpler at 30% of the cost"
    },
    "hubspot": {
        "pain_points": ["Gets expensive fast", "Locked into ecosystem", "Reporting limitations on lower tiers"],
        "strengths":   ["Great free tier", "Easy to use", "Strong marketing tools"],
        "pricing":     "Free to $1200+/month",
        "kill_strategy": "Offer deeper industry-specific workflows HubSpot's horizontal approach can't match"
    },
    # AI / ML
    "openai": {
        "pain_points": ["Rate limits", "Unpredictable pricing", "Safety over-restrictions", "No private deployment"],
        "strengths":   ["Best models", "Widest ecosystem", "Strong brand"],
        "pricing":     "Usage-based API",
        "kill_strategy": "Target enterprises needing private on-premise deployment with guaranteed SLAs"
    },
    "anthropic": {
        "pain_points": ["Limited consumer presence", "Strict safety filters", "Availability issues"],
        "strengths":   ["Safety-focused", "Strong reasoning", "Enterprise trust"],
        "pricing":     "Usage-based API",
        "kill_strategy": "Win creative and research users who find Claude too restrictive for their use case"
    },
    # E-Commerce
    "shopify": {
        "pain_points": ["Transaction fees", "App costs add up", "Limited B2B features", "Expensive at scale"],
        "strengths":   ["Easiest setup", "Massive app store", "Strong brand"],
        "pricing":     "$29-$299+/month + transaction fees",
        "kill_strategy": "Build a zero-transaction-fee alternative for high-volume D2C brands losing margin to Shopify"
    },
    # EdTech
    "coursera": {
        "pain_points": ["Expensive certificates", "Low course completion rates", "One-size-fits-all content"],
        "strengths":   ["University partnerships", "Wide catalogue", "Brand recognition"],
        "pricing":     "$39-$399/course",
        "kill_strategy": "Launch adaptive learning paths with outcome-based pricing — pay only when you land a job"
    },
    "duolingo": {
        "pain_points": ["Gamification feels shallow", "No speaking practice", "Slow progression for advanced users"],
        "strengths":   ["Massive user base", "Best retention", "Free tier"],
        "pricing":     "Free / $6.99/month",
        "kill_strategy": "Target adult professionals needing fast business-language fluency, not gamified streaks"
    },
    # Healthcare
    "oscar health": {
        "pain_points": ["Limited provider network", "Claims processing delays", "High premiums"],
        "strengths":   ["Tech-forward UX", "Strong brand", "Telemedicine integration"],
        "pricing":     "Insurance premiums",
        "kill_strategy": "Focus on one employer vertical with transparent pricing and faster claims via automation"
    },
    # HR / Onboarding
    "bamboohr": {
        "pain_points": ["Limited reporting and analytics", "No built-in payroll in all regions", "Basic onboarding checklists", "Outgrown by mid-market companies"],
        "strengths":   ["Easy to use", "Great for SMBs", "Strong G2 ratings"],
        "pricing":     "$6-$9/employee/month",
        "kill_strategy": "Replace their static onboarding checklists with AI-adaptive learning paths that personalize by role and skill gaps"
    },
    "rippling": {
        "pain_points": ["Expensive for small teams", "Complex implementation takes weeks", "Overwhelming feature set", "Steep learning curve"],
        "strengths":   ["Unified HR+IT+Finance", "Strong automation", "Fast-growing"],
        "pricing":     "$8-$35/employee/month",
        "kill_strategy": "Win with 10-minute onboarding setup vs Rippling's weeks-long implementation — laser focus on onboarding only"
    },
    "workday": {
        "pain_points": ["6-12 month implementation cycles", "Extremely expensive enterprise pricing", "Requires dedicated admin team", "Rigid workflow customization"],
        "strengths":   ["Enterprise trust", "Complete HCM suite", "Global compliance"],
        "pricing":     "$100+/user/year (enterprise contracts)",
        "kill_strategy": "Disrupt their 6-month deployment with a plug-and-play onboarding module at 90% lower cost per employee"
    },
    "factorial": {
        "pain_points": ["Limited US market presence", "Missing integrations with US payroll providers", "Basic analytics", "No AI features"],
        "strengths":   ["Strong in EU market", "Affordable", "Growing fast"],
        "pricing":     "$4-$8/employee/month",
        "kill_strategy": "Beat their EU-only focus with a global-first platform that handles multi-currency payroll and localized compliance"
    },
    "gusto": {
        "pain_points": ["Limited to US only", "No enterprise features", "Basic onboarding flow", "Slow customer support"],
        "strengths":   ["Great payroll", "Easy UI", "Strong SMB brand"],
        "pricing":     "$40/month + $6/employee",
        "kill_strategy": "Target Gusto's gap in onboarding depth — their flow is checkbox-based while yours is AI-personalized"
    },
    # Logistics
    "flexport": {
        "pain_points": ["Expensive for SMBs", "Complex onboarding", "Visibility gaps"],
        "strengths":   ["End-to-end visibility", "Strong tech platform"],
        "pricing":     "Quote-based",
        "kill_strategy": "Launch a self-serve freight platform for SMB importers Flexport ignores below their ACV"
    },
    # Mental Wellness / Employee Wellness
    "headspace": {
        "pain_points": ["Generic content not tailored to work stress", "Low employee engagement after month 1", "No manager-level insights or reporting", "Expensive per-seat for large orgs"],
        "strengths":   ["Strong brand recognition", "High-quality meditation content", "Easy onboarding"],
        "pricing":     "$12.99/month consumer / $7.99+/user/month enterprise",
        "kill_strategy": "Win with clinician-backed CBT modules and ROI dashboards that Headspace's content-only approach cannot offer HR buyers"
    },
    "headspace for organizations": {
        "pain_points": ["Generic content not tailored to work stress", "Low employee engagement after month 1", "No manager-level insights or reporting", "Expensive per-seat for large orgs"],
        "strengths":   ["Strong brand recognition", "High-quality meditation content", "Easy onboarding"],
        "pricing":     "$7.99+/user/month (volume discounts available)",
        "kill_strategy": "Win with clinician-backed CBT modules and ROI dashboards that Headspace's content-only approach cannot offer HR buyers"
    },
    "lyra health": {
        "pain_points": ["Limited therapist network outside major cities", "Long wait times for first appointment", "High cost per member for smaller employers", "No self-serve tools between sessions"],
        "strengths":   ["Clinical credibility", "EAP replacement positioning", "Strong enterprise sales"],
        "pricing":     "$200-$400/employee/year (employer-sponsored)",
        "kill_strategy": "Undercut with AI-first triage + on-demand tools that fill the gap between sessions Lyra leaves unaddressed"
    },
    "mantracare": {
        "pain_points": ["Limited brand recognition outside India/Asia", "Inconsistent therapist quality", "Basic app UX", "No employer analytics dashboard"],
        "strengths":   ["Affordable pricing", "Wide therapist network in emerging markets", "Multi-modal support"],
        "pricing":     "$5-$20/session",
        "kill_strategy": "Compete on employer ROI reporting and AI-personalized care pathways MantraCare's generic platform lacks"
    },
    "betterhelp": {
        "pain_points": ["Privacy concerns and data sharing controversies", "Therapist matching takes too long", "No in-person option", "Not covered by insurance"],
        "strengths":   ["Largest online therapy platform", "Fast signup", "Wide therapist pool"],
        "pricing":     "$60-$100/week",
        "kill_strategy": "Target employer-sponsored use cases BetterHelp ignores — offer insurance integration and manager wellbeing dashboards"
    },
    "calm": {
        "pain_points": ["Passive consumption, not clinical intervention", "Low retention after free trial", "No corporate ROI metrics", "Content feels repetitive after 6 months"],
        "strengths":   ["Top consumer brand", "Sleep content leadership", "Celebrity partnerships"],
        "pricing":     "$14.99/month / $69.99/year",
        "kill_strategy": "Position as clinically validated alternative — Calm can't claim therapeutic outcomes, you can"
    },
    "spring health": {
        "pain_points": ["High minimum contract size excludes mid-market", "Onboarding takes 3-4 months", "Black-box precision matching algorithm", "Limited international therapist coverage"],
        "strengths":   ["Precision mental health matching", "Clinical outcomes data", "Strong VC backing"],
        "pricing":     "$300-$500/employee/year",
        "kill_strategy": "Win mid-market employers Spring Health ignores with faster deployment and transparent matching criteria"
    },
    "modern health": {
        "pain_points": ["High price point for smaller companies", "Therapist availability varies by region", "Coaching vs therapy distinction confuses buyers", "Limited crisis support"],
        "strengths":   ["Whole-person approach", "Coaching + therapy combo", "Strong employer brand"],
        "pricing":     "$200-$450/employee/year",
        "kill_strategy": "Differentiate with AI-driven early intervention that catches burnout before it escalates to clinical need"
    },
    # Productivity / Remote Work
    "notion": {
        "pain_points": ["Steep learning curve for non-technical users", "Slow on large databases", "No native time tracking", "Offline mode unreliable"],
        "strengths":   ["Highly flexible", "Strong community", "All-in-one workspace"],
        "pricing":     "Free / $8-$15/user/month",
        "kill_strategy": "Win teams that find Notion too complex with an opinionated, pre-built workflow that works out of the box"
    },
    "slack": {
        "pain_points": ["Notification overload causes burnout", "Expensive at scale", "Messages get lost in channels", "No built-in project management"],
        "strengths":   ["Category-defining brand", "Massive integrations", "Strong network effects"],
        "pricing":     "Free / $7.25-$12.50/user/month",
        "kill_strategy": "Attack Slack's async blindspot — async-first teams need structured communication tools Slack's real-time model doesn't support"
    },
    "zoom": {
        "pain_points": ["Zoom fatigue is real and documented", "Security concerns persist", "No async video by default", "Poor breakout room UX"],
        "strengths":   ["Dominant video brand", "Reliable infrastructure", "Easy guest access"],
        "pricing":     "Free / $13.33-$18.32/user/month",
        "kill_strategy": "Win with async-first video that reduces meeting load — Zoom's sync-only model accelerates remote burnout"
    },
    # Dog walking / Pet Services
    "rover": {
        "pain_points": ["High service fees (15-20%)", "Inconsistent sitter quality", "No GPS tracking", "Limited insurance coverage"],
        "strengths":   ["Largest pet sitter network", "Strong brand", "Easy booking UX"],
        "pricing":     "$15-$40/walk + 15% platform fee",
        "kill_strategy": "Undercut on fees and win on trust — real-time GPS tracking and vetted walkers Rover's peer model can't guarantee"
    },
    "wag": {
        "pain_points": ["Past safety incidents damaged trust", "Inconsistent walker quality", "Customer support slow to respond", "App reliability issues"],
        "strengths":   ["On-demand availability", "Wide city coverage", "Subscription option"],
        "pricing":     "$20-$35/walk",
        "kill_strategy": "Win on safety and trust — background-checked, insured walkers with live GPS that Wag's on-demand model struggles to guarantee"
    },
}

# ── Sector-level fallback pain points ──────────────────────────────────────
SECTOR_PAIN_FALLBACK = {
    0: ["High API costs at scale",    "Rate limiting issues",       "Vendor lock-in risk"],
    1: ["High transaction fees",      "Compliance complexity",      "Slow onboarding"],
    2: ["Regulatory barriers",        "Slow reimbursement cycles",  "Data privacy concerns"],
    3: ["Low completion rates",       "One-size content",           "Poor ROI measurement"],
    4: ["Feature bloat",              "High per-seat pricing",      "Long implementation time"],
    5: ["High return rates",          "Thin margins",               "Rising ad costs"],
    6: ["Billable hour resistance",   "Complex compliance",         "Slow adoption"],
    7: ["Visibility gaps",            "Manual processes",           "High freight costs"],
    8: ["Long sales cycles",          "High customer acquisition",  "Illiquid assets"],
    9: ["Entrenched incumbents",      "Low switching motivation",   "Price sensitivity"],
}


def _normalize_name(name: str) -> str:
    return name.lower().strip()


def _score_pain_points(pain_points: List[str]) -> float:
    """
    Uses VADER to compute average negative sentiment across pain points.
    Returns a pain score: higher = more painful = bigger opportunity.
    Scale: 0.0 (no pain) to 5.0 (extreme pain).
    """
    if not pain_points:
        return 2.5

    scores = []
    for point in pain_points:
        vs = analyzer.polarity_scores(point)
        # Convert compound (-1 to 1) to pain scale (0 to 5)
        pain = (1 - vs["compound"]) * 2.5
        scores.append(pain)

    return round(float(sum(scores) / len(scores)), 2)


def analyze_competitor(name: str, sector: int = 9) -> Dict:
    """
    Returns sentiment analysis for a single competitor.
    Uses KB if known, falls back to sector-level data if unknown.
    """
    key = _normalize_name(name)

    # ── Known competitor path ──────────────────────────────────────────
    for kb_key, kb_data in COMPETITOR_KB.items():
        if kb_key in key or key in kb_key:
            pain_score = _score_pain_points(kb_data["pain_points"])
            return {
                "name":          name,
                "known":         True,
                "pain_score":    pain_score,
                "top_complaints": kb_data["pain_points"][:3],
                "strengths":     kb_data["strengths"][:2],
                "pricing":       kb_data["pricing"],
                "kill_strategy": kb_data["kill_strategy"],
            }

    # ── Unknown competitor — sector fallback ───────────────────────────
    fallback_pains = SECTOR_PAIN_FALLBACK.get(sector, SECTOR_PAIN_FALLBACK[9])
    pain_score = _score_pain_points(fallback_pains)

    sector_strategies = {
        0: f"Outcompete {name} on pricing transparency and reliability — AI/API incumbents all suffer from unpredictable costs",
        1: f"Attack {name}'s compliance gaps and onboarding friction with a faster, lower-fee alternative",
        2: f"Win clinicians and patients {name} ignores with better data privacy and faster reimbursement workflows",
        3: f"Displace {name} with outcome-based pricing and AI-personalized learning paths they can't match",
        4: f"Undercut {name}'s per-seat model with a usage-based tier and a 10-minute onboarding that replaces their 3-month implementation",
        5: f"Capture {name}'s margin-squeezed customers with zero transaction fees and a D2C-optimized checkout",
        6: f"Win the clients {name} loses to billing complexity — offer transparent flat-fee pricing with AI-assisted compliance",
        7: f"Serve the SMB shippers {name} ignores below their ACV threshold with a self-serve, real-time visibility platform",
        8: f"Move faster than {name} — digitize the paper-heavy workflows that slow their deal cycles",
        9: f"Find the customer segment {name} underserves and own it with a focused product at half the price",
    }

    return {
        "name":          name,
        "known":         False,
        "pain_score":    pain_score,
        "top_complaints": fallback_pains,
        "strengths":     ["Established user base", "Brand recognition"],
        "pricing":       "Market-rate pricing",
        "kill_strategy": sector_strategies.get(sector, sector_strategies[9]),
    }


def analyze_competitors(names: List[str], sector: int = 9) -> List[Dict]:
    """Analyze a list of competitors. Returns list of analysis dicts."""
    return [analyze_competitor(name, sector) for name in names[:3]]
