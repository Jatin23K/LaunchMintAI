import sys
import os

# Add the backend directory to sys.path so we can import app modules
import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.llm_engine import classify_industry, API_KEY

def test_ideas():
    ideas = [
        "Netflix for Education",
        "Uber for Dog Walking",
        "Airbnb for Teslas",
        "Tinder for Co-founders"
    ]
    
    print(f"🔑 Using API Key: {API_KEY[:5]}...{API_KEY[-4:] if API_KEY else 'None'}")
    
    for idea in ideas:
        print(f"\n🧪 Testing Idea: '{idea}'")
        try:
            result = classify_industry(idea)
            print(f"✅ Result: {result}")
            if result.get("parent_industry") == "Tech Startup" and result.get("search_term") == idea:
                print("⚠️  WARNING: FALLBACK TRIGGERED")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_ideas()
