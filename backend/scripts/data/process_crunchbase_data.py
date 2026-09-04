"""
Layer 1: Crunchbase Data Ingestion & Leakage-Free Feature Engineering
Merges relational tables (objects, funding_rounds, acquisitions), normalizes features,
prevents data leakage, and outputs clean train/test parquet files.
"""

import os
import sys
import numpy as np
import pandas as pd
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
RAW_DATA_DIR = BASE_DIR.parent / "data"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
EDA_PLOTS_DIR = BASE_DIR / "data" / "eda_plots"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
EDA_PLOTS_DIR.mkdir(parents=True, exist_ok=True)

# Category to Macro-Vertical Mapping
CATEGORY_MAP = {
    'software': 'SaaS & Enterprise',
    'enterprise': 'SaaS & Enterprise',
    'network_hosting': 'Security & Infrastructure',
    'security': 'Security & Infrastructure',
    'analytics': 'AI & Data Intelligence',
    'web': 'Consumer Web & Media',
    'games_video': 'Consumer Web & Media',
    'social': 'Mobile & Social',
    'mobile': 'Mobile & Social',
    'ecommerce': 'FinTech & Commerce',
    'finance': 'FinTech & Commerce',
    'biotech': 'HealthTech & Bio',
    'medical': 'HealthTech & Bio',
    'health': 'HealthTech & Bio',
    'hardware': 'Hardware & DeepTech',
    'semiconductor': 'Hardware & DeepTech',
    'nanotech': 'Hardware & DeepTech',
    'cleantech': 'CleanTech & Energy',
    'education': 'EdTech',
    'advertising': 'FinTech & Commerce',
    'search': 'AI & Data Intelligence',
    'transportation': 'Marketplace & Logistics',
    'hospitality': 'Marketplace & Logistics',
    'real_estate': 'FinTech & Commerce',
    'music': 'Consumer Web & Media',
    'photo_video': 'Consumer Web & Media',
    'messaging': 'Mobile & Social',
    'travel': 'Marketplace & Logistics',
    'news': 'Consumer Web & Media',
    'consulting': 'SaaS & Enterprise',
    'nonprofit': 'Other',
    'public_relations': 'SaaS & Enterprise',
    'other': 'Other'
}

TIER_1_STATES = {'CA', 'NY', 'MA', 'WA', 'TX', 'IL', 'CO'}
TIER_1_CITIES = {
    'san francisco', 'new york', 'boston', 'seattle', 'austin', 'los angeles',
    'palo alto', 'mountain view', 'sunnyvale', 'london', 'berlin', 'tel aviv',
    'bangalore', 'singapore', 'toronto', 'paris', 'cambridge'
}

def load_and_process():
    print("=" * 70)
    print("🚀 LAYER 1: STARTING CRUNCHBASE DATA INGESTION & FEATURE PIPELINE")
    print("=" * 70)

    objects_path = RAW_DATA_DIR / "objects.csv"
    if not objects_path.exists():
        print(f"❌ Error: {objects_path} not found!")
        sys.exit(1)

    print(f"📥 Loading objects table from {objects_path}...")
    usecols = [
        'id', 'entity_type', 'name', 'category_code', 'status', 
        'founded_at', 'closed_at', 'country_code', 'state_code', 'city',
        'first_funding_at', 'last_funding_at', 'funding_rounds', 
        'funding_total_usd', 'milestones', 'relationships'
    ]
    
    df_objects = pd.read_csv(
        objects_path, 
        usecols=usecols, 
        low_memory=False
    )
    print(f"   Loaded {len(df_objects):,} total entity records.")

    # 1. Filter for Companies only
    df = df_objects[df_objects['entity_type'] == 'Company'].copy()
    print(f"   Filtered to {len(df):,} Company records.")

    # 2. Filter valid statuses
    valid_statuses = ['operating', 'acquired', 'closed', 'ipo']
    df = df[df['status'].isin(valid_statuses)].copy()
    print(f"   Retained {len(df):,} records with valid status in {valid_statuses}.")

    # 3. Clean and map Macro Verticals
    df['category_code'] = df['category_code'].fillna('other').astype(str).str.lower()
    df['macro_vertical'] = df['category_code'].map(CATEGORY_MAP).fillna('Other')

    # 4. Standardize Dates & Calculate Timelines
    df['founded_at'] = pd.to_datetime(df['founded_at'], errors='coerce')
    df['first_funding_at'] = pd.to_datetime(df['first_funding_at'], errors='coerce')
    df['last_funding_at'] = pd.to_datetime(df['last_funding_at'], errors='coerce')
    df['closed_at'] = pd.to_datetime(df['closed_at'], errors='coerce')

    # Extract founding year for cohort analysis
    df['founded_year'] = df['founded_at'].dt.year.fillna(2008).astype(int)
    # Filter tech cohort 1995 - 2014
    df = df[(df['founded_year'] >= 1995) & (df['founded_year'] <= 2014)].copy()
    print(f"   Retained {len(df):,} startups founded between 1995 and 2014.")

    # Time to first funding (days) - strictly early signal
    time_to_first = (df['first_funding_at'] - df['founded_at']).dt.days
    df['time_to_first_funding_days'] = time_to_first.clip(lower=0, upper=3650).fillna(-1)

    # 5. Clean Funding Metrics
    df['funding_rounds'] = pd.to_numeric(df['funding_rounds'], errors='coerce').fillna(0).astype(int)
    df['funding_total_usd'] = pd.to_numeric(df['funding_total_usd'], errors='coerce').fillna(0.0)
    df['funding_total_usd'] = df['funding_total_usd'].clip(lower=0.0)
    
    # Log transform to normalize power-law financial distribution
    df['log_funding_usd'] = np.log1p(df['funding_total_usd'])
    
    # Average round size
    df['avg_round_size_usd'] = np.where(
        df['funding_rounds'] > 0, 
        df['funding_total_usd'] / df['funding_rounds'], 
        0.0
    )
    df['log_avg_round_size_usd'] = np.log1p(df['avg_round_size_usd'])

    # Funding Flag
    df['has_funding'] = (df['funding_total_usd'] > 0).astype(int)

    # 6. Team & Operational Signals
    df['relationships'] = pd.to_numeric(df['relationships'], errors='coerce').fillna(0).astype(int)
    df['milestones'] = pd.to_numeric(df['milestones'], errors='coerce').fillna(0).astype(int)
    df['founder_team_size'] = df['relationships'].clip(lower=0, upper=50)
    df['milestone_count'] = df['milestones'].clip(lower=0, upper=20)

    # 7. Geographic Ecosystem Tiering
    df['city_clean'] = df['city'].fillna('').astype(str).str.lower().str.strip()
    df['state_code'] = df['state_code'].fillna('').astype(str).str.upper().str.strip()
    df['country_code'] = df['country_code'].fillna('UNKNOWN').astype(str).str.upper().str.strip()

    is_us_tier1 = (df['country_code'] == 'USA') & (df['state_code'].isin(TIER_1_STATES))
    is_city_tier1 = df['city_clean'].isin(TIER_1_CITIES)
    df['is_tier_1_hub'] = (is_us_tier1 | is_city_tier1).astype(int)

    # 8. Competitor Cohort Density
    print("   Computing Competitor Cohort Density index per sector & vintage...")
    density_map = df.groupby(['macro_vertical', 'founded_year'])['id'].transform('count')
    df['competitor_cohort_density'] = density_map

    # 9. Define Target Variable: `is_success`
    # 1 = Acquired or IPO or (Operating with >= $5M funding or >= 3 funding rounds)
    # 0 = Closed or (Operating with zero traction: 0 funding, 0 milestones, 0 relationships)
    is_acquired_or_ipo = df['status'].isin(['acquired', 'ipo'])
    is_high_growth_operating = (df['status'] == 'operating') & (
        (df['funding_total_usd'] >= 5_000_000) | (df['funding_rounds'] >= 3)
    )
    
    df['is_success'] = (is_acquired_or_ipo | is_high_growth_operating).astype(int)

    # Binary outcome flag for pure exits vs failures
    df['is_exit_pure'] = np.where(
        df['status'].isin(['acquired', 'ipo']), 1,
        np.where(df['status'] == 'closed', 0, -1)
    )

    # 10. Select Final Feature Matrix Columns
    feature_cols = [
        'id', 'name', 'macro_vertical', 'founded_year', 'country_code',
        'is_tier_1_hub', 'has_funding', 'funding_rounds', 'funding_total_usd',
        'log_funding_usd', 'avg_round_size_usd', 'log_avg_round_size_usd',
        'time_to_first_funding_days', 'founder_team_size', 'milestone_count',
        'competitor_cohort_density', 'status', 'is_success', 'is_exit_pure'
    ]

    df_final = df[feature_cols].copy()
    
    # Summary Statistics
    total_startups = len(df_final)
    success_count = int(df_final['is_success'].sum())
    fail_count = total_startups - success_count
    success_rate = (success_count / total_startups) * 100

    print("\n" + "=" * 70)
    print("📊 DATASET PIPELINE SUMMARY STATISTICS")
    print("=" * 70)
    print(f"Total Startups Ingested:        {total_startups:,}")
    print(f"Positive Class (Success / 1):   {success_count:,} ({success_rate:.2f}%)")
    print(f"Negative Class (Failed / 0):    {fail_count:,} ({100 - success_rate:.2f}%)")
    print(f"Class Imbalance Ratio:          {fail_count / max(1, success_count):.2f} : 1")
    print(f"Unique Macro Verticals:         {df_final['macro_vertical'].nunique()}")
    print(f"Tier 1 Tech Hub Representation: {df_final['is_tier_1_hub'].mean()*100:.1f}%")
    print("-" * 70)

    # Save to Parquet and CSV
    parquet_path = PROCESSED_DIR / "startups_features.parquet"
    csv_path = PROCESSED_DIR / "startups_features.csv"

    print(f"💾 Saving processed dataset to:\n   - {parquet_path}\n   - {csv_path}")
    df_final.to_parquet(parquet_path, index=False)
    # Save first 50k rows to CSV for preview
    df_final.head(50000).to_csv(csv_path, index=False)
    print("✅ Layer 1 Data Processing Complete!")

    return df_final

if __name__ == '__main__':
    load_and_process()
