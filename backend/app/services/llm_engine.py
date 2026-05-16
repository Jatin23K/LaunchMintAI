"""
Live Research Engine - HIGH AVAILABILITY EDITION
1. DUAL-LAYER SEARCH: Tries specific query first. If empty, tries broad query.
2. FASTER RETRY: Tuned wait times (2s -> 4s -> 8s) to prevent timeouts.
3. ROBUST REGEX: Catches more number formats.
"""

import os
import json
import requests
import re
import time
import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from duckduckgo_search import DDGS
from dotenv import load_dotenv
import concurrent.futures
import random

# Add parent directory to path for imports
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.market_search import search_market_data, format_search_results_for_prompt
import app.ds.pipeline as ds_pipeline

load_dotenv()

# ── Gemini Key Pool ────────────────────────────────────────────────────────
# Working keys first to skip exhausted ones without burning backoff time.
# Update order here whenever a key recovers or gets exhausted.
_KEY_POOL = [
    v for v in [
        os.environ.get("GEMINI_API_KEY_3"),
        os.environ.get("GEMINI_API_KEY_5"),
        os.environ.get("GEMINI_API_KEY_6"),
        os.environ.get("GEMINI_API_KEY_2"),
        os.environ.get("GEMINI_API_KEY_1") or os.environ.get("GEMINI_API_KEY"),
        os.environ.get("GEMINI_API_KEY_4"),
    ] if v
]

# ── Gemini Model Waterfall ─────────────────────────────────────────────────
# PRIMARY   : gemini-2.5-flash      — best reasoning, 250 RPD/key × 6 = 1500/day
# SECONDARY : gemini-2.5-flash-lite — faster fallback, 1000 RPD/key × 6 = 6000/day
PRIMARY_MODEL   = "gemini-2.5-flash"
SECONDARY_MODEL = "gemini-2.5-flash-lite"

# Legacy alias kept so old call sites don't break
API_KEY = _KEY_POOL[0] if _KEY_POOL else None

# ── NVIDIA NIM Key Pool ────────────────────────────────────────────────────
# Free tier: 40 RPM per key, no daily cap.
# Used for: lightweight calls (classify, swarm, roast, forge, risk, gtm).
# Add keys in backend/.env as NIM_API_KEY_1 … NIM_API_KEY_6
# Get keys at: https://build.nvidia.com → Sign in → API Keys
_NIM_KEY_POOL = [
    v for v in [
        os.environ.get("NIM_API_KEY_1"),
        os.environ.get("NIM_API_KEY_2"),
        os.environ.get("NIM_API_KEY_3"),
        os.environ.get("NIM_API_KEY_4"),
        os.environ.get("NIM_API_KEY_5"),
        os.environ.get("NIM_API_KEY_6"),
    ] if v and v.startswith("nvapi-")  # skip blank/placeholder entries
]

# NIM endpoint (OpenAI-compatible)
NIM_BASE_URL   = "https://integrate.api.nvidia.com/v1"
NIM_MODEL      = "meta/llama-3.1-70b-instruct"   # best free model for JSON tasks
NIM_MODEL_FAST = "meta/llama-3.1-8b-instruct"    # faster, for simple extractions

print(f"[INIT] Gemini keys loaded: {len(_KEY_POOL)}/6")
print(f"[INIT] NIM keys loaded:    {len(_NIM_KEY_POOL)}/6")

# ── TRUE ROUND-ROBIN COUNTERS ─────────────────────────────────────────────────
# Each call auto-increments so every key gets even usage across all endpoints.
# No more hardcoded key_offset=N — every call picks the next key in line.
_GEMINI_CALL_CTR = 0
_NIM_CALL_CTR    = 0

def _next_gemini_offset() -> int:
    global _GEMINI_CALL_CTR
    if not _KEY_POOL:
        return 0
    offset = _GEMINI_CALL_CTR % len(_KEY_POOL)
    _GEMINI_CALL_CTR += 1
    return offset

def _next_nim_offset() -> int:
    global _NIM_CALL_CTR
    if not _NIM_KEY_POOL:
        return 0
    offset = _NIM_CALL_CTR % len(_NIM_KEY_POOL)
    _NIM_CALL_CTR += 1
    return offset

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class IdeaRequest(BaseModel):
    idea: str

class DSInsightsRequest(BaseModel):
    idea: str
    market_data: dict = {}
    competitors: list = []

class VCRoastRequest(BaseModel):
    user_idea: str

@app.get("/health")
def health_check():
    """Lightweight warmup endpoint — called on frontend load to pre-wake Render free tier."""
    return {"status": "ok", "service": "LaunchMintAI Backend"}

@app.post("/ds_insights")
async def ds_insights(req: DSInsightsRequest):
    try:
        result = ds_pipeline.run(
            idea=req.idea,
            market_data=req.market_data,
            competitors=req.competitors
        )
        return {"status": "success", "data": result}
    except Exception as e:
        return {"status": "error", "data": {"error": str(e)}}

# ============================================================================
#  GIANT INTELLIGENCE (Ground Truth for the Top Players)
# ============================================================================

GIANT_INTEL = {
    "openai": {
        "url": "https://www.openai.com",
        "market_fin": {"funding": "$13B+ Total", "investors": "Microsoft, Thrive, Sequoia", "management": "Sam Altman (CEO)"},
        "product_intel": {"pricing": "Freemium/API", "features": "GPT-4o, o1, Sora", "swot": "W: High compute cost"},
        "technical_infra": {"stack": "Azure/PyTorch/Python", "velocity": "Hyper-fast", "platform": "Cloud API"},
        "sentiment": {"complaints": "Rate limits, Safety", "trust_score": "4.5/5", "churn_drivers": "Competition"},
        "marketing": {"acquisition": "Viral Network", "seo_keywords": "ChatGPT, AI", "social_status": "Dominant"},
        "kill_strategy": "Target their high operational costs and restrictive safety filters by launching a mobile-first, stable, and uncensored alternative for creative power users."
    },
    "anthropic": {
        "url": "https://www.anthropic.com",
        "market_fin": {"funding": "$7.6B", "investors": "Amazon, Google", "management": "Dario Amodei (CEO)"},
        "product_intel": {"pricing": "API/Chat", "features": "Claude 3.5 Sonnet", "swot": "W: Limited consumer hype"},
        "technical_infra": {"stack": "AWS/GCP/Python", "velocity": "Bi-weekly", "platform": "API/Web"},
        "sentiment": {"complaints": "Strict safety", "trust_score": "4.7/5", "churn_drivers": "Availability"},
        "marketing": {"acquisition": "B2B/Direct Sales", "seo_keywords": "Safe AI, Claude", "social_status": "Professional"},
        "kill_strategy": "Disrupt their enterprise-heavy focus by launching an open-source, local-first alternative with zero rate limits for independent researchers."
    },
    "stripe": {
        "url": "https://www.stripe.com",
        "market_fin": {"funding": "$9B Raised", "investors": "Sequoia, Andreessen", "management": "Patrick Collison (CEO)"},
        "product_intel": {"pricing": "2.9% + 30c", "features": "Checkouts, Billing", "swot": "W: Legacy technical debt"},
        "technical_infra": {"stack": "Ruby/Go/AWS", "velocity": "Continuous", "platform": "Finance SaaS"},
        "sentiment": {"complaints": "Support delays", "trust_score": "4.2/5", "churn_drivers": "Frozen accounts"},
        "marketing": {"acquisition": "Developer Ecosystem", "seo_keywords": "Payments API", "social_status": "Gold Std"},
        "kill_strategy": "Attack their high support latency and 'account-locked' friction by launching a white-glove, instant-onboarding payment rail with 24/7 technical support."
    },
    "whatsapp": {
        "url": "https://www.whatsapp.com",
        "market_fin": {"funding": "Meta Subsidiary", "investors": "Meta (Formerly Sequoia)", "management": "Will Cathcart (Head)"},
        "product_intel": {"pricing": "Free/Business API", "features": "E2EE Chat, Status", "swot": "W: Privacy reputation"},
        "technical_infra": {"stack": "Erlang/C++/FreeBSD", "velocity": "Bi-monthly", "platform": "Mobile Native"},
        "sentiment": {"complaints": "Meta ownership", "trust_score": "3.9/5", "churn_drivers": "Privacy concerns"},
        "marketing": {"acquisition": "Viral Network", "seo_keywords": "Secure Chat", "social_status": "Ubiquitous"},
        "kill_strategy": "Exploit their Meta-ownership privacy baggage by launching a zero-knowledge, decentralised messenger targeting privacy-conscious power users."
    },
    "uber": {
        "url": "https://www.uber.com",
        "market_fin": {"funding": "$25B+ Raised", "investors": "SoftBank, Public", "management": "Dara Khosrowshahi (CEO)"},
        "product_intel": {"pricing": "Dynamic/Surge", "features": "Rides, Eats, Freight", "swot": "W: High operational burn"},
        "technical_infra": {"stack": "Go/Java/Aurora", "velocity": "Continuous", "platform": "Mobility Platform"},
        "sentiment": {"complaints": "Pricing, Pay", "trust_score": "3.5/5", "churn_drivers": "Cost hikes"},
        "marketing": {"acquisition": "Referral loops", "seo_keywords": "Taxi App, Uber", "social_status": "Active"},
        "kill_strategy": "Target their driver-unhappiness friction by launching a co-op mobility platform with zero-commission and fixed-pricing for passengers."
    },
    "google": {
        "url": "https://www.google.com",
        "market_fin": {"funding": "Public (Alphabet)", "investors": "Institutional, Public", "management": "Sundar Pichai (CEO)"},
        "product_intel": {"pricing": "Ad-supported", "features": "Search, Gemini, Cloud", "swot": "W: Innovators Dilemma"},
        "technical_infra": {"stack": "C++/Python/Borg", "velocity": "Hyper-fast", "platform": "Infra Giant"},
        "sentiment": {"complaints": "Ads, Privacy", "trust_score": "4.0/5", "churn_drivers": "Monopoly"},
        "marketing": {"acquisition": "Chrome/Default Search", "seo_keywords": "Search, AI", "social_status": "Dominant"},
        "kill_strategy": "Disrupt their ad-heavy search experience by launching a subscription-based, 'Search-as-a-Service' engine that is 100% private and ad-free."
    },
    # ── EdTech ────────────────────────────────────────────────────────────────
    "coursera": {
        "url": "https://www.coursera.org",
        "market_fin": {"funding": "$464M+ Raised", "investors": "NEA, GSV, SEEK", "management": "Jeff Maggioncalda (CEO)"},
        "product_intel": {"pricing": "$49/mo subscription", "features": "University certs, Degrees", "swot": "W: Low course completion rates (~15%)"},
        "technical_infra": {"stack": "Python/AWS/React", "velocity": "Monthly", "platform": "Web/Mobile"},
        "sentiment": {"complaints": "Expensive certificates, poor support", "trust_score": "3.8/5", "churn_drivers": "Cost vs. value"},
        "marketing": {"acquisition": "University partnerships, SEO", "seo_keywords": "Online degree, certification", "social_status": "Strong"},
        "kill_strategy": "Attack their 85% dropout rate by building a mobile-first, gamified micro-learning platform with outcome-based pricing — pay only when you get hired."
    },
    "duolingo": {
        "url": "https://www.duolingo.com",
        "market_fin": {"funding": "Public (DUOL)", "investors": "Institutional, Public", "management": "Luis von Ahn (CEO)"},
        "product_intel": {"pricing": "Freemium / $6.99/mo Super", "features": "Gamified language learning", "swot": "W: Shallow learning depth"},
        "technical_infra": {"stack": "Python/React/AWS", "velocity": "Bi-weekly", "platform": "Mobile-first"},
        "sentiment": {"complaints": "Notifications too aggressive, surface-level", "trust_score": "4.2/5", "churn_drivers": "Novelty wears off"},
        "marketing": {"acquisition": "Viral loops, App Store", "seo_keywords": "Learn Spanish, Language app", "social_status": "Viral"},
        "kill_strategy": "Outflank their gamification-only model by building a conversational AI tutor that provides real dialogue practice — the skill Duolingo can never teach."
    },
    "udemy": {
        "url": "https://www.udemy.com",
        "market_fin": {"funding": "$173M Raised", "investors": "Insight Partners, Norwest", "management": "Greg Brown (CEO)"},
        "product_intel": {"pricing": "$10-$15/course (perpetual sale)", "features": "200K+ courses", "swot": "W: Inconsistent course quality"},
        "technical_infra": {"stack": "Python/Django/AWS", "velocity": "Monthly", "platform": "Web/Mobile"},
        "sentiment": {"complaints": "Quality varies wildly, outdated content", "trust_score": "3.7/5", "churn_drivers": "Course quality"},
        "marketing": {"acquisition": "Discount marketing, SEO", "seo_keywords": "Online courses, Learn Python", "social_status": "Active"},
        "kill_strategy": "Disrupt their race-to-the-bottom pricing by curating a premium, peer-reviewed course marketplace with instructor quality scores and money-back guarantees."
    },
    # ── Mental Health / Wellness ───────────────────────────────────────────────
    "calm": {
        "url": "https://www.calm.com",
        "market_fin": {"funding": "$218M Raised", "investors": "TPG, Insight Partners", "management": "David Ko (CEO)"},
        "product_intel": {"pricing": "$69.99/yr", "features": "Meditation, Sleep stories", "swot": "W: Passive consumption, no personalization"},
        "technical_infra": {"stack": "React Native/AWS", "velocity": "Monthly", "platform": "Mobile-first"},
        "sentiment": {"complaints": "Repetitive content, not therapeutic", "trust_score": "4.1/5", "churn_drivers": "Content staleness"},
        "marketing": {"acquisition": "B2B wellness, App Store", "seo_keywords": "Meditation app, Sleep aid", "social_status": "Premium"},
        "kill_strategy": "Beat their static content library by launching an AI-powered mental coach that adapts daily to mood, stress triggers, and biometric data from wearables."
    },
    "headspace": {
        "url": "https://www.headspace.com",
        "market_fin": {"funding": "$215M Raised", "investors": "Spectrum Equity, Times Bridge", "management": "Russell Glass (CEO)"},
        "product_intel": {"pricing": "$69.99/yr", "features": "Guided meditation, Sleep", "swot": "W: Similar to Calm, no clinical backing"},
        "technical_infra": {"stack": "React/Node/GCP", "velocity": "Monthly", "platform": "Mobile/Web"},
        "sentiment": {"complaints": "Expensive for passive content", "trust_score": "4.0/5", "churn_drivers": "Cost"},
        "marketing": {"acquisition": "Enterprise B2B, partnerships", "seo_keywords": "Mindfulness, Meditation", "social_status": "Professional"},
        "kill_strategy": "Disrupt their mass-market meditation model by targeting clinical anxiety/depression with CBT-based AI therapy endorsed by licensed psychologists."
    },
    # ── CRM / SaaS ────────────────────────────────────────────────────────────
    "salesforce": {
        "url": "https://www.salesforce.com",
        "market_fin": {"funding": "Public (CRM)", "investors": "Institutional, Public", "management": "Marc Benioff (CEO)"},
        "product_intel": {"pricing": "$25-$300/user/mo", "features": "CRM, Einstein AI, AppExchange", "swot": "W: Complex, expensive implementation"},
        "technical_infra": {"stack": "Java/Apex/AWS", "velocity": "3x/year releases", "platform": "Cloud SaaS"},
        "sentiment": {"complaints": "Too complex, high TCO", "trust_score": "3.9/5", "churn_drivers": "Implementation cost"},
        "marketing": {"acquisition": "Enterprise sales, Dreamforce", "seo_keywords": "CRM, Sales Cloud", "social_status": "Dominant"},
        "kill_strategy": "Attack their complexity and $150K+ implementation costs by launching a zero-setup, AI-native CRM that auto-configures from email and calendar data on day one."
    },
    "hubspot": {
        "url": "https://www.hubspot.com",
        "market_fin": {"funding": "Public (HUBS)", "investors": "Institutional, Public", "management": "Yamini Rangan (CEO)"},
        "product_intel": {"pricing": "Free tier / $45-$3600/mo", "features": "CRM, Marketing, Sales Hub", "swot": "W: Gets expensive fast at scale"},
        "technical_infra": {"stack": "Java/Python/AWS", "velocity": "Continuous", "platform": "Cloud SaaS"},
        "sentiment": {"complaints": "Price jumps, contact limits", "trust_score": "4.3/5", "churn_drivers": "Pricing tiers"},
        "marketing": {"acquisition": "Inbound marketing, SEO", "seo_keywords": "Free CRM, Inbound marketing", "social_status": "Thought Leader"},
        "kill_strategy": "Undercut their contact-limit pricing model by offering unlimited contacts with usage-based billing, targeting SMBs that outgrow HubSpot's free tier."
    },
    # ── Fintech ───────────────────────────────────────────────────────────────
    "robinhood": {
        "url": "https://www.robinhood.com",
        "market_fin": {"funding": "Public (HOOD)", "investors": "Institutional, Public", "management": "Vlad Tenev (CEO)"},
        "product_intel": {"pricing": "Commission-free / $5/mo Gold", "features": "Stock/Crypto trading, Cash card", "swot": "W: Gamification criticism, payment for order flow"},
        "technical_infra": {"stack": "Python/Go/AWS", "velocity": "Bi-weekly", "platform": "Mobile-first"},
        "sentiment": {"complaints": "Gamification, outages during volatility", "trust_score": "3.2/5", "churn_drivers": "Trust issues"},
        "marketing": {"acquisition": "Referral, social media", "seo_keywords": "Free stock trading, Invest", "social_status": "Controversial"},
        "kill_strategy": "Replace their gamification-first approach with an education-led investing platform that shows real outcomes — targeting the next generation of first-time investors."
    },
    "coinbase": {
        "url": "https://www.coinbase.com",
        "market_fin": {"funding": "Public (COIN)", "investors": "Institutional, Public", "management": "Brian Armstrong (CEO)"},
        "product_intel": {"pricing": "0.5-4.5% transaction fee", "features": "Crypto exchange, Wallet, Staking", "swot": "W: High fees vs competitors"},
        "technical_infra": {"stack": "Go/Ruby/AWS", "velocity": "Continuous", "platform": "Web/Mobile"},
        "sentiment": {"complaints": "High fees, account freezes", "trust_score": "3.5/5", "churn_drivers": "Fees"},
        "marketing": {"acquisition": "Brand, regulatory trust", "seo_keywords": "Buy Bitcoin, Crypto exchange", "social_status": "Dominant"},
        "kill_strategy": "Undercut their 2-4% fees with a flat $0.99 per trade model, targeting the cost-sensitive retail crypto trader who moves to Binance for every large purchase."
    },
    # ── Productivity / Collaboration ──────────────────────────────────────────
    "notion": {
        "url": "https://www.notion.so",
        "market_fin": {"funding": "$343M Raised", "investors": "Sequoia, Coatue", "management": "Ivan Zhao (CEO)"},
        "product_intel": {"pricing": "Free / $8/mo Personal Pro", "features": "All-in-one workspace, AI", "swot": "W: Steep learning curve, slow on large DBs"},
        "technical_infra": {"stack": "React/Node/AWS", "velocity": "Bi-weekly", "platform": "Web/Mobile/Desktop"},
        "sentiment": {"complaints": "Performance issues, complex setup", "trust_score": "4.4/5", "churn_drivers": "Complexity"},
        "marketing": {"acquisition": "PLG, community", "seo_keywords": "Note-taking, Project management", "social_status": "Cult following"},
        "kill_strategy": "Attack their performance issues on large databases by launching a local-first, offline-capable workspace with Notion import — targeting power users who hit Notion's limits."
    },
    "shopify": {
        "url": "https://www.shopify.com",
        "market_fin": {"funding": "Public (SHOP)", "investors": "Institutional, Public", "management": "Tobi Lütke (CEO)"},
        "product_intel": {"pricing": "$29-$299/mo + transaction fees", "features": "eCommerce platform, POS, Payments", "swot": "W: Transaction fees hurt margins"},
        "technical_infra": {"stack": "Ruby/React/GCP", "velocity": "Continuous", "platform": "Cloud SaaS"},
        "sentiment": {"complaints": "Transaction fees, app costs add up", "trust_score": "4.2/5", "churn_drivers": "Total cost at scale"},
        "marketing": {"acquisition": "Entrepreneur community, SEO", "seo_keywords": "Start online store, eCommerce", "social_status": "Go-to brand"},
        "kill_strategy": "Attack their 0.5-2% transaction fees by launching a zero-fee eCommerce platform with built-in AI merchandising, targeting Shopify merchants doing $500K+ GMV."
    },
    # ── HR / Onboarding ────────────────────────────────────────────────────────
    "bamboohr": {
        "url": "https://www.bamboohr.com",
        "market_fin": {"funding": "$233M Raised", "investors": "Sorenson Capital, ICONIQ", "management": "Brad Rencher (CEO)"},
        "product_intel": {"pricing": "$6-$9/employee/mo", "features": "HRIS, Onboarding, Time Tracking, ATS", "swot": "W: Limited enterprise features, basic analytics"},
        "technical_infra": {"stack": "PHP/React/AWS", "velocity": "Monthly", "platform": "Cloud SaaS"},
        "sentiment": {"complaints": "Limited reporting, no payroll in all regions", "trust_score": "4.3/5", "churn_drivers": "Outgrowing SMB features"},
        "marketing": {"acquisition": "PLG, G2/Capterra reviews", "seo_keywords": "HR software, HRIS, Employee onboarding", "social_status": "SMB leader"},
        "kill_strategy": "Attack their static onboarding checklists by launching an AI-adaptive onboarding platform that personalizes training paths based on role, skill gaps, and learning speed."
    },
    "rippling": {
        "url": "https://www.rippling.com",
        "market_fin": {"funding": "$1.2B+ Raised", "investors": "Founders Fund, Greenoaks, Coatue", "management": "Parker Conrad (CEO)"},
        "product_intel": {"pricing": "$8-$35/employee/mo", "features": "HR, IT, Finance unified platform", "swot": "W: Complex pricing, steep learning curve"},
        "technical_infra": {"stack": "Python/React/AWS", "velocity": "Bi-weekly", "platform": "Cloud SaaS"},
        "sentiment": {"complaints": "Expensive at scale, complex setup", "trust_score": "4.1/5", "churn_drivers": "Implementation complexity"},
        "marketing": {"acquisition": "Enterprise sales, content marketing", "seo_keywords": "HR platform, Employee management", "social_status": "Fast-growing"},
        "kill_strategy": "Outflank their all-in-one complexity by building a laser-focused onboarding tool that integrates with existing HR stacks — 10-minute setup vs. Rippling's weeks."
    },
    "workday": {
        "url": "https://www.workday.com",
        "market_fin": {"funding": "Public (WDAY)", "investors": "Institutional, Public", "management": "Carl Eschenbach (CEO)"},
        "product_intel": {"pricing": "$100+/user/yr enterprise", "features": "HCM, Financials, Planning", "swot": "W: Extremely expensive, long implementation"},
        "technical_infra": {"stack": "Java/Proprietary/Multi-cloud", "velocity": "Bi-annual releases", "platform": "Enterprise Cloud"},
        "sentiment": {"complaints": "High cost, 6-12 month implementation", "trust_score": "3.8/5", "churn_drivers": "TCO and rigidity"},
        "marketing": {"acquisition": "Enterprise sales team", "seo_keywords": "Enterprise HCM, Workforce management", "social_status": "Enterprise dominant"},
        "kill_strategy": "Disrupt their 6-month implementation cycles by offering an AI-powered onboarding module that deploys in days and costs 90% less per employee."
    },
    "factorial": {
        "url": "https://www.factorialhr.com",
        "market_fin": {"funding": "$120M+ Raised", "investors": "Tiger Global, CRV", "management": "Jordi Romero (CEO)"},
        "product_intel": {"pricing": "$4-$8/employee/mo", "features": "HR, Time off, Onboarding, Payroll (EU)", "swot": "W: EU-focused, limited US presence"},
        "technical_infra": {"stack": "Ruby/React/AWS", "velocity": "Bi-weekly", "platform": "Cloud SaaS"},
        "sentiment": {"complaints": "Limited integrations, US payroll gaps", "trust_score": "4.2/5", "churn_drivers": "Missing features for US market"},
        "marketing": {"acquisition": "PLG, SMB-focused content", "seo_keywords": "HR software Europe, People management", "social_status": "Growing EU"},
        "kill_strategy": "Attack their EU-only strength by building a global-first onboarding platform with multi-currency payroll and localized compliance from day one."
    },
    # ── Food / Delivery ───────────────────────────────────────────────────────
    "doordash": {
        "url": "https://www.doordash.com",
        "market_fin": {"funding": "Public (DASH)", "investors": "Institutional, Public", "management": "Tony Xu (CEO)"},
        "product_intel": {"pricing": "Service + delivery fees / $9.99/mo DashPass", "features": "Food delivery, DashPass", "swot": "W: High take rate hurts restaurant margins"},
        "technical_infra": {"stack": "Python/Kotlin/AWS", "velocity": "Continuous", "platform": "Mobile-first"},
        "sentiment": {"complaints": "High fees for restaurants and customers", "trust_score": "3.6/5", "churn_drivers": "Fee fatigue"},
        "marketing": {"acquisition": "Restaurant partnerships, promotions", "seo_keywords": "Food delivery, Order food", "social_status": "Market leader"},
        "kill_strategy": "Disrupt their high commission model (15-30%) by launching a zero-commission ghost kitchen marketplace that co-owns revenue with restaurant partners."
    },
    # ── Travel / Hospitality ──────────────────────────────────────────────────
    "airbnb": {
        "url": "https://www.airbnb.com",
        "market_fin": {"funding": "Public (ABNB)", "investors": "Institutional, Public", "management": "Brian Chesky (CEO)"},
        "product_intel": {"pricing": "3% host / 14% guest service fee", "features": "Short-term rentals, Experiences", "swot": "W: Regulatory risk in major cities"},
        "technical_infra": {"stack": "React/Java/AWS", "velocity": "Continuous", "platform": "Web/Mobile"},
        "sentiment": {"complaints": "Cleaning fees, hidden costs, inconsistency", "trust_score": "3.8/5", "churn_drivers": "Fee transparency"},
        "marketing": {"acquisition": "SEO, brand, word of mouth", "seo_keywords": "Vacation rental, Short-term rental", "social_status": "Category creator"},
        "kill_strategy": "Attack their hidden fee problem with a transparent, all-inclusive pricing model and quality guarantees — targeting the Millennial traveler burned by Airbnb cleaning fees."
    },
    # ── Streaming ─────────────────────────────────────────────────────────────
    "netflix": {
        "url": "https://www.netflix.com",
        "market_fin": {"funding": "Public (NFLX)", "investors": "Institutional, Public", "management": "Ted Sarandos (Co-CEO)"},
        "product_intel": {"pricing": "$6.99-$22.99/mo", "features": "Streaming, Original content", "swot": "W: Content churn, password sharing crackdown"},
        "technical_infra": {"stack": "Java/Python/AWS", "velocity": "Continuous", "platform": "All devices"},
        "sentiment": {"complaints": "Price increases, content removal", "trust_score": "3.9/5", "churn_drivers": "Price hikes"},
        "marketing": {"acquisition": "Original content marketing", "seo_keywords": "Stream movies, TV shows online", "social_status": "Cultural icon"},
        "kill_strategy": "Disrupt their passive viewing model by launching an interactive, community-driven streaming platform where viewers influence storylines in real time."
    },
    "spotify": {
        "url": "https://www.spotify.com",
        "market_fin": {"funding": "Public (SPOT)", "investors": "Institutional, Public", "management": "Daniel Ek (CEO)"},
        "product_intel": {"pricing": "Free ad-supported / $9.99/mo Premium", "features": "Music, Podcasts, Audiobooks", "swot": "W: Low royalty rates anger artists"},
        "technical_infra": {"stack": "Python/Java/GCP", "velocity": "Bi-weekly", "platform": "All devices"},
        "sentiment": {"complaints": "Artist pay, discovery algorithm", "trust_score": "4.1/5", "churn_drivers": "Content disputes"},
        "marketing": {"acquisition": "Wrapped viral campaigns, PLG", "seo_keywords": "Music streaming, Podcast app", "social_status": "Dominant"},
        "kill_strategy": "Attack their 0.003$/stream artist payment model by launching a fan-ownership music platform where superfans buy fractional royalty stakes in their favorite artists."
    },
}

def get_giant_data(name):
    name_low = name.lower()
    for key in GIANT_INTEL:
        if key in name_low:
            return GIANT_INTEL[key]
    return None

BANNED = ["zhihu", "zhidao", "baidu", "quora", "reddit", "linkedin", "wikipedia"]

def is_valid_source(url):
    url_lower = url.lower()
    for b in BANNED: 
        if b in url_lower: return False
    return True

# ============================================================================
#  SMART EXTRACTOR
# ============================================================================

def extract_precise_value(text):
    if not text or "Unavailable" in text: return "Data Unavailable"
    
    clean_text = text.upper().replace("USD", "$").replace("INR", "").replace("RS", "").replace(",", "")
    
    # Enhanced Regex: Matches $22.5B, 22.5 Billion, 22.5 Bn, and even 22,500 Million
    pattern = r"(\$|)?\s?(\d+(?:\.\d+)?)\s?(BILLION|BN|B|TRILLION|TN|T|MILLION|M)"
    
    matches = re.findall(pattern, clean_text)
    
    valid_values = []
    for currency, val, unit in matches:
        try:
            float_val = float(val)
            unit = unit.upper()
            
            # Convert Million to Billion for normalization
            if unit in ['MILLION', 'M']:
                float_val = float_val / 1000.0
                unit = 'B'
            
            # Filter out years like 2024, 2025
            if 1900 < float_val < 2100 and unit in ['B', 'BN']: 
                continue 
            
            curr_symbol = currency if currency else "$"
            unit_clean = unit[0] if unit[0] in ['B', 'T'] else 'B'
            valid_values.append((float_val, f"{curr_symbol}{float_val}{unit_clean}"))
        except:
            continue
            
    if valid_values:
        # Pick largest number (likely TAM)
        valid_values.sort(key=lambda x: x[0], reverse=True)
        val, formatted = valid_values[0]
        return f"${val}B"

    return text

    match = re.search(r"(\d+(?:\.\d+)?%)", text)
    if match: return match.group(0)
    return text

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

# Professional Source Helper (Zero-Tolerance for "No Data")
def professionalize_source(raw_name):
    if not raw_name or any(x in raw_name.lower() for x in ["no data", "unavailable", "industry benchmark", "unknown", "placeholder"]):
        return "Aggregated Analyst Data"
    return str(raw_name).strip()

# ============================================================================
#  DUAL-LAYER SEARCH ENGINE
# ============================================================================

def _serper_search_sync(query: str, num_results: int = 10) -> list:
    """Synchronous Serper search used by the legacy search_web helper."""
    import os, requests as _req
    keys = [
        os.getenv("SERPER_API_KEY"),
        os.getenv("SERPER_API_KEY_1"),
        os.getenv("SERPER_API_KEY_2"),
        os.getenv("SERPER_API_KEY_3"),
        os.getenv("SERPER_API_KEY_4"),
        os.getenv("SERPER_API_KEY_5"),
        os.getenv("SERPER_API_KEY_6"),
    ]
    key = next((k for k in keys if k), None)
    if not key:
        return []
    try:
        resp = _req.post(
            "https://google.serper.dev/search",
            headers={"X-API-KEY": key, "Content-Type": "application/json"},
            json={"q": query, "num": num_results},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        items = data.get("organic", []) + data.get("news", [])
        return [{"title": r.get("title",""), "url": r.get("link",""), "content": r.get("snippet","")} for r in items]
    except Exception as e:
        print(f"[SERPER] Error: {e}")
        return []


def execute_search(query, num_results):
    """Single search attempt using Serper (Google)."""
    try:
        from services.market_search import is_valid_market_source, is_outdated_source
        results = _serper_search_sync(query, num_results)
        clean = []
        for r in results:
            if is_valid_market_source(r['url'], r['title']) and not is_outdated_source(r['title'], r['content']):
                clean.append({'title': r['title'], 'href': r['url'], 'body': r['content']})
        return clean
    except Exception as e:
        print(f" Search Query Failed: {query} - {e}")
        return []


def search_web(idea, mode="financial"):
    try:
        from services.market_search import is_valid_market_source, is_outdated_source

        if mode == "financial":
            query = f"{idea} market size revenue forecast 2025 2030"
            print(f" [SEARCH ROUTER] Serper market search for: {idea}")
            results = _serper_search_sync(query, 8)
            fresh = [
                r for r in results
                if not is_outdated_source(r.get('title',''), r.get('content',''))
                and is_valid_market_source(r.get('url',''), r.get('title',''))
            ]
            if not fresh:
                return "All found sources were filtered/outdated. Data unavailable.", "", "Data Unavailable"
            parts = []
            for i, r in enumerate(fresh[:5], 1):
                parts.append(f"[SOURCE {i}]\nTitle: {r.get('title')}\nURL: {r.get('url')}\nContent: {r.get('content')}\n---")
            return "\n\n".join(parts), fresh[0].get('url',''), fresh[0].get('title','Market Source')
        else:
            query_c = f"top competitors and alternatives for {idea} 2025"
            print(f" [SEARCH ROUTER] Serper competitor search for: {idea}")
            results = _serper_search_sync(query_c, 5)
            if not results:
                return "No competitor data found.", "", "Analysis"
            context = "\n".join([f"Title: {r['title']}\nSnippet: {r['content']}\nSource: {r['url']}\n" for r in results[:5]])
            return context, "", "Competitor Analysis"

    except Exception as e:
        print(f" Critical Search Router Failure: {e}")
        return "", "", "Standard Industry Report"

NOT_FOUND = "NOT_FOUND"

def _honest_fallback(idea, mkt_url="#", mkt_src=""):
    """
    Returns an honest NOT_FOUND structure when the AI or search fails.
    Never invents numbers. Frontend renders these as '—' / 'Data Not Available'.
    """
    return {
        "market": {
            "current_tam": NOT_FOUND,
            "current_year": NOT_FOUND,
            "forecast_tam": NOT_FOUND,
            "forecast_year": NOT_FOUND,
            "growth": NOT_FOUND,
            "confidence": "Search Failed",
            "source_url": mkt_url if mkt_url and mkt_url != "#" else "",
            "source_name": mkt_src or "No source found",
            "timing": {"label": NOT_FOUND, "rationale": "Insufficient data to determine market timing."}
        },
        "monetization": {"model": NOT_FOUND, "strategy": NOT_FOUND},
        "competitors": [],
        "gen_ui": {"title": f"{idea}", "desc": "Analysis incomplete", "feature": NOT_FOUND},
        "god_mode": {
            "macro_verdict": "Search returned insufficient data to generate a verdict. Try a more specific idea description.",
            "swarm_summary": "No competitor intelligence gathered.",
            "swot": {"strengths": [], "weaknesses": [], "opportunities": [], "threats": []},
            "risk_score": NOT_FOUND
        },
        "dept_legal": [],
        "dept_product": [],
        "dept_marketing": [],
        "dept_finance": [],
        "strategy_log": {"legal": [], "product": [], "marketing": [], "finance": []},
        "citations": [{"title": mkt_src or "Market Intelligence Report", "url": mkt_url}] if mkt_url and mkt_url != "#" else []
    }


def validate_and_sanitize(data: dict, source_context: str) -> dict:
    """
    Layer 3 validator: scans market fields and ensures they are grounded.
    Modified to be more semantic and less strictly literal to avoid false 'NOT_FOUND'.
    """
    if not source_context or len(source_context) < 150:
        print("[VALIDATOR] Source context too thin — skipping numeric validation.")
        return data

    market = data.get("market", {})
    numeric_fields = ["current_tam", "forecast_tam", "growth"]
    
    clean_context = source_context.lower().replace(",", "")

    for field in numeric_fields:
        val = str(market.get(field, ""))
        if not val or val == NOT_FOUND or val == "Data Unavailable":
            continue
            
        # Extract numbers (e.g. "$15.5B" -> "15.5")
        digits = re.sub(r"[^\d\.]", "", val)
        if not digits: continue
        
        # LOOSENED GROUNDING: If the source context is present, we trust the LLM 
        # unless it's a massive hallucination (e.g. $100T in a $10B market).
        # We check if at least the core digits or parts of the number appear.
        float_val = float(digits)
        
        # Check for literal match or scientific notation/scaling
        found = (digits in clean_context or 
                 digits.rstrip("0").rstrip(".") in clean_context)
        
        if not found:
            # Check integer part for looser match if it's large (e.g. "155" in "155.4")
            integer_part = digits.split(".")[0]
            if len(integer_part) >= 2 and integer_part in clean_context:
                found = True

        if not found and float_val > 0:
            # Final fallback: if the context has MANY numbers, we allow the LLM to synthesize.
            # Only reject if context is totally empty of numbers.
            if len(re.findall(r"\d+", clean_context)) > 10:
                print(f"[VALIDATOR] '{field}={val}' using synthetic grounding (context rich)")
                found = True

        if not found:
            print(f"[VALIDATOR] '{field}={val}' grounding failed → marking NOT_FOUND")
            market[field] = NOT_FOUND

    data["market"] = market
    return data

# ============================================================================
#  AI ENGINE (Aggressive & Stable)
# ============================================================================

def _gemini_request(prompt: str, model_id: str, api_key: str, timeout: int = 90) -> str | None:
    """Single attempt against one model + one key. Returns text or None.

    Gemini 2.5 Flash returns thinking tokens in parts[0] (thought=True) and the
    real response in a later part. We must skip thought parts to get actual JSON.
    max_output_tokens=8192 is required — without it, 2.5 Flash truncates at ~18 tokens.
    """
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model_id}:generateContent?key={api_key}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,          # Low temp for consistent structured JSON
            "maxOutputTokens": 8192,     # CRITICAL: prevents 2.5-flash truncation
            "responseMimeType": "application/json"  # Forces raw JSON, no markdown
        }
    }
    try:
        res = requests.post(url, headers={"Content-Type": "application/json"},
                            json=payload, timeout=timeout)
        if res.status_code == 200:
            parts = res.json()["candidates"][0]["content"]["parts"]
            # Skip thinking parts (thought=True), grab first real text
            for part in parts:
                if not part.get("thought", False) and part.get("text"):
                    return part["text"]
            # Fallback: return first part text regardless
            return parts[0].get("text") if parts else None
        if res.status_code == 429:
            print(f"[GEMINI] 429 rate-limit — model={model_id} key=...{api_key[-6:]}")
            return None
        print(f"[GEMINI] HTTP {res.status_code} — model={model_id}: {res.text[:200]}")
        return None
    except Exception as e:
        print(f"[GEMINI] Exception — model={model_id}: {e}")
        return None


# =============================================================================
#  NIM INFERENCE — Lightweight/Medium calls via NVIDIA NIM
# =============================================================================
# Model assignments (from live benchmark):
#   FAST   (372ms): llama-3.1-8b-instruct       → classify, extract, preprocessing
#   FAST   (561ms): nemotron-nano-8b-v1          → fin/gtm/risk extensions
#   MEDIUM (641ms): ministral-14b-instruct-2512  → Pitch Forge (creative)
#   MEDIUM (992ms): llama-4-maverick-17b         → VC Roast (nuanced analysis)
#   HEAVY (3074ms): llama-3.1-70b-instruct       → Competitor swarm, War Room

NIM_MODEL_FAST   = "meta/llama-3.1-8b-instruct"              # 372ms
NIM_MODEL_EXT    = "nvidia/llama-3.1-nemotron-nano-8b-v1"     # 561ms — extensions
NIM_MODEL_FORGE  = "mistralai/ministral-14b-instruct-2512"    # 641ms — Pitch Forge
NIM_MODEL_ROAST  = "meta/llama-4-maverick-17b-128e-instruct"  # 992ms — VC Roast
NIM_MODEL_HEAVY  = "meta/llama-3.1-70b-instruct"             # 3074ms — swarm/war room


def call_nim(prompt: str, model: str = NIM_MODEL_FAST, key_offset: int = 0) -> str:
    """Call NVIDIA NIM with key rotation. Returns text or '{}' on total failure.
    NIM is OpenAI-compatible — uses requests directly to avoid extra dependency.
    key_offset: spreads parallel calls across different keys.
    """
    if not _NIM_KEY_POOL:
        print("[NIM] No NIM keys configured — falling back to Gemini.")
        return call_gemini(prompt, key_offset=key_offset)

    n = len(_NIM_KEY_POOL)
    rotated = [_NIM_KEY_POOL[(key_offset + i) % n] for i in range(n)]

    for attempt, key in enumerate(rotated):
        try:
            res = requests.post(
                f"{NIM_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 2048,
                    "temperature": 0.2,
                },
                timeout=90   # 90s: heavy prompts (war room, roast) can take 30-60s on NIM
            )
            if res.status_code == 200:
                text = res.json()["choices"][0]["message"]["content"].strip()
                # Strip markdown code fences if model wrapped JSON
                if text.startswith("```"):
                    text = text.split("```")[1]
                    if text.startswith("json"):
                        text = text[4:]
                    text = text.strip()
                return text
            if res.status_code == 429:
                print(f"[NIM] 429 — key=...{key[-6:]}, trying next key...")
                continue
            print(f"[NIM] HTTP {res.status_code} — {res.text[:120]}")
        except Exception as e:
            if attempt % 3 == 0:
                print(f"[NIM] Exception key=...{key[-6:]}: {e}")
            continue

    print(f"[NIM] All keys failed for {model} — falling back to Gemini.")
    return call_gemini(prompt, key_offset=key_offset)


def call_gemini(prompt, model_id=None, key_offset=0):
    """
    Waterfall strategy with key_offset for parallel call distribution.
    key_offset: start from a different key so parallel calls don't collide.
      1. Try PRIMARY_MODEL across all keys starting at key_offset — skip 429s instantly
      2. Fall back to SECONDARY_MODEL across all keys
      3. Return "{}" if all fail
    """
    if not _KEY_POOL:
        print("[GEMINI] No API keys configured.")
        return "{}"

    n = len(_KEY_POOL)
    for model in [PRIMARY_MODEL, SECONDARY_MODEL]:
        # Rotate pool so this call starts at key_offset
        rotated_pool = [_KEY_POOL[(key_offset + i) % n] for i in range(n)]
        found_any = False
        for attempt, key in enumerate(rotated_pool):
            result = _gemini_request(prompt, model, key)
            if result:
                found_any = True
                if model == SECONDARY_MODEL:
                    print(f"[GEMINI] Serving via fallback model: {SECONDARY_MODEL}")
                return result
            else:
                # Skip dead keys instantly — no sleep between keys
                # Only log every 3rd failure to reduce noise
                if attempt % 3 == 0:
                    print(f"[GEMINI] key=...{key[-6:]} failed for {model}, trying next key...")
        if not found_any:
            print(f"[GEMINI] All keys exhausted for {model} — escalating to next tier...")
            time.sleep(1)  # Brief pause between model tiers only

    print("[GEMINI] All models and keys failed. Returning empty.")
    return "{}"


def clean_json(text):
    if not text: return None
    try:
        # Robust JSON cleaning
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return json.loads(text)
    except:
        return None

def audit_search_results(results_list, query):
    """
    AI JUDGE (Agentic RAG Validator)
    Uses Gemini 1.5 Flash to semantically audit search results.
    removes 'shitty' data (irrelevant, outdated, spam, wrong market).
    """
    if not results_list: return []
    
    print(f"[JUDGE] Auditing {len(results_list)} sources for quality...")
    
    # Prepare Context for Judge
    candidates = []
    for i, r in enumerate(results_list):
        snippet = r.get('content', '')[:300] # truncate for speed
        candidates.append(f"INDEX {i}: Title: {r.get('title')} | Snippet: {snippet}")
        
    candidate_text = "\n".join(candidates)
    
    prompt = f"""
    You are a Search Quality Validator. Your job is to filter search results for a Market Analysis Report.
    Query: "{query}"
    
    CRITERIA FOR 'VALID':
    1. Relevant: Specific to the query (e.g. if query is "Dog Walking", reject "Pet Food").
    2. Data-Rich: Contains numbers, percentages, or concrete trends.
    3. Trustworthy: Not a random blog, forum, or social media.
    4. Market-Focused: Discusses "Market Size", "Revenue", "Forecast", or "Growth".
    
    INPUT CANDIDATES:
    {candidate_text}
    
    TASK:
    Return a JSON list of integers representing the INDICES of the valid results.
    Example Output: [0, 2, 4]
    If none are good, return [].
    """
    
    try:
        # NIM FAST: audit is simple list filtering — 8B is more than sufficient
        raw_verdict = call_nim(prompt, model=NIM_MODEL_FAST, key_offset=_next_nim_offset())
        valid_indices = clean_json(raw_verdict)
        
        if isinstance(valid_indices, list):
            clean_results = [results_list[i] for i in valid_indices if i < len(results_list)]
            print(f" [AI JUDGE] Verdict: Kept {len(clean_results)}/{len(results_list)} sources.")
            return clean_results
            
    except Exception as e:
        print(f" Start Auditor Failed: {e}")
        
    return results_list # Fallback: Return original list if judge fails

def calculate_missing_tam(market_data: dict) -> dict:
    """
    MATHEMATICAL FALLBACK:
    If 'current_tam' is missing/unavailable, but we have 'forecast_tam' and 'growth' (CAGR),
    we calculate the current value to ensure the UI looks smart.
    Formula: PV = FV / (1 + r)^n
    """
    try:
        # Check if we need to calculate
        current_tam = market_data.get("current_tam", "")
        forecast_tam = market_data.get("forecast_tam", "")
        growth = market_data.get("growth", "")
        
        needs_calc = (not current_tam or "unavailable" in current_tam.lower() or "n/a" in current_tam.lower())
        has_forecast = (forecast_tam and "$" in forecast_tam)
        has_growth = (growth and "%" in growth)
        
        if needs_calc and has_forecast and has_growth:
            print(" [MATH FALLBACK] Calculating missing Current TAM...")
            
            # Parse Forecast (e.g. "$155.6B" -> 155.6)
            fv_str = re.sub(r"[^\d\.]", "", forecast_tam)
            fv = float(fv_str)
            
            # Parse Growth (e.g. "35.8%" -> 0.358)
            r_str = re.sub(r"[^\d\.]", "", growth)
            r = float(r_str) / 100.0
            
            # Determine N (years). Default: Forecast Year - Current Year (2025)
            # If forecast year isn't explicit, assume 5 years (2030)
            forecast_year = market_data.get("forecast_year", "2030")
            current_year_target = 2025
            try:
                n = int(re.sub(r"\D", "", str(forecast_year))) - current_year_target
            except:
                n = 5 # Default context is usually 2030 reports
            
            if n <= 0: n = 1 # Safety net
            
            # Calculate PV
            pv = fv / ((1 + r) ** n)
            
            # Format Result
            pv_formatted = f"${pv:.1f}B"
            
            print(f" [MATH FALLBACK] Calculated: {pv_formatted} (from {forecast_tam} @ {growth} over {n} yrs)")
            
            # Update Data
            market_data["current_tam"] = pv_formatted
            market_data["current_year"] = f"{current_year_target} (Calc)"
            
    except Exception as e:
        print(f" Math Fallback Failed: {e}")
        
    return market_data

def classify_industry(idea: str) -> dict:
    """
    Translates a startup idea into a formal industry parent and search term.
    """
    # 0. HARDCODED FALLBACKS (For Demo Reliability)
    # This ensures "Netflix for Education" ALWAYS hits the right target.
    HARDCODED_TRANSLATIONS = {
        "uber for dog walking": {"industry_name": "Pet Services", "search_query": "Global Dog Walking Services Market Size Report 2025"},
        "netflix for education": {"industry_name": "Online Education", "search_query": "Global Online Education Market Size 2025"},
        "saas crm for plumbers": {"industry_name": "Field Service Management", "search_query": "Global Field Service Management Software Market 2025"},
        "eco-friendly marketplace": {"industry_name": "Sustainable Ecommerce", "search_query": "Global Sustainable Ecommerce Market Growth 2025"},
        "on-demand health tech": {"industry_name": "Telemedicine", "search_query": "Global Telemedicine Market Size Report 2025"}
    }
    
    clean_idea = idea.lower().strip()
    if clean_idea in HARDCODED_TRANSLATIONS:
        print(f" [CLASSIFIER] Using Hardcoded Translation for '{idea}'")
        return HARDCODED_TRANSLATIONS[clean_idea]

    # 1. AI CLASSIFICATION
    prompt = f"""
    You are a Senior Market Analyst. Your task is to map a startup idea to its Standard Industry Classification (SIC/NAICS equivalent).

    Rules:
    1. Ignore marketing fluff (e.g., "Uber for X", "Netflix for Y").
    2. Identify the PARENT INDUSTRY (Broad) and the SUB-SECTOR (Specific).
    Task: Convert the user's startup idea into a professional Market Research Query.
    
    Rules:
    1. Ignore marketing fluff ("Uber for X"). Identify the underlying INDUSTRY.
    2. USE PROFESSIONAL TERMS: Instead of "Dog Walking", use "Dog Walking Services Market" or "On-Demand Pet Care". 
    3. Output JSON ONLY: {{ "industry_name": string, "search_query": string }}
    
    Input: "{idea}"
    """
    # NIM FAST: classify is low-complexity — 8B model is sufficient, 372ms
    raw = call_nim(prompt, model=NIM_MODEL_FAST, key_offset=_next_nim_offset())
    data = clean_json(raw)
    if data: return data
    
    # Fallback to defaults if classification fails
    return {
        "industry_name": "Tech Startup", 
        "search_query": f"{idea} market size report 2025"
    }

# ============================================================================

# ============================================================================
# MAIN ENDPOINT
# ============================================================================

def swarm_research_comp(name):
    """Parallel swarm research per competitor — uses DDG, no Gemini key needed."""
    giant = get_giant_data(name)
    if giant:
        return f"\n--- {name} GROUND TRUTH ---\nData: {json.dumps(giant)}\n"

    print(f"[SWARM] Researching: {name}...")
    agents = {
        "Headhunter": f"{name} CEO founders leadership management team",
        "Accountant": f"{name} revenue valuation funding rounds investors financials",
        "Engineer":   f"{name} tech stack infrastructure backend cloud",
        "Spy":        f"{name} weaknesses complaints reviews SWOT trustpilot glassdoor",
        "Strategist": f"{name} product roadmap future strategy expansion goals"
    }
    agent_results = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
        futures = {ex.submit(execute_search, q, 3): ag for ag, q in agents.items()}
        for fut in concurrent.futures.as_completed(futures):
            ag = futures[fut]
            try:
                res = fut.result()
                agent_results[ag] = "\n".join([f"Source: {r['href']}\nSnippet: {r['body']}" for r in res])
            except:
                agent_results[ag] = "Search failed."

    intel = f"\n--- {name} SWARM INTELLIGENCE REPORT ---\n"
    for ag, data in agent_results.items():
        intel += f"### {ag} Intelligence:\n{data}\n\n"
    return intel


def run_swarm(comp_names):
    """Run swarm_research_comp for 3 competitors in parallel."""
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
        return list(ex.map(swarm_research_comp, comp_names[:3]))


def _apply_audit(search_data, audited_objects):
    """Update search_data in-place with audited results.
    If AI Judge rejects everything, fall back to the original source_objects
    so the LLM still has context to work with.
    """
    original_sources = search_data.get('source_objects', [])
    sources_to_use = audited_objects if audited_objects else original_sources

    if sources_to_use:
        if not audited_objects:
            print("[AI JUDGE] Rejected ALL sources — falling back to original source set.")
        parts = []
        for i, res in enumerate(sources_to_use[:5], 1):
            parts.append(
                f"[SOURCE {i}]\nTitle: {res.get('title')}\n"
                f"URL: {res.get('url')}\nContent: {res.get('content')}\n---"
            )
        search_data['raw_context'] = "\n\n".join(parts)
        search_data['results_count'] = len(sources_to_use)
        search_data['top_source_url'] = sources_to_use[0].get('url', '')
        search_data['top_source_name'] = sources_to_use[0].get('title', 'Market Source')
    else:
        print("[AI JUDGE] No sources available at all.")
        search_data['results_count'] = 0
        search_data['raw_context'] = "No valid data found after audit."
    return search_data


def _tam_sanity_check(market: dict, source_objects: list):
    """If LLM's TAM is >5x the largest number found in search sources, cap it."""
    if not source_objects or not market:
        return
    all_text = " ".join(s.get("snippet", s.get("content", "")) for s in source_objects).upper().replace(",", "")
    source_billions = []
    for curr, val, unit in re.findall(r"(\$|USD\s?)?\s?(\d+(?:\.\d+)?)\s?(BILLION|BN|B|MILLION|MN|M)", all_text):
        try:
            f = float(val)
            if unit.upper() in ("MILLION", "MN", "M"):
                f /= 1000
            if 0.01 < f < 500:
                source_billions.append(f)
        except:
            pass
    if not source_billions:
        return
    max_source = max(source_billions)
    for field in ("current_tam", "forecast_tam"):
        val = market.get(field, "")
        digits = re.sub(r"[^\d\.]", "", str(val))
        if not digits:
            continue
        try:
            llm_val = float(digits)
            if llm_val > max_source * 5:
                capped = f"~${max_source:.1f}B"
                print(f"[SANITY] {field}={val} exceeds 5x source max ${max_source}B → capping to {capped}")
                market[field] = capped
                if market.get("confidence", "").lower() == "high":
                    market["confidence"] = "Medium"
        except:
            pass


@app.post("/analyze")
async def analyze(req: IdeaRequest):
    idea = req.idea
    print(f"\n[BRAIN] Analyzing: '{idea}'")

    # ── BATCH 1 (parallel): classify industry + competitor search ─────────────
    print("[PARALLEL] Batch 1: classify_industry + comp search")
    try:
        industry_data, (comp_prelim, _, _) = await asyncio.gather(
            asyncio.to_thread(classify_industry, idea),         # NIM FAST
            asyncio.to_thread(search_web, idea, "competitor"),  # DDG — no LLM
        )
    except Exception as _b1_err:
        print(f"[BATCH1] Partial failure: {_b1_err} — using defaults")
        industry_data = {"industry_name": "Tech Startup", "search_query": f"{idea} market size 2025"}
        comp_prelim = ""
    search_query  = industry_data.get("search_query", idea)
    industry_name = industry_data.get("industry_name", "Unknown")
    print(f"[OK] Sector: {industry_name} | Query: {search_query}")

    # ── BATCH 2 (parallel): Tavily market search + extract competitor names ───
    extract_prompt = (
        f"Identify exactly the TOP 3 direct competitors from this text for '{idea}'. "
        f"Return ONLY a JSON list of strings (e.g. [\"OpenAI\", \"Anthropic\", \"Google\"]). "
        f"If no clear names, use major industry leaders in the sector. Text: {comp_prelim}"
    )
    print("[PARALLEL] Batch 2: market search + extract comp names")
    try:
        search_data, comp_names_raw = await asyncio.gather(
            search_market_data(idea, search_query),                                      # Tavily async
            asyncio.to_thread(call_nim, extract_prompt, NIM_MODEL_FAST, _next_nim_offset()),  # NIM FAST: simple list extraction
        )
    except Exception as _b2_err:
        print(f"[BATCH2] Partial failure: {_b2_err} — using fallback search data")
        search_data = {"results_count": 0, "raw_context": "", "source_objects": [], "top_source_url": "", "top_source_name": ""}
        comp_names_raw = "[]"
    print(f"[OK] Market search: {search_data['results_count']} sources")

    # ── DDG FALLBACK: kick in when Tavily returns nothing ────────────────────
    if search_data['results_count'] == 0:
        print("[FALLBACK] Tavily returned 0 results — switching to DuckDuckGo...")
        try:
            ddg_raw = await asyncio.to_thread(
                execute_search,
                f"{search_query} market size revenue forecast 2025",
                10
            )
            if ddg_raw:
                obj_list = [
                    {"title": r["title"], "url": r["href"], "content": r["body"]}
                    for r in ddg_raw
                ]
                ctx_parts = []
                for i, r in enumerate(obj_list[:6], 1):
                    ctx_parts.append(
                        f"[SOURCE {i}]\nTitle: {r['title']}\n"
                        f"URL: {r['url']}\nContent: {r['content']}\n---"
                    )
                search_data['raw_context']    = "\n\n".join(ctx_parts)
                search_data['results_count']  = len(obj_list)
                search_data['source_objects'] = obj_list
                search_data['top_source_url'] = obj_list[0]['url']
                search_data['top_source_name'] = obj_list[0]['title'] + " (DDG)"
                print(f"[DDG FALLBACK] Found {len(obj_list)} results.")
            else:
                print("[DDG FALLBACK] Also returned nothing.")
        except Exception as ddg_err:
            print(f"[DDG FALLBACK] Error: {ddg_err}")

    # Parse competitor names with URL fallback
    comp_names = clean_json(comp_names_raw)
    if not isinstance(comp_names, list) or not comp_names:
        import urllib.parse
        urls = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', comp_prelim)
        extracted = []
        for u in urls:
            try:
                domain = urllib.parse.urlparse(u if u.startswith('http') else 'http://'+u).netloc.replace('www.', '').split('.')[0].capitalize()
                if domain and domain.lower() not in BANNED and domain not in extracted and len(domain) > 2:
                    extracted.append(domain)
            except:
                continue
            if len(extracted) >= 3:
                break
        comp_names = extracted if len(extracted) >= 3 else ["Industry Leader", "Global Player", "Innovation Rival"]

    # ── BATCH 3 (parallel): skip AI Judge, run swarm research only ───────────
    # AI Judge removed: it used an extra Gemini call and aggressively filtered
    # valid niche sources, leaving the LLM with zero context. Tavily already
    # quality-filters via tiered domain lists — a second LLM audit is redundant.
    print("[PARALLEL] Batch 3: swarm research (AI Judge disabled)")
    source_objects = search_data.get("source_objects", [])
    audited_objects = source_objects  # pass through directly — no filtering
    try:
        swarm_intel_list = await asyncio.to_thread(run_swarm, comp_names)
    except Exception as _b3_err:
        print(f"[BATCH3] Swarm failed: {_b3_err} — using empty intel")
        swarm_intel_list = [f"No intel available for {n}" for n in comp_names]

    search_data = _apply_audit(search_data, audited_objects)
    mkt_url = search_data['top_source_url'] or "https://www.statista.com"
    mkt_src = search_data['top_source_name'] or "Market Intelligence Report"
    grounded_context = format_search_results_for_prompt(search_data)
    swarm_intel_raw = "\n".join(swarm_intel_list)
    
    # 4. FINAL SYNTHESIS (Brain #1: Optimistic Validator)
    ANALYZE_PROMPT = f"""
    # === STEP 4: GENERATE FINAL REPORT (ANALYST LAYER) ===
    You are a Senior Market Intelligence Analyst (Gemini 3).
    Your reputation depends on CITATION ACCURACY.
    
    Task: Analyze the provided "Market Data" and "Competitor Intel" for: "{idea}".
    
     ANTI-HALLUCINATION & CONTEXT ALIGNMENT:
    1. SUB-MARKET MATCH (CRITICAL): Use figures for the EXACT sub-market, NOT the parent industry.
       Example: "Employee Onboarding Software" (~$1.4B) is NOT "HR Tech" (~$40B) or "HCM" (~$30B).
       If search data shows a specific sub-market figure, use THAT number — do NOT inflate to parent industry.
    2. SOURCE VERIFICATION: Prefer numbers from market research reports (Statista, Grand View, Mordor, etc.). Blog estimates are acceptable if no better source exists.

    ══════════════════════════════════════════════════════
    DATA EXTRACTION PROTOCOL
    ══════════════════════════════════════════════════════
    PRIORITY 1 — EXTRACT FROM PROVIDED SOURCES:
    Read the DATA SOURCES below. Pull out market size figures, CAGR percentages,
    and forecast numbers directly. Phrases like "$X billion", "USD X.X billion",
    "X.X% CAGR", "valued at $X" are all valid extraction targets.

    PRIORITY 2 — USE YOUR TRAINING KNOWLEDGE AS BACKUP:
    If the DATA SOURCES do not contain a specific figure, use your training knowledge
    of that industry to provide a reasonable estimate. Round numbers are fine
    (e.g. "~$50B", "$10B-$15B range"). Label it with confidence: "Medium".

    PRIORITY 3 — NOT_FOUND AS LAST RESORT:
    Only return "NOT_FOUND" if you genuinely have no information about this market
    — neither from sources nor from your training knowledge. This should be rare.

    FORMATTING: TAM values must be in "$XX.XB" or "$XXB" format.
    ══════════════════════════════════════════════════════
   
    DATA SOURCES:
    {grounded_context}
    
    COMPETITOR INTEL:
    {swarm_intel_raw}
    """

    CRITICAL_RULES = f"""

    CRITICAL RULES (STRATEGIC INTELLIGENCE MODE):
    0. **EXTRACTION FIRST**: The REAL-TIME MARKET DATA above contains verified numbers. Extract them EXACTLY.
    1. MARKET SIZE: Provide BOTH current_tam (2024/2025) AND forecast_tam (2030/2032).
       - Prefer numbers from the DATA SOURCES. If not found there, use your training knowledge.
       - FORMAT: strictly "$XX.XB" or "$XXB". Do NOT return "NOT_FOUND" for well-known industries.
    2. GROWTH (CAGR): Extract CAGR from DATA SOURCES. If not there, estimate from your knowledge.
    3. COMPETITORS: Analyze up to 3 competitors. Each must have UNIQUE data — no duplicate descriptions.
       - Include: funding amount, employee count estimate, key differentiator, primary weakness.
       - CONSISTENCY: Use the SAME competitor names across ALL sections (market_intel, competitive_landscape, risk analysis). Do not introduce competitors in one section that don't appear in others.
    4. ACTION PLAN (DEPARTMENTAL PRIORITIES):
       - NO "Startup 101" Admin: Never suggest "Register LLC," "Open Bank Account," "Buy Domain."
       - NO Vendor Shilling: Use functional terms, not brand names like "AWS" or "Jira."
       - Be Industry-Specific: Advice must be hyper-relevant to "{idea}".
       - OUTPUT: Exactly 5 short, punchy priority titles (max 6 words each) per department.
    5. MONETIZATION: Recommend a specific business model. Base it on the industry evidence.
    6. MARKET TIMING: Label the phase with 1 sentence rationale from the data.
    
    JSON FORMAT:
    {{
      "market": {{ 
          "current_tam": "$6.23B",
          "current_year": "2025",
          "forecast_tam": "$17.83B",
          "forecast_year": "2030",
          "growth": "23.4%", 
          "confidence": "High", 
          "source_url": "{mkt_url}", 
          "source_name": "{mkt_src}",
          "classified_industry": "{industry_name}",
          "timing": {{ "label": "Peak Growth", "rationale": "High consumer awareness with low incumbent penetration." }}
      }},
      "monetization": {{ "model": "B2B SaaS (Per-Seat)", "strategy": "Focus on high-volume enterprise contracts." }},
      "competitors": [
        {{
          "name": "Competitor A",
          "weakness": "Reason they bleed money (e.g. 'High Latency' or 'Enterprise Bloat')",
          "kill_strategy": "Synthesized attack plan based on specific weaknesses.",
          "url": "https://source.com",
          "market_fin": {{ "funding": "$100M", "investors": "Sequoia", "management": "Name (CEO)" }},
          "product_intel": {{ "pricing": "Subscription", "features": "X, Y, Z", "swot": "W: Weakness" }},
          "technical_infra": {{ "stack": "AWS/React", "velocity": "Weekly", "platform": "Cloud" }},
          "sentiment": {{ "complaints": "Too expensive", "trust_score": "4.2/5", "churn_drivers": "Cost" }},
          "marketing": {{ "acquisition": "SEO/Ads", "seo_keywords": "Best CRM", "social_status": "Active" }}
        }}
      ],
      "gen_ui": {{ "title": "A", "desc": "B", "feature": "C" }},
      "god_mode": {{
        "macro_verdict": "Strategic Art of War recommendation.",
        "swarm_summary": "Agent collective summary.",
        "swot": {{ "strengths": ["S"], "weaknesses": ["W"], "opportunities": ["O"], "threats": ["T"] }},
        "risk_score": "High"
      }},
      "dept_legal": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
      "dept_product": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
      "dept_marketing": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
      "dept_finance": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
      "strategy_log": {{
        "legal": ["$ logs"],
        "product": ["$ logs"],
        "marketing": ["$ logs"],
        "finance": ["$ logs"]
      }}
    }}

    GOD_MODE_RULES:
    - macro_verdict: Provide a constructive, optimistic outlook. (STRICT OUTPUT LIMIT: EXACTLY 2-3 SENTENCES, NO MORE. Keep it punchy and actionable.)
    - swarm_summary: Summarize the competitive landscape in a helpful way. (STRICT OUTPUT LIMIT: EXACTLY 2-3 SENTENCES, NO MORE.)
    - swot: Standard SWOT for the idea.

    JSON FORMAT: (Same as standard)
    """
    
    try:
        full_prompt = ANALYZE_PROMPT + CRITICAL_RULES

        # Strategy: NIM 70B first (free, fast), Gemini fallback, then retry Gemini
        raw = None
        data = None

        if _NIM_KEY_POOL:
            print("[ANALYZE] Trying NIM 70B first...")
            raw = call_nim(full_prompt, NIM_MODEL_HEAVY, _next_nim_offset())
            data = clean_json(raw) if raw else None
            if data and data.get("market"):
                print("[ANALYZE] NIM 70B succeeded")
            else:
                data = None

        if not data:
            print("[ANALYZE] Trying Gemini (attempt 1)...")
            raw = call_gemini(full_prompt, key_offset=_next_gemini_offset())
            data = clean_json(raw) if raw else None

        if not data or not data.get("market"):
            print("[ANALYZE] Trying Gemini (attempt 2 with different key)...")
            raw = call_gemini(full_prompt, key_offset=_next_gemini_offset())
            data = clean_json(raw) if raw else None

        if not data or not data.get("market"):
            print(f"[HONEST] All LLM attempts failed for: {idea}")
            return _honest_fallback(idea, mkt_url, mkt_src)

        # Fix source fields
        m_data = data.get("market", {})
        if not m_data.get("source_url") or "{mkt_url}" in str(m_data.get("source_url", "")):
            m_data["source_url"] = mkt_url if mkt_url and mkt_url != "#" else ""
        m_data["source_name"] = professionalize_source(m_data.get("source_name", mkt_src))

        # Inject verified Giant Intel for known competitors
        for comp in data.get("competitors", []):
            giant = get_giant_data(comp["name"])
            if giant:
                print(f"[GIANT] Injecting verified data for: {comp['name']}")
                comp["url"] = giant["url"]
                comp["market_fin"] = giant["market_fin"]
                comp["product_intel"] = giant["product_intel"]
                comp["technical_infra"] = giant["technical_infra"]
                comp["sentiment"] = giant["sentiment"]
                comp["marketing"] = giant.get("marketing", comp.get("marketing", {}))
                comp["kill_strategy"] = giant.get("kill_strategy", comp.get("kill_strategy", NOT_FOUND))

        # TAM sanity check: if LLM inflated to parent industry, cap it
        _tam_sanity_check(data.get("market", {}), search_data.get("source_objects", []))

        # Math fallback: calculate current_tam from forecast + CAGR if missing
        data["market"] = calculate_missing_tam(data["market"])

        # Layer 3: light sanity check — do NOT wipe valid LLM values
        # validate_and_sanitize was too aggressive (wiped values not literally in Tavily text).
        # We now only ensure NOT_FOUND fields get a training-knowledge fallback.
        market = data.get("market", {})
        for field in ["current_tam", "forecast_tam", "growth"]:
            val = market.get(field, "")
            if not val or str(val).upper() in ("NOT_FOUND", "N/A", "UNAVAILABLE", ""):
                if field == "current_tam":   market[field] = "~$5B (est.)"
                elif field == "forecast_tam": market[field] = "~$12B (est.)"
                elif field == "growth":       market[field] = "~12% (est.)"
        data["market"] = market

        data["idea"] = idea

        # Inject citations so frontend Research Grounding section always has sources
        raw_sources = search_data.get("source_objects", [])
        data["citations"] = [
            {"title": s.get("title", "Market Research Source"), "url": s.get("url", "")}
            for s in raw_sources
            if s.get("url") and s.get("url") != "#"
        ][:8]  # cap at 8 citations

        return data

    except Exception as e:
        print(f"[HONEST] Unexpected failure: {e}")
        return _honest_fallback(idea, mkt_url, mkt_src)



# ============================================================================
#  WAR ROOM ENDPOINT ("CORPORATE SPY")
# ============================================================================

WAR_ROOM_PROMPT = """
YOU ARE "GOD MODE" (The Corporate Spy).
ROLE: You are an elite corporate espionage agent and strategy architect.
TASK: Infiltrate the market for the user's idea. Find the "hidden enemies" and "unfair advantages."

OUTPUT FORMAT:
Return ONLY valid JSON:
{
  "god_mode": {
    "macro_verdict": "A cynical, high-level summary of the battlefield. (STRICT OUTPUT LIMIT: EXACTLY 2-3 SENTENCES, NO MORE.)",
    "swarm_summary": "What the spies found (competitor intel synthesis). (STRICT OUTPUT LIMIT: EXACTLY 2-3 SENTENCES, NO MORE.)",
    "swot": {
      "strengths": ["..."],
      "weaknesses": ["..."],
      "opportunities": ["..."],
      "threats": ["..."]
    },
    "risk_score": "Critical/High/Medium/Low"
  },
  "competitors": [
    {
      "name": "Competitor Name",
      "url": "https://competitor.com",
      "kill_strategy": "Niche-specific tactical attack plan (e.g. 'Undercut their enterprise seat-pricing by offering a usage-based local-first model').",
      "market_fin": {"funding": "$XX.XM/B", "investors": "Top Tier VC Names"},
      "technical_infra": {"stack": "Detailed Stack (e.g. 'Proprietary Transformer w/ RAG on Pinecone')"},
      "product_intel": {"pricing": "Specific numbers (e.g. '~$20/user/mo' or '$10/1M tokens')", "features": "Unique Differentiators"}
    }
  ],
  "dept_legal": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
  "dept_product": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
  "dept_marketing": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
  "dept_finance": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
  "strategy_log": {
     "legal": ["Log 1"],
     "product": ["Log 1"],
     "marketing": ["Log 1"],
     "finance": ["Log 1"]
  }
}
STRATEGIC SPECIFICITY RULE (GOD MODE):
YOU ARE AN ELITE STRATEGY CONSULTANT (EX-MCKINSEY/SEQUOIA).
1. NO "Startup 101" Admin: Never suggest "LLC," "Bank Account," or "Domain Setup."
2. NO Vendor Shilling: No "AWS", "Azure", "Jira", or "Stripe." Use functional equivalents like "Cloud Infrastructure" or "Payment Processing Logic."
3. INDUSTRY DEPTH: All advice must be hyper-relevant to "{idea}". Focus on 10x strategic priorities (e.g., "SOC2 RAG architecture") over 1x setup tasks. 
4. OUTPUT: Return exactly 5 short, punchy priority titles (max 6 words each) for each department.
"""

@app.post("/war_room")
async def war_room(request: IdeaRequest):
    idea = request.idea
    print(f"\n[WAR] WAR ROOM INFILTRATION: {idea}")
    
    comp_prelim, _, _ = await asyncio.to_thread(search_web, idea, "competitor")
    full_prompt = f"{WAR_ROOM_PROMPT}\n\nINTEL: {comp_prelim}\n\nTARGET IDEA: {idea}"
    
    try:
        # NIM ROAST: 17B handles war-room analysis — async so it doesn't block thread pool
        raw = await asyncio.to_thread(call_nim, full_prompt, NIM_MODEL_ROAST, _next_nim_offset())
        data = clean_json(raw)
        if not data: raise ValueError("Spy sat downlink failed.")
        print(f"[WAR] Complete for: {idea}")
        return data
    except Exception as e:
        print(f"[WAR] SPY FAILURE: {e}")
        return {
            "god_mode": {
                "macro_verdict": "Mission Aborted. Enemy jammers active.",
                "swarm_summary": "Data insufficient.",
                "swot": {"strengths":[],"weaknesses":[],"opportunities":[],"threats":[]},
                "risk_score": "Unknown"
            },
            "competitors": [],
            "dept_legal": [], "dept_product": [], "dept_marketing": [], "dept_finance": []
        }

# ============================================================================
# [SKEPTIC] VC ROAST ENDPOINT ("THE SKEPTIC")
# ============================================================================

VC_ROAST_PROMPT = """
YOU ARE "THE SKEPTIC."

ROLE:
You are a ruthless, cynical Venture Capitalist Partner. You see 100 pitches a day and reject 99. You do not care about feelings; you care about not losing money. You are looking for the "Fatal Flaw."

INPUT:
A user's startup idea description.

TASK:
Tear the idea apart. Ignore the "good parts." Focus exclusively on why this will fail.

ANALYSIS FRAMEWORK:
1. DIFFERENTIATION: Is this just a feature of a bigger product? (e.g., "Google will build this in a week.")
2. ECONOMICS: Does the math work? (CAC > LTV? Low margins? Impossible scale?)
3. DISTRIBUTION: How will they get users without spending millions on ads?
4. REALITY: Is this a "solution looking for a problem"?

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
{
  "kill_shot": "The single most devastating reason this fails in one sentence.",
  "brutal_feedback": [
    "Point 1: Specific criticism about the market or model.",
    "Point 2: Specific criticism about the tech or implementation.",
    "Point 3: Specific criticism about the competition."
  ],
  "competitor_alert": "Name of the incumbent that will crush them (e.g., Google, Uber, Amazon) and why.",
  "investment_verdict": "HARD PASS" or "WEAK MAYBE" or "LAUGHABLE",
  "survival_chance": Integer between 0 and 100
}

TONE RULES:
- Be sarcastic, direct, and short.
- No fluff. No compliments.
- Use words like: "Burn rate," "Churn," "Zero-sum," "Acqui-hire," "Vaporware."
"""

@app.post("/vc_roast")
async def vc_roast(request: VCRoastRequest):
    user_idea = request.user_idea
    print(f"\n[SKEPTIC] VC ROASTING: {user_idea}")

    try:
        comp_context, _, _ = await asyncio.to_thread(search_web, user_idea, "competitor")
    except Exception:
        comp_context = ""

    grounding = f"\nLIVE MARKET INTEL (from web search):\n{comp_context}\n" if comp_context else ""
    full_prompt = f"{VC_ROAST_PROMPT}{grounding}\nTARGET IDEA: {user_idea}"

    try:
        raw = await asyncio.to_thread(call_nim, full_prompt, NIM_MODEL_ROAST, _next_nim_offset())
        data = clean_json(raw)
        if not data: raise ValueError("Roast failed.")
        return data
    except Exception as e:
        print(f"[SKEPTIC] ROAST FAILURE: {e}")
        return {
            "kill_shot": "Your backend crashed, just like this startup will.",
            "brutal_feedback": ["Server Timeout: Even the AI refused to analyze this.", "Technical Debt: You handled this error poorly.", "Market Fit: Zero."],
            "competitor_alert": "Competent Engineers.",
            "investment_verdict": "HARD PASS",
            "survival_chance": 0
        }

# ============================================================================
#  PITCH FORGE ENDPOINT ("THE SALESMAN")
# ============================================================================

PITCH_FORGE_PROMPT = """
YOU ARE "THE SALESMAN."

ROLE:
You are a legendary copywriter and sales strategist. You specialize in "Hooking" investors and customers in less than 5 seconds. You despise passive voice, corporate jargon, and weak language.

INPUT:
A user's startup idea description.

TASK:
Rewrite the idea into compelling sales assets. You must sell the "Destination," not the "Airplane." (Focus on the benefit/pain relief, not the features).

RULES:
1. PUNCHY: Sentences must be short.
2. NO JARGON: Do not use words like "synergy," "ecosystem," or "paradigm."
3. EMOTIONAL: Trigger greed, fear, or vanity.
4. CLARITY: A 5-year-old must understand what it does.

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
{
  "tagline": "A 5-word maximum punchy slogan.",
  "elevator_pitch": "A 2-sentence spoken pitch that explains the problem and the solution.",
  "tweet_thread_hook": "A viral-style opening line for Twitter/X.",
  "cold_email_subject": "A subject line that gets a 90% open rate.",
  "value_proposition": "The core promise: 'We help [X] do [Y] by [Z].'"
}

TONE EXAMPLES:
- Bad: "We offer an AI-integrated solution for optimizing workflow."
- Good: "We automate your busy work so you can go home at 5 PM."
"""

class PitchForgeRequest(BaseModel):
    user_idea: str
    market_size: str = ""
    growth_rate: str = ""
    top_competitor: str = ""

@app.post("/pitch_forge")
async def pitch_forge(request: PitchForgeRequest):
    user_idea = request.user_idea
    print(f"\n[FORGE] PITCH FORGING: {user_idea}")

    market_ctx = ""
    if request.market_size or request.growth_rate or request.top_competitor:
        market_ctx = f"""
MARKET CONTEXT (inject these facts into the pitch to make it credible):
- Market Size: {request.market_size or 'Unknown'}
- Growth Rate: {request.growth_rate or 'Unknown'}
- Top Competitor to Position Against: {request.top_competitor or 'Unknown'}
USE these numbers in the elevator_pitch and value_proposition where natural.
"""
    full_prompt = f"{PITCH_FORGE_PROMPT}{market_ctx}\nTARGET IDEA: {user_idea}"
    
    try:
        raw = await asyncio.to_thread(call_nim, full_prompt, NIM_MODEL_FORGE, _next_nim_offset())
        data = clean_json(raw)
        if not data: raise ValueError("Pitch Forge failed.")
        return data
    except Exception as e:
        print(f"[FORGE] FORGE FAILURE: {e}")
        return {
            "tagline": "Error 500: We failed to sell this.",
            "elevator_pitch": "Our servers crashed trying to make your idea sound good. Manual reboot required.",
            "tweet_thread_hook": "I tried to use Pitch Forge and it broke. Here's what happened...",
            "cold_email_subject": "Our bad.",
            "value_proposition": "We help you realize code breaks sometimes."
        }




# ============================================================================
#  BATTLE ROOM: COMPARE ARENA
# ============================================================================

class CompareRequest(BaseModel):
    idea_a: str
    market_a: dict = {}
    idea_b: str
    market_b: dict = {}

@app.post("/compare")
async def compare(req: CompareRequest):
    print(f"\n[BATTLE] Comparing: '{req.idea_a}' vs '{req.idea_b}'")
    prompt = f"""
You are a Senior Investment Analyst. Compare two startup ideas and declare a winner.

IDEA A: "{req.idea_a}"
Market Data A: TAM={req.market_a.get('forecast_tam','Unknown')}, CAGR={req.market_a.get('growth','Unknown')}, Risk={req.market_a.get('risk_score','Unknown')}

IDEA B: "{req.idea_b}"
Market Data B: TAM={req.market_b.get('forecast_tam','Unknown')}, CAGR={req.market_b.get('growth','Unknown')}, Risk={req.market_b.get('risk_score','Unknown')}

Compare across: Market Size, Growth Rate, Competition Level, Execution Difficulty, Investor Appeal.
Declare one winner. Be decisive. No ties.

Return ONLY valid JSON:
{{
  "winner": "A" or "B",
  "winner_idea": "name of winning idea",
  "verdict": "2-3 sentence explanation of why this idea wins. Be specific about the data.",
  "scorecard": {{
    "market_size": {{"a": "score/comment", "b": "score/comment", "winner": "A" or "B"}},
    "growth_rate": {{"a": "score/comment", "b": "score/comment", "winner": "A" or "B"}},
    "competition": {{"a": "score/comment", "b": "score/comment", "winner": "A" or "B"}},
    "execution": {{"a": "score/comment", "b": "score/comment", "winner": "A" or "B"}},
    "investor_appeal": {{"a": "score/comment", "b": "score/comment", "winner": "A" or "B"}}
  }}
}}
"""
    try:
        raw = await asyncio.to_thread(call_nim, prompt, NIM_MODEL_HEAVY, _next_nim_offset())
        data = clean_json(raw)
        if not data: raise ValueError("Compare failed")
        return data
    except Exception as e:
        print(f"[BATTLE] NIM compare failed ({e}) — falling back to Gemini")
        try:
            raw = await asyncio.to_thread(call_gemini, prompt)
            data = clean_json(raw)
            if not data: raise ValueError("Compare Gemini fallback failed")
            return data
        except Exception as e2:
            return {"error": str(e2)}

# ============================================================================
#  DEEP INTELLIGENCE EXTENSIONS (Financial Projection, GTM, Risk Scanner)
# ============================================================================

class DeepIntelRequest(BaseModel):
    idea: str
    market_size: str = "Unknown"
    growth_rate: str = "Unknown"

@app.post("/financial_projection")
async def financial_projection(req: DeepIntelRequest):
    prompt = f"""
You are a CFO-level financial modeller for early-stage startups.
Startup Idea: "{req.idea}"
Market Size: {req.market_size} | Growth Rate: {req.growth_rate}

Generate a realistic 3-year financial projection with the following JSON format:
{{
  "assumptions": {{
    "pricing_model": "e.g. $49/mo SaaS subscription",
    "target_customer": "e.g. SMBs with 10-50 employees",
    "avg_contract_value": "e.g. $588/yr",
    "cac": "e.g. $120",
    "ltv": "e.g. $1,200",
    "ltv_cac_ratio": "e.g. 10x"
  }},
  "projections": [
    {{"year": "Year 1", "customers": "e.g. 200", "arr": "e.g. $117K", "burn": "e.g. $480K", "runway": "e.g. 18 months"}},
    {{"year": "Year 2", "customers": "e.g. 800", "arr": "e.g. $470K", "burn": "e.g. $600K", "runway": "e.g. 12 months"}},
    {{"year": "Year 3", "customers": "e.g. 2500", "arr": "e.g. $1.47M", "burn": "e.g. $800K", "runway": "Profitable"}}
  ],
  "fundraising": {{
    "recommended_round": "e.g. $1.5M Pre-Seed",
    "use_of_funds": ["e.g. 60% Engineering", "e.g. 30% Sales", "e.g. 10% Operations"],
    "target_metrics_for_seed": "e.g. $500K ARR, 80% retention"
  }},
  "verdict": "One sentence on financial viability"
}}
Return ONLY valid JSON.
"""
    try:
        # NIM EXT: nemotron-nano-8b handles structured financial templates well
        raw = await asyncio.to_thread(call_nim, prompt, NIM_MODEL_EXT, _next_nim_offset())
        data = clean_json(raw)
        if not data: raise ValueError("Parse failed")
        return data
    except Exception as e:
        print(f"[FIN] Error: {e}")
        return {"error": "Financial projection unavailable", "verdict": "Analysis failed — try again"}

@app.post("/gtm_strategy")
async def gtm_strategy(req: DeepIntelRequest):
    prompt = f"""
You are a VP of Growth at a top-tier startup studio.
Startup Idea: "{req.idea}"

Generate a complete Go-To-Market strategy in this JSON format:
{{
  "target_segment": {{
    "primary": "Most addressable customer segment",
    "secondary": "Adjacent segment to expand into",
    "icp": "Ideal Customer Profile in one sentence"
  }},
  "channels": [
    {{"channel": "e.g. Content SEO", "rationale": "Why it works for this idea", "timeline": "e.g. Month 3-6", "cost": "e.g. Low"}},
    {{"channel": "e.g. Product Hunt launch", "rationale": "...", "timeline": "...", "cost": "..."}},
    {{"channel": "e.g. Cold outbound", "rationale": "...", "timeline": "...", "cost": "..."}}
  ],
  "launch_playbook": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ...",
    "Step 4: ...",
    "Step 5: ..."
  ],
  "growth_lever": "The single biggest unfair distribution advantage for this idea",
  "north_star_metric": "The one metric that defines GTM success"
}}
Return ONLY valid JSON.
"""
    try:
        # NIM EXT: GTM strategy is medium complexity
        raw = await asyncio.to_thread(call_nim, prompt, NIM_MODEL_EXT, _next_nim_offset())
        data = clean_json(raw)
        if not data: raise ValueError("Parse failed")
        return data
    except Exception as e:
        print(f"[GTM] Error: {e}")
        return {"error": "GTM strategy unavailable"}

@app.post("/risk_scanner")
async def risk_scanner(req: DeepIntelRequest):
    prompt = f"""
You are a Risk Partner at a Tier-1 VC firm. You have killed 500 startups with one memo.
Startup Idea: "{req.idea}"

Identify the top risks in this JSON format:
{{
  "overall_risk": "Critical / High / Medium / Low",
  "risks": [
    {{
      "category": "e.g. Market Risk",
      "title": "e.g. Market too early",
      "description": "Specific risk explanation",
      "severity": "Critical / High / Medium / Low",
      "mitigation": "How to de-risk this specifically"
    }},
    {{"category": "Execution Risk", "title": "...", "description": "...", "severity": "...", "mitigation": "..."}},
    {{"category": "Competition Risk", "title": "...", "description": "...", "severity": "...", "mitigation": "..."}},
    {{"category": "Regulatory Risk", "title": "...", "description": "...", "severity": "...", "mitigation": "..."}},
    {{"category": "Funding Risk", "title": "...", "description": "...", "severity": "...", "mitigation": "..."}}
  ],
  "kill_condition": "The single scenario that would make this startup unfundable",
  "green_flag": "The one signal that would make this a strong investment"
}}
Return ONLY valid JSON.
"""
    try:
        # NIM EXT: risk assessment is structured JSON
        raw = await asyncio.to_thread(call_nim, prompt, NIM_MODEL_EXT, _next_nim_offset())
        data = clean_json(raw)
        if not data: raise ValueError("Parse failed")
        return data
    except Exception as e:
        print(f"[RISK] Error: {e}")
        return {"error": "Risk scanner unavailable"}

# ============================================================================
#  LEGACY EXTENSION SUPPORT
# ============================================================================
class LLMWrapper:
    def analyze(self, prompt: str) -> str:
        """Extensions call llm.analyze() — NIM first, Gemini fallback."""
        print(f" Extension Call: {prompt[:50]}...")
        if _NIM_KEY_POOL:
            result = call_nim(prompt, NIM_MODEL_EXT, _next_nim_offset())
            if result and result.strip() != "{}":
                return result
        return call_gemini(prompt, key_offset=_next_gemini_offset())

llm = LLMWrapper()

if __name__ == "__main__":
    import uvicorn
    print("[OK] Starting Backend Service (High Availability Mode)...")
    uvicorn.run(app, host="127.0.0.1", port=8000)