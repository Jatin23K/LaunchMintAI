import os
import asyncio
from dotenv import load_dotenv

# Ensure we are in the right directory to import
import sys
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.market_search import search_market_data

load_dotenv('backend/.env')

async def test_search():
    print("Searching for 'Mental Wellness Platform'...")
    results = search_market_data("Mental Wellness Platform", "mental health apps")
    print("\nTop Source Name:", results.get('top_source_name'))
    print("Top Source URL:", results.get('top_source_url'))
    print("\nSnippets Sample:")
    print(results.get('raw_context')[:1000])

if __name__ == "__main__":
    asyncio.run(test_search())
