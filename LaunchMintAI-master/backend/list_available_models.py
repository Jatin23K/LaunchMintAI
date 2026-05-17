"""
Quick script to list all available Gemini models for your API key
"""
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

# Configure API
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("❌ GEMINI_API_KEY not found in .env file!")
    exit(1)

genai.configure(api_key=api_key)

print("=" * 60)
print("📋 LISTING ALL AVAILABLE GEMINI MODELS")
print("=" * 60)
print()

try:
    models = genai.list_models()
    
    gemini_models = []
    for model in models:
        # Only show models that support generateContent
        if 'generateContent' in model.supported_generation_methods:
            gemini_models.append(model.name)
            print(f"✅ {model.name}")
            print(f"   Display Name: {model.display_name}")
            print(f"   Description: {model.description}")
            print(f"   Supported Methods: {', '.join(model.supported_generation_methods)}")
            print()
    
    if not gemini_models:
        print("⚠️ No models found that support generateContent")
    else:
        print("=" * 60)
        print(f"📊 TOTAL AVAILABLE MODELS: {len(gemini_models)}")
        print("=" * 60)
        print("\n🎯 RECOMMENDED FOR YOUR CODE:")
        print("\nUse one of these in llm_engine.py:")
        for m in gemini_models[:3]:  # Show top 3
            print(f"   model = genai.GenerativeModel('{m.replace('models/', '')}')")
        
except Exception as e:
    print(f"❌ Error listing models: {e}")
    print("\nPossible issues:")
    print("1. Invalid API key")
    print("2. API key doesn't have proper permissions")
    print("3. Network connectivity issue")
