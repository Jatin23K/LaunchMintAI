import requests
import concurrent.futures
import time
import re
import sys
from statistics import mean

# ==============================================================================
# CONFIGURATION
# ==============================================================================
API_URL = "http://127.0.0.1:8000/analyze"

# SCORE WEIGHTS
WEIGHT_STABILITY = 0.4  # 40% - Did it crash?
WEIGHT_QUALITY = 0.4    # 40% - Is the data real?
WEIGHT_SPEED = 0.2      # 20% - Was it fast?

# THRESHOLDS
MAX_ACCEPTABLE_TIME = 15.0 # Seconds (generous because of retry logic)
MIN_COMPETITORS = 3

# TERMINAL COLORS
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

# ==============================================================================
# TEST ENGINE
# ==============================================================================

class TestResult:
    def __init__(self, request_id, input_text):
        self.id = request_id
        self.input = input_text
        self.success = False
        self.score = 0
        self.data_quality_score = 0
        self.speed_score = 0
        self.duration = 0
        self.notes = []

def validate_response(result, response, duration):
    result.duration = duration
    
    # 1. STABILITY CHECK (Pass/Fail)
    if response.status_code != 200:
        result.notes.append(f"CRASH: Status {response.status_code}")
        return result
    
    try:
        data = response.json()
    except:
        result.notes.append("JSON Parse Error")
        return result

    result.success = True
    
    # 2. DATA QUALITY CHECK (0-100)
    quality_points = 0
    total_quality_checks = 4
    
    # Check A: No Demo Data Leak
    if "Rover" in str(data) or "Wag!" in str(data):
        result.notes.append("❌ DEMO DATA LEAK DETECTED")
        return result # Immediate fail on data quality
    else:
        quality_points += 1

    # Check B: Valid Market Size Format ($XX B)
    mkt_size = data.get("market", {}).get("size", "")
    if re.match(r"^\$[0-9]+(\.[0-9]+)?B$", mkt_size):
        quality_points += 1
    elif mkt_size == "Data Unavailable":
        result.notes.append("⚠️ Data Unavailable (Handled Safely)")
        quality_points += 0.5 # Partial credit for handling it gracefully
    else:
        result.notes.append(f"❌ Bad Market Size Format: {mkt_size}")

    # Check C: Competitor Count
    comps = data.get("competitors", [])
    if len(comps) >= 3:
        quality_points += 1
    else:
        result.notes.append(f"❌ Low Competitors: Found {len(comps)}")

    # Check D: Growth Rate
    growth = data.get("market", {}).get("growth", "")
    if "%" in growth:
        quality_points += 1
    else:
        result.notes.append(f"❌ Invalid Growth Rate: {growth}")

    result.data_quality_score = (quality_points / total_quality_checks) * 100

    # 3. SPEED CHECK (0-100)
    # < 5s = 100%, < 10s = 80%, < 15s = 50%, > 15s = 0%
    if duration < 5: result.speed_score = 100
    elif duration < 10: result.speed_score = 80
    elif duration < 15: result.speed_score = 50
    else: result.speed_score = 10
    
    # CALCULATE FINAL WEIGHTED SCORE
    # If request failed, score is 0. If success, calculate weighted average.
    result.score = (
        (100 * WEIGHT_STABILITY) + 
        (result.data_quality_score * WEIGHT_QUALITY) + 
        (result.speed_score * WEIGHT_SPEED)
    )
    
    return result

def send_test(idea, request_id):
    result = TestResult(request_id, idea)
    start = time.time()
    try:
        print(f"{CYAN}🚀 Sending [{request_id}]: {idea}...{RESET}")
        res = requests.post(API_URL, json={"idea": idea}, timeout=60)
        duration = round(time.time() - start, 2)
        return validate_response(result, res, duration)
    except Exception as e:
        result.notes.append(f"Network Error: {str(e)}")
        result.duration = round(time.time() - start, 2)
        return result

# ==============================================================================
# MAIN EXECUTION
# ==============================================================================

def run_grader():
    print(f"{BOLD}🔥 LAUNCHMINT AI BACKEND: STRESS & VALIDATION TEST 🔥{RESET}\n")

    results = []
    
    # ---------------------------------------------------------
    # SCENARIO 1: The "Happy Path" (Standard Input)
    # ---------------------------------------------------------
    results.append(send_test("Online Taxi India", "TEST-01"))

    # ---------------------------------------------------------
    # SCENARIO 2: The "Niche Market" (Hard to find data)
    # ---------------------------------------------------------
    results.append(send_test("SaaS for Ant Farming Optimization", "TEST-02"))

    # ---------------------------------------------------------
    # SCENARIO 3: The "Traffic Spike" (5 Concurrent Users)
    # ---------------------------------------------------------
    print(f"\n{YELLOW}⚡ STARTING TRAFFIC SPIKE (5 Requests at once)...{RESET}")
    stress_ideas = [
        "Drone Delivery Logistics", 
        "VR Education Platform", 
        "Fintech for Teenagers",
        "Bio-degradable Packaging",
        "AI Legal Assistant"
    ]
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(send_test, idea, f"STRESS-{i+1}"): idea for i, idea in enumerate(stress_ideas)}
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())

    # ==============================================================================
    # REPORT CARD
    # ==============================================================================
    print("\n" + "="*60)
    print(f"{BOLD}📊 FINAL REPORT CARD{RESET}")
    print("="*60)
    
    total_score = 0
    passed_count = 0
    
    print(f"{'ID':<10} {'STATUS':<10} {'TIME':<8} {'SCORE':<8} {'NOTES'}")
    print("-" * 60)
    
    for r in results:
        status_color = GREEN if r.success else RED
        status_text = "PASS" if r.success else "FAIL"
        
        # Color score
        score_color = GREEN
        if r.score < 70: score_color = YELLOW
        if r.score < 50: score_color = RED
        
        print(f"{r.id:<10} {status_color}{status_text:<10}{RESET} {r.duration}s    {score_color}{int(r.score)}/100{RESET}   {', '.join(r.notes)}")
        
        total_score += r.score
        if r.success: passed_count += 1

    avg_score = total_score / len(results)
    
    # FINAL GRADE
    grade = "F"
    if avg_score >= 90: grade = "A+"
    elif avg_score >= 80: grade = "A"
    elif avg_score >= 70: grade = "B"
    elif avg_score >= 60: grade = "C"
    elif avg_score >= 50: grade = "D"
    
    grade_color = GREEN if avg_score >= 70 else RED
    
    print("="*60)
    print(f"REQUESTS: {len(results)} | SUCCESS: {passed_count} | FAIL: {len(results) - passed_count}")
    print(f"AVERAGE LATENCY: {round(mean([r.duration for r in results]), 2)}s")
    print(f"{BOLD}FINAL SYSTEM GRADE: {grade_color}{grade} ({int(avg_score)}%){RESET}")
    print("="*60)

if __name__ == "__main__":
    try:
        requests.get("http://127.0.0.1:8000/docs", timeout=2)
    except:
        print(f"{RED}❌ Backend is OFFLINE. Please start it first.{RESET}")
        sys.exit(1)
        
    run_grader()