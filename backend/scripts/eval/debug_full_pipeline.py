import sys
import os
import logging

# Configure logging to monitor the flow
logging.basicConfig(level=logging.INFO)

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.llm_engine import classify_industry
from app.services.market_search import search_market_data

def debug_pipeline():
    idea = "Netflix for Education"
    print(f"\n🧪 1. TESTING TRANSLATOR for '{idea}'...")
    
    try:
        industry_data = classify_industry(idea)
        print(f"✅ Classified: {industry_data}")
        search_term = industry_data.get("search_term", idea)
    except Exception as e:
        print(f"❌ Translator Failed: {e}")
        search_term = idea

    print(f"\n🧪 2. TESTING WATERFALL SEARCH for '{search_term}'...")
    try:
        # We pass search_term as 'industry' per the new signature
        results = search_market_data(idea, industry=search_term)
        
        print(f"✅ Results Count: {results.get('results_count')}")
        print(f"✅ Source Tier: {results.get('top_source_name')}")
        print(f"✅ Top URL: {results.get('top_source_url')}")
        print(f"📄 RAW CONTEXT SNIPPEX (First 500 chars):\n{results.get('raw_context')[:500]}...")
        
    except Exception as e:
        print(f"❌ Search Failed: {e}")

if __name__ == "__main__":
    debug_pipeline()
