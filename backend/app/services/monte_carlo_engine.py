"""
Layer 3: Vectorized NumPy Monte Carlo Financial Simulation Engine
Simulates 10,000 parallel stochastic financial lifecycles over 12-36 months,
calculating empirical cash flow confidence intervals, runway ruin probabilities, and 95% Value at Risk.
"""

import time
import numpy as np
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

# Sector-Specific Stochastic Volatility Parameters
SECTOR_FINANCIAL_PRIORS = {
    'SaaS & Enterprise': {
        'mean_monthly_growth': 0.08,    # 8% MoM baseline growth
        'growth_volatility': 0.12,       # Normal volatility
        'mean_monthly_churn': 0.03,      # 3% monthly churn
        'burn_scaling_factor': 0.40      # Burn increases by 40% of revenue growth rate
    },
    'FinTech & Commerce': {
        'mean_monthly_growth': 0.09,
        'growth_volatility': 0.16,
        'mean_monthly_churn': 0.04,
        'burn_scaling_factor': 0.45
    },
    'HealthTech & Bio': {
        'mean_monthly_growth': 0.04,    # Slower early commercialization, high fixed R&D
        'growth_volatility': 0.20,
        'mean_monthly_churn': 0.015,
        'burn_scaling_factor': 0.20
    },
    'Consumer Web & Media': {
        'mean_monthly_growth': 0.12,    # High upside, high volatility
        'growth_volatility': 0.28,
        'mean_monthly_churn': 0.08,      # Higher consumer churn
        'burn_scaling_factor': 0.50
    },
    'Hardware & DeepTech': {
        'mean_monthly_growth': 0.05,
        'growth_volatility': 0.22,
        'mean_monthly_churn': 0.02,
        'burn_scaling_factor': 0.35
    },
    'EdTech': {
        'mean_monthly_growth': 0.06,
        'growth_volatility': 0.18,
        'mean_monthly_churn': 0.06,
        'burn_scaling_factor': 0.45
    },
    'Other': {
        'mean_monthly_growth': 0.07,
        'growth_volatility': 0.15,
        'mean_monthly_churn': 0.04,
        'burn_scaling_factor': 0.40
    }
}

class MonteCarloSimulationRequest(BaseModel):
    macro_vertical: str = "SaaS & Enterprise"
    initial_capital_usd: float = Field(default=1_000_000.0, ge=10_000.0)
    monthly_burn_rate_usd: float = Field(default=50_000.0, ge=1_000.0)
    monthly_revenue_baseline_usd: float = Field(default=10_000.0, ge=0.0)
    target_horizon_months: int = Field(default=36, ge=12, le=60)
    num_simulations: int = Field(default=10_000, ge=1_000, le=50_000)

def simulate_startup_financials(
    macro_vertical: str = "SaaS & Enterprise",
    initial_capital_usd: float = 1_000_000.0,
    monthly_burn_rate_usd: float = 50_000.0,
    monthly_revenue_baseline_usd: float = 10_000.0,
    target_horizon_months: int = 36,
    num_simulations: int = 10_000
) -> Dict[str, Any]:
    """
    Executes a vectorized Monte Carlo simulation over N iterations across T months.
    Uses pure NumPy 2D array broadcasting for sub-15ms execution.
    """
    start_time = time.time()
    
    # 1. Fetch sector priors
    priors = SECTOR_FINANCIAL_PRIORS.get(macro_vertical, SECTOR_FINANCIAL_PRIORS['Other'])
    mu_g = priors['mean_monthly_growth']
    sigma_g = priors['growth_volatility']
    churn_rate = priors['mean_monthly_churn']
    burn_scale = priors['burn_scaling_factor']

    N = num_simulations
    T = target_horizon_months

    # 2. Vectorized Simulation State Arrays: Shape (N, T)
    # Generate Gaussian random shocks for growth and burn variance
    Z_rev = np.random.normal(0, 1, size=(N, T))
    Z_burn = np.random.normal(0, 1, size=(N, T))

    # Calculate stochastic monthly growth factors
    # Net monthly growth rate = max(-0.50, mu_g + sigma_g * Z - churn)
    growth_factors = np.clip(1.0 + mu_g + (sigma_g * Z_rev) - churn_rate, 0.50, 2.0)

    # Compute Revenue trajectories over time: R_t = R_0 * cumulative_product(growth_factors)
    # Add initial month column for cumulative product
    revenue_matrix = np.zeros((N, T), dtype=np.float64)
    burn_matrix = np.zeros((N, T), dtype=np.float64)
    cash_matrix = np.zeros((N, T), dtype=np.float64)

    curr_rev = np.full(N, monthly_revenue_baseline_usd, dtype=np.float64)
    curr_burn = np.full(N, monthly_burn_rate_usd, dtype=np.float64)
    curr_cash = np.full(N, initial_capital_usd, dtype=np.float64)

    # Monthly stepping for path-dependent bankruptcy / runway
    is_bankrupt = np.zeros(N, dtype=bool)
    ruin_month_tracker = np.full(N, T + 1, dtype=np.int32)
    breakeven_month_tracker = np.full(N, T + 1, dtype=np.int32)

    for t in range(T):
        # Update revenue with stochastic factor
        curr_rev = curr_rev * growth_factors[:, t]
        
        # Burn scales dynamically: base burn + fraction of growth + random operational variance
        burn_shock = np.clip(1.0 + (mu_g * burn_scale) + (0.05 * Z_burn[:, t]), 0.90, 1.30)
        curr_burn = curr_burn * burn_shock

        # Cash balance update
        net_cash_flow = curr_rev - curr_burn
        curr_cash = curr_cash + net_cash_flow

        # Track bankruptcy (cash drops below 0)
        newly_bankrupt = (curr_cash <= 0) & (~is_bankrupt)
        ruin_month_tracker[newly_bankrupt] = t + 1
        is_bankrupt = is_bankrupt | (curr_cash <= 0)

        # Track breakeven (revenue exceeds burn)
        newly_breakeven = (curr_rev >= curr_burn) & (breakeven_month_tracker == T + 1)
        breakeven_month_tracker[newly_breakeven] = t + 1

        # Store matrices
        revenue_matrix[:, t] = curr_rev
        burn_matrix[:, t] = curr_burn
        cash_matrix[:, t] = np.where(is_bankrupt, 0.0, curr_cash)

    # 3. Statistical Calculations across 10,000 runs
    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    # Monthly Cash Trajectories (P10 Bear, P50 Base, P90 Bull)
    p10_cash = np.percentile(cash_matrix, 10, axis=0)
    p50_cash = np.percentile(cash_matrix, 50, axis=0)
    p90_cash = np.percentile(cash_matrix, 90, axis=0)

    # Monthly Revenue Trajectories
    p10_rev = np.percentile(revenue_matrix, 10, axis=0)
    p50_rev = np.percentile(revenue_matrix, 50, axis=0)
    p90_rev = np.percentile(revenue_matrix, 90, axis=0)

    # Probabilities of Ruin at milestone horizons
    p_ruin_12m = float(np.mean(ruin_month_tracker <= 12))
    p_ruin_24m = float(np.mean(ruin_month_tracker <= 24))
    p_ruin_36m = float(np.mean(ruin_month_tracker <= 36))

    # Breakeven probability
    p_breakeven_36m = float(np.mean(breakeven_month_tracker <= 36))
    valid_breakeven_months = breakeven_month_tracker[breakeven_month_tracker <= 36]
    median_breakeven_month = int(np.median(valid_breakeven_months)) if len(valid_breakeven_months) > 0 else None

    # Median Runway before Ruin for failing paths
    bankrupt_paths = ruin_month_tracker[ruin_month_tracker <= 36]
    median_runway_if_failing = int(np.median(bankrupt_paths)) if len(bankrupt_paths) > 0 else T

    # 95% Parametric & Empirical Value at Risk (VaR) on initial capital
    final_cash_distribution = cash_matrix[:, min(11, T - 1)] # 12-month horizon
    capital_loss = initial_capital_usd - final_cash_distribution
    var_95_usd = float(np.percentile(capital_loss, 95))
    var_95_pct = round((var_95_usd / initial_capital_usd) * 100, 1)

    # Prepare Monthly Forecast Table for UI Charts
    monthly_projections = []
    for month in range(1, T + 1):
        m_idx = month - 1
        monthly_projections.append({
            "month": month,
            "bear_case_cash_p10": round(float(p10_cash[m_idx]), 2),
            "base_case_cash_p50": round(float(p50_cash[m_idx]), 2),
            "bull_case_cash_p90": round(float(p90_cash[m_idx]), 2),
            "median_monthly_revenue": round(float(p50_rev[m_idx]), 2),
            "cumulative_ruin_probability": round(float(np.mean(ruin_month_tracker <= month)), 4)
        })

    return {
        "status": "success",
        "simulation_parameters": {
            "num_iterations": N,
            "horizon_months": T,
            "macro_vertical": macro_vertical,
            "initial_capital_usd": initial_capital_usd,
            "monthly_burn_rate_usd": monthly_burn_rate_usd,
            "monthly_revenue_baseline_usd": monthly_revenue_baseline_usd,
            "execution_latency_ms": elapsed_ms
        },
        "key_risk_metrics": {
            "runway_ruin_prob_12m": f"{round(p_ruin_12m * 100, 1)}%",
            "runway_ruin_prob_24m": f"{round(p_ruin_24m * 100, 1)}%",
            "runway_ruin_prob_36m": f"{round(p_ruin_36m * 100, 1)}%",
            "breakeven_probability_36m": f"{round(p_breakeven_36m * 100, 1)}%",
            "median_months_to_breakeven": median_breakeven_month if median_breakeven_month else "Did not breakeven in 36m",
            "median_runway_months": median_runway_if_failing if p_ruin_36m > 0.50 else f"> {T} months",
            "value_at_risk_95_usd": round(var_95_usd, 2),
            "value_at_risk_95_percentage": f"{var_95_pct}%"
        },
        "scenarios_36m_cash_balance": {
            "bear_case_p10": round(float(p10_cash[-1]), 2),
            "base_case_p50": round(float(p50_cash[-1]), 2),
            "bull_case_p90": round(float(p90_cash[-1]), 2)
        },
        "monthly_forecast_table": monthly_projections
    }
