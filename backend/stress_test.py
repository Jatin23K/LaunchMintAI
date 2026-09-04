import requests
import json
import time

BASE_URL = "http://localhost:8000"

def run_test(test_name, idea):
    print(f"\n--- Running {test_name} ---")
    payload = {"idea": idea}
    try:
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/analyze", json=payload, timeout=70)
        duration = time.time() - start_time
        print(f"Status Code: {response.status_code}")
        print(f"Time Taken: {duration:.2f}s")
        try:
            print(json.dumps(response.json(), indent=2))
        except:
            print(f"Non-JSON response: {response.text[:500]}")
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    # Test 1: Invisible Data
    run_test("Test 1: Invisible Data (Martian Soil)", "AI-Powered Martian Soil Desalination market 2026")

    # Test 3: Unit Scale (Keyboard switches - Millions)
    run_test("Test 3: Unit Scale (Artisanal Keyboard Switches)", "High-end artisanal mechanical keyboard switches market size")
