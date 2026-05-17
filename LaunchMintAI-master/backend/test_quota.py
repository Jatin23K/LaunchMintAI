import google.generativeai as genai
import os
import time
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)

# Test the model currently in use
model_name = 'gemini-2.5-flash' 
print(f"🧪 Testing Model: {model_name}")

try:
    model = genai.GenerativeModel(model_name)
    print("⏳ Sending simple 'Hello' request...")
    start = time.time()
    response = model.generate_content("Hello, can you hear me?")
    duration = time.time() - start
    print(f"✅ Success! Response time: {duration:.2f}s")
    print(f"📝 Output: {response.text}")
except Exception as e:
    print(f"❌ FAILED. Error: {e}")
