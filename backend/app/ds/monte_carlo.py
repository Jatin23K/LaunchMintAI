"""
Monte Carlo Financial Simulation — Phase 2
Runs 10,000 simulations to produce Bear / Base / Bull financial scenarios.
No external API calls. Pure numpy.
"""

import numpy as np
from typing import Dict

# ── Sector Benchmark Table ─────────────────────────────────────────────────
# Source: industry averages from SaaS/startup research
# CAC = Customer Acquisition Cost ($)
# LTV = Lifetime Value ($)
# CHURN = Monthly churn rate (%)
# GROWTH = Monthly new customer growth rate (%)

SECTOR_BENCHMARKS = {
    0: {"name": "AI / ML",          "cac": 800,  "ltv": 4000, "churn": 0.025, "growth": 0.18},
    1: {"name": "Fintech",          "cac": 600,  "ltv": 3200, "churn": 0.030, "growth": 0.15},
    2: {"name": "Healthcare",       "cac": 900,  "ltv": 5000, "churn": 0.018, "growth": 0.12},
    3: {"name": "Education",        "cac": 300,  "ltv": 1200, "churn": 0.045, "growth": 0.14},
    4: {"name": "SaaS / Software",  "cac": 500,  "ltv": 2800, "churn": 0.022, "growth": 0.16},
    5: {"name": "E-Commerce",       "cac": 250,  "ltv": 900,  "churn": 0.055, "growth": 0.20},
    6: {"name": "LegalTech",        "cac": 700,  "ltv": 3800, "churn": 0.020, "growth": 0.13},
    7: {"name": "Logistics",        "cac": 450,  "ltv": 2200, "churn": 0.028, "growth": 0.11},
    8: {"name": "Real Estate",      "cac": 1000, "ltv": 6000, "churn": 0.015, "growth": 0.10},
    9: {"name": "Other",            "cac": 500,  "ltv": 2000, "churn": 0.035, "growth": 0.12},
}

N_SIMULATIONS  = 10_000
SEED_FUNDING   = 500_000   # default seed ($)
MONTHLY_BURN   = 65_000    # realistic seed-stage monthly burn ($)
N_MONTHS       = 60        # simulate 5 years


def _get_benchmarks(sector: int) -> dict:
    return SECTOR_BENCHMARKS.get(sector, SECTOR_BENCHMARKS[9])


def simulate(sector: int = 9, seed_usd: float = SEED_FUNDING, seed: int = None) -> Dict:
    """
    Runs N_SIMULATIONS Monte Carlo paths.
    Each path randomly samples CAC, LTV, churn, and growth
    from distributions centred on sector benchmarks.

    Returns Bear (P10) / Base (P50) / Bull (P90) scenarios.
    """
    if seed is not None:
        np.random.seed(seed)
    else:
        np.random.seed(42)
    bench = _get_benchmarks(sector)

    # ── Sample distributions (±30% variation around benchmark) ──────────
    cac_samples    = np.random.normal(bench["cac"],    bench["cac"]    * 0.30, N_SIMULATIONS)
    ltv_samples    = np.random.normal(bench["ltv"],    bench["ltv"]    * 0.30, N_SIMULATIONS)
    churn_samples  = np.random.normal(bench["churn"],  bench["churn"]  * 0.40, N_SIMULATIONS)
    growth_samples = np.random.normal(bench["growth"], bench["growth"] * 0.40, N_SIMULATIONS)

    # Clamp to realistic bounds
    cac_samples    = np.clip(cac_samples,    50,    5000)
    ltv_samples    = np.clip(ltv_samples,    100,   20000)
    churn_samples  = np.clip(churn_samples,  0.005, 0.20)
    growth_samples = np.clip(growth_samples, 0.01,  0.50)

    # ── Run all simulations vectorised ───────────────────────────────────
    runway_months      = np.zeros(N_SIMULATIONS)
    reached_breakeven  = np.zeros(N_SIMULATIONS, dtype=bool)

    for i in range(N_SIMULATIONS):
        cash       = seed_usd
        customers  = max(1, int(seed_usd / (cac_samples[i] * 3)))
        breakeven  = False

        for month in range(1, N_MONTHS + 1):
            # Revenue this month
            revenue = customers * (bench["ltv"] / 24)   # LTV spread over 24mo

            # Costs this month
            new_customers    = max(0, int(customers * growth_samples[i]))
            acquisition_cost = new_customers * cac_samples[i]
            total_cost       = MONTHLY_BURN + acquisition_cost

            # Net cash flow
            net = revenue - total_cost
            cash += net

            # Update customer base
            churned   = int(customers * churn_samples[i])
            customers = max(0, customers + new_customers - churned)

            if cash <= 0:
                runway_months[i] = month
                break

            if net > 0 and not breakeven:
                breakeven = True

            if month == N_MONTHS:
                runway_months[i] = N_MONTHS  # survived full period

        reached_breakeven[i] = breakeven

    # ── Compute percentiles ───────────────────────────────────────────────
    p10 = int(np.percentile(runway_months, 10))
    p50 = int(np.percentile(runway_months, 50))
    p90 = int(np.percentile(runway_months, 90))
    breakeven_prob = float(np.mean(reached_breakeven))

    # ── LTV:CAC ratio (key metric for investors) ─────────────────────────
    avg_ltv_cac = round(float(np.mean(ltv_samples) / np.mean(cac_samples)), 2)

    sector_name = bench["name"]

    return {
        "bear": {
            "label":         "Bear Case (P10)",
            "runway_months": p10,
            "description":   "Worst 10% of simulated outcomes"
        },
        "base": {
            "label":         "Base Case (P50)",
            "runway_months": p50,
            "description":   "Median simulated outcome"
        },
        "bull": {
            "label":         "Bull Case (P90)",
            "runway_months": p90,
            "description":   "Best 10% of simulated outcomes"
        },
        "breakeven_probability": round(breakeven_prob, 2),
        "ltv_cac_ratio":         avg_ltv_cac,
        "simulations_run":       N_SIMULATIONS,
        "seed_funding_usd":      int(seed_usd),
        "sector_benchmark":      sector_name,
        "monthly_burn_usd":      MONTHLY_BURN,
    }
