import re
from app.services.llm_engine import llm, call_gemini_fast
from app.extensions.parse_helper import safe_parse_json


_MIN_BURN = 50_000   # $50K/month floor
_MAX_BURN = 200_000  # $200K/month ceiling (sanity cap)


def _parse_dollar_amount(s: str) -> float | None:
    """Extract numeric dollar value from strings like '$10,000/month', '$80K', '10000'."""
    if not s:
        return None
    clean = str(s).upper().replace(",", "").replace(" ", "")
    m = re.search(r"\$?([\d.]+)([KM]?)", clean)
    if not m:
        return None
    num = float(m.group(1))
    suffix = m.group(2)
    if suffix == "K":
        num *= 1_000
    elif suffix == "M":
        num *= 1_000_000
    return num


def _enforce_burn_floor(burn_str: str) -> str:
    """If burn < $50K/month, replace with the floor. Preserves the string format."""
    val = _parse_dollar_amount(burn_str)
    if val is not None and val < _MIN_BURN:
        return f"${_MIN_BURN:,}/month"
    if val is not None and val > _MAX_BURN:
        return f"${_MAX_BURN:,}/month"
    return burn_str

_ECHO_MARKERS = ["e.g.", "SaaS Subscription $99/mo", "Pre-Seed $500K", "60% product, 30% GTM"]


def _revenue_context_for(idea: str) -> str:
    """Return sector-specific Year 1 revenue range + per-user pricing reality for the prompt."""
    idea_lower = idea.lower()
    if any(k in idea_lower for k in ["legal", "contract", "compliance", "law", "counsel", "litigation", "in-house legal"]):
        return (
            "Enterprise LegalTech SaaS: Year 1 $150K–$600K | "
            "Pricing: $80–$300/user/month (enterprise contracts, NOT $10/user). "
            "50–200 enterprise users in Year 1 is realistic."
        )
    if any(k in idea_lower for k in ["accounting", "accountant", "cash flow", "bookkeeping", "tax", "payroll", "invoicing"]):
        return (
            "SMB Accounting SaaS: Year 1 $80K–$350K | "
            "Pricing: $49–$199/month per firm or per seat. "
            "200–800 paying SMB customers in Year 1 is realistic."
        )
    if any(k in idea_lower for k in ["health", "medical", "wellness", "clinical"]):
        return (
            "HealthTech SaaS: Year 1 $100K–$500K | "
            "Pricing: $50–$500/provider/month depending on clinic size. "
            "100–500 providers in Year 1 is realistic."
        )
    if any(k in idea_lower for k in ["fintech", "finance", "banking", "insurance", "financial"]):
        return (
            "FinTech SaaS: Year 1 $80K–$400K | "
            "Pricing: $99–$499/month per business. "
            "100–600 paying businesses in Year 1 is realistic."
        )
    if any(k in idea_lower for k in ["blockchain", "web3", "crypto", "supply chain"]):
        return (
            "Enterprise/Blockchain SaaS: Year 1 $150K–$700K | "
            "Pricing: $500–$5,000/month per enterprise client. "
            "20–100 enterprise clients in Year 1 is realistic."
        )
    if any(k in idea_lower for k in ["recruiter", "hiring", "talent", "hr"]):
        return (
            "HR/Recruiting SaaS: Year 1 $100K–$400K | "
            "Pricing: $200–$800/month per recruiter seat or per company. "
            "100–400 paying customers in Year 1 is realistic."
        )
    if any(k in idea_lower for k in ["marketplace", "platform", "ecommerce", "retail"]):
        return (
            "Marketplace: Year 1 $100K–$1M GMV/revenue | "
            "Take rate: 5–20% of GMV. "
            "500–5,000 active users in Year 1 is realistic."
        )
    if any(k in idea_lower for k in ["consumer", "app", "gen z", "social", "b2c"]):
        return (
            "B2C Subscription: Year 1 $30K–$200K | "
            "Pricing: $5–$20/month per user. "
            "1,000–10,000 paying users in Year 1 is realistic."
        )
    # Default: generic B2B SaaS
    return (
        "B2B SaaS: Year 1 $80K–$400K | "
        "Pricing: $50–$300/month per customer. "
        "100–500 paying customers in Year 1 is realistic."
    )


def _use_of_funds_for(idea: str) -> str:
    idea_lower = idea.lower()
    if any(k in idea_lower for k in ["blockchain", "web3", "crypto", "supply chain", "hardware"]):
        return "50% engineering/blockchain infra, 25% business development & partnerships, 15% marketing, 10% ops/legal"
    if any(k in idea_lower for k in ["legal", "contract", "compliance", "law", "counsel", "litigation", "in-house legal"]):
        return "40% engineering & AI model development, 30% sales & customer success, 20% compliance/legal ops, 10% marketing"
    if any(k in idea_lower for k in ["accounting", "accountant", "cash flow", "bookkeeping", "tax", "payroll", "invoicing"]):
        return "35% engineering & integrations, 25% compliance/security, 25% sales & partnerships, 15% marketing"
    if any(k in idea_lower for k in ["marketplace", "platform", "ecommerce", "retail"]):
        return "35% engineering, 30% supply/demand growth, 20% marketing, 15% ops"
    if any(k in idea_lower for k in ["health", "medical", "wellness", "clinical"]):
        return "35% engineering, 25% clinical/regulatory, 25% sales, 15% marketing"
    if any(k in idea_lower for k in ["fintech", "finance", "banking", "insurance", "financial"]):
        return "35% engineering, 25% compliance/legal, 25% sales, 15% marketing"
    if any(k in idea_lower for k in ["consumer", "app", "gen z", "social", "b2c"]):
        return "30% engineering, 15% product, 35% user acquisition & marketing, 20% ops"
    if any(k in idea_lower for k in ["recruiter", "hiring", "talent", "hr"]):
        return "40% engineering & integrations, 20% sales, 25% customer success & onboarding, 15% marketing"
    return "40% engineering, 25% sales, 20% marketing, 15% ops"


class Extension:
    def execute(self, payload):
        idea = payload.get('idea', str(payload))
        market_size = payload.get('market_size', 'Unknown')
        growth_rate = payload.get('growth_rate', 'Unknown')
        use_of_funds = _use_of_funds_for(idea)
        revenue_context = _revenue_context_for(idea)

        prompt = f"""You are a startup CFO creating a realistic 3-year financial model for an early-stage company.

STARTUP IDEA: {idea}
MARKET SIZE: {market_size}
MARKET GROWTH RATE: {growth_rate}

SECTOR-SPECIFIC REVENUE REALITY FOR THIS IDEA:
{revenue_context}

CRITICAL REALISM RULES — violating these makes the model useless:
- This is a SEED-STAGE startup. Use the sector revenue range above for Year 1 — do NOT use a generic range.
- Year 1 revenue CANNOT exceed $5M under any circumstance.
- Revenue must grow 2x–4x Year 1→2, and 1.5x–3x Year 2→3.
- Give SINGLE POINT ESTIMATES — not ranges like "$240K to $960K". Pick one number.
- Burn rate MUST be between $50,000 and $150,000 per month. A burn of $10K/month is WRONG — a real seed team of 4-8 people costs at least $50K/month in salaries alone. Write "$80,000/month" not "$10,000/month".
- Pricing MUST match the sector reality above — enterprise tools charge $80–$500/user/month, NOT $10/user/month.
- User count × price per user MUST approximately equal the revenue figure. Sanity-check your own math.
- Do NOT copy example text — all values must be specific to "{idea}".

The use_of_funds for this idea is: {use_of_funds}

Return ONLY valid JSON (single numbers only — no ranges, no "to", no "or"):
{{
  "assumptions": {{
    "pricing_model": "<specific pricing for {idea} — include actual price points>",
    "ltv_cac_ratio": "<ratio like 3.2:1 with brief reasoning>",
    "gross_margin": "<realistic percentage for this business model>",
    "payback_period": "<months to recover CAC>"
  }},
  "projections": [
    {{"year": "Year 1", "revenue": "<single dollar amount — no ranges>", "users": "<single number — no ranges>", "burn": "<monthly burn, single number>"}},
    {{"year": "Year 2", "revenue": "<single dollar amount — 2x–4x Year 1>", "users": "<single number>", "burn": "<monthly burn>"}},
    {{"year": "Year 3", "revenue": "<single dollar amount — pre-Series B scale>", "users": "<single number>", "burn": "<monthly burn>"}}
  ],
  "fundraising": {{
    "recommended_round": "<Seed or Pre-Seed — realistic amount for this stage>",
    "use_of_funds": "{use_of_funds}",
    "runway_months": "<calculated months of runway from this round>"
  }},
  "verdict": "<one sentence honest financial outlook for {idea}>"
}}"""

        result_json = llm.analyze(prompt)
        data = safe_parse_json(result_json)

        if data and any(marker in str(data) for marker in _ECHO_MARKERS):
            print(f"[FIN-PROJ] Echo detected — retrying with Gemini")
            result_json = call_gemini_fast(prompt)
            data = safe_parse_json(result_json)

        # ── Post-processing: enforce burn rate floor/ceiling ──────────────
        if data and not data.get("error"):
            for proj in data.get("projections", []):
                if "burn" in proj:
                    fixed = _enforce_burn_floor(str(proj["burn"]))
                    if fixed != str(proj["burn"]):
                        print(f"[FIN-PROJ] Burn corrected: {proj['burn']} → {fixed}")
                    proj["burn"] = fixed

        # PAID KEY: line below is safe to delete — paid models reliably return valid JSON, this fallback is only needed for free-tier parse failures
        return data if data else {"error": "Financial projection unavailable", "raw": result_json[:200] if result_json else ""}
