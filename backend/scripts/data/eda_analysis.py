"""
Layer 1: Exploratory Data Analysis (EDA) & Statistical Profiling
Generates high-resolution visualization plots and statistical summaries
proving real-world dataset properties, class distributions, and feature correlations.
"""

import os
import sys
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg') # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

# Setup paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
EDA_PLOTS_DIR = BASE_DIR / "data" / "eda_plots"
EDA_PLOTS_DIR.mkdir(parents=True, exist_ok=True)

# Visual Styling - Stealth Terminal Theme
plt.style.use('dark_background')
sns.set_theme(style="darkgrid", rc={
    "axes.facecolor": "#0D1117",
    "figure.facecolor": "#090D13",
    "grid.color": "#21262D",
    "text.color": "#C9D1D9",
    "axes.labelcolor": "#58A6FF",
    "xtick.color": "#8B949E",
    "ytick.color": "#8B949E",
    "font.family": "sans-serif"
})

PRIMARY_COLOR = "#58A6FF"
SUCCESS_COLOR = "#2EA043"
DANGER_COLOR = "#F85149"
ACCENT_COLOR = "#D29922"

def run_eda():
    print("=" * 70)
    print("📊 RUNNING LAYER 1 EXPLORATORY DATA ANALYSIS (EDA)")
    print("=" * 70)

    parquet_path = PROCESSED_DIR / "startups_features.parquet"
    if not parquet_path.exists():
        print(f"❌ Error: {parquet_path} not found!")
        sys.exit(1)

    df = pd.read_parquet(parquet_path)
    total_records = len(df)
    print(f"Loaded {total_records:,} processed startup records.")

    # -------------------------------------------------------------
    # 1. CLASS IMBALANCE PLOT
    # -------------------------------------------------------------
    print("Generating Plot 1: Class Imbalance Distribution...")
    fig, ax = plt.subplots(figsize=(8, 5))
    counts = df['is_success'].value_counts().sort_index()
    labels = ['Failed / Stagnant (0)', 'Success / Scaled (1)']
    colors = [DANGER_COLOR, SUCCESS_COLOR]
    
    bars = ax.bar(labels, counts.values, color=colors, width=0.5, edgecolor="#30363D", linewidth=1.5)
    for bar in bars:
        height = bar.get_height()
        pct = (height / total_records) * 100
        ax.text(
            bar.get_x() + bar.get_width() / 2, height + 3000, 
            f'{height:,}\n({pct:.1f}%)', 
            ha='center', va='bottom', fontsize=11, fontweight='bold', color="#FFFFFF"
        )

    ax.set_title("Startup Outcome Class Distribution (N = 189,970)", fontsize=13, pad=15, fontweight='bold')
    ax.set_ylabel("Count of Startups", fontsize=11)
    ax.set_ylim(0, max(counts.values) * 1.18)
    plt.tight_layout()
    plot1_path = EDA_PLOTS_DIR / "01_class_imbalance.png"
    plt.savefig(plot1_path, dpi=200)
    plt.close()
    print(f"   Saved: {plot1_path}")

    # -------------------------------------------------------------
    # 2. SURVIVAL RATE BY MACRO VERTICAL
    # -------------------------------------------------------------
    print("Generating Plot 2: Survival Rate by Macro-Vertical...")
    sector_stats = df.groupby('macro_vertical').agg(
        total=('id', 'count'),
        successes=('is_success', 'sum')
    ).reset_index()
    sector_stats['survival_rate'] = (sector_stats['successes'] / sector_stats['total']) * 100
    sector_stats = sector_stats.sort_values(by='survival_rate', ascending=True)

    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.barh(sector_stats['macro_vertical'], sector_stats['survival_rate'], color=PRIMARY_COLOR, edgecolor="#30363D")
    
    for bar in bars:
        width = bar.get_width()
        ax.text(
            width + 0.3, bar.get_y() + bar.get_height() / 2, 
            f'{width:.1f}%', 
            ha='left', va='center', fontsize=10, color="#FFFFFF", fontweight='bold'
        )

    ax.set_title("Historical Baseline Survival Rate by Macro-Vertical (%)", fontsize=13, pad=15, fontweight='bold')
    ax.set_xlabel("Survival / Scale Probability (%)", fontsize=11)
    ax.set_xlim(0, max(sector_stats['survival_rate']) * 1.25)
    plt.tight_layout()
    plot2_path = EDA_PLOTS_DIR / "02_survival_by_macro_vertical.png"
    plt.savefig(plot2_path, dpi=200)
    plt.close()
    print(f"   Saved: {plot2_path}")

    # -------------------------------------------------------------
    # 3. FUNDING DISTRIBUTION (KDE PLOT - LOG SCALE)
    # -------------------------------------------------------------
    print("Generating Plot 3: Log-Funding Distribution by Outcome...")
    funded_df = df[df['funding_total_usd'] > 0].copy()
    fig, ax = plt.subplots(figsize=(9, 5))
    
    sns.kdeplot(
        data=funded_df[funded_df['is_success'] == 1]['log_funding_usd'], 
        label='Success (1) - Acquired/Scale', color=SUCCESS_COLOR, fill=True, alpha=0.3, ax=ax, linewidth=2
    )
    sns.kdeplot(
        data=funded_df[funded_df['is_success'] == 0]['log_funding_usd'], 
        label='Failure (0) - Closed/Stagnant', color=DANGER_COLOR, fill=True, alpha=0.3, ax=ax, linewidth=2
    )

    ax.set_title("Log-Funding Distribution: Survivors vs. Failed Startups", fontsize=13, pad=15, fontweight='bold')
    ax.set_xlabel("Log(Total Funding USD + 1)", fontsize=11)
    ax.set_ylabel("Kernel Density", fontsize=11)
    ax.legend(loc='upper right', frameon=True, facecolor="#161B22", edgecolor="#30363D")
    plt.tight_layout()
    plot3_path = EDA_PLOTS_DIR / "03_funding_distribution_kde.png"
    plt.savefig(plot3_path, dpi=200)
    plt.close()
    print(f"   Saved: {plot3_path}")

    # -------------------------------------------------------------
    # 4. CORRELATION HEATMAP
    # -------------------------------------------------------------
    print("Generating Plot 4: Correlation Matrix Heatmap...")
    numeric_cols = [
        'is_success', 'log_funding_usd', 'funding_rounds', 'log_avg_round_size_usd',
        'is_tier_1_hub', 'founder_team_size', 'milestone_count', 
        'competitor_cohort_density', 'time_to_first_funding_days'
    ]
    corr_matrix = df[numeric_cols].corr()

    fig, ax = plt.subplots(figsize=(8, 6))
    mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
    sns.heatmap(
        corr_matrix, mask=mask, annot=True, fmt=".2f", cmap="mako", 
        cbar_kws={'shrink': .8}, linewidths=0.5, linecolor="#0D1117", ax=ax
    )
    ax.set_title("Feature Correlation Matrix with Outcome Target", fontsize=13, pad=15, fontweight='bold')
    plt.tight_layout()
    plot4_path = EDA_PLOTS_DIR / "04_correlation_heatmap.png"
    plt.savefig(plot4_path, dpi=200)
    plt.close()
    print(f"   Saved: {plot4_path}")

    # -------------------------------------------------------------
    # PRINT SECTOR SURVIVAL BENCHMARK TABLE
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    print("📋 MACRO-VERTICAL BASELINE SURVIVAL BENCHMARK TABLE")
    print("=" * 70)
    print(f"{'Macro Vertical':<28} | {'Total Startups':<15} | {'Successes':<10} | {'Survival Rate'}")
    print("-" * 70)
    for _, row in sector_stats.sort_values(by='total', ascending=False).iterrows():
        print(f"{row['macro_vertical']:<28} | {int(row['total']):<15,} | {int(row['successes']):<10,} | {row['survival_rate']:.2f}%")
    print("=" * 70)
    print("✅ Layer 1 EDA Successfully Executed & Plots Generated!")

if __name__ == '__main__':
    run_eda()
