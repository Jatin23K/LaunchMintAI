import asyncio
import httpx
import time
import json
import csv
import random
import os
from dotenv import load_dotenv
from loguru import logger

load_dotenv()
# --- MULTI-KEY ROTATION FOR JUDGE ---
raw_keys = [
    os.getenv("GEMINI_API_KEY"),
    os.getenv("GEMINI_API_KEY_1"),
    os.getenv("GEMINI_API_KEY_2"),
    os.getenv("GEMINI_API_KEY_3")
]
API_KEYS = list(set([k for k in raw_keys if k]))
key_index = 0

def get_next_key():
    global key_index
    if not API_KEYS: return os.getenv("GEMINI_API_KEY")
    key = API_KEYS[key_index % len(API_KEYS)]
    key_index += 1
    return key

TARGET_URL = "http://127.0.0.1:8000/analyze"

RAW_SEEDS = [
    "Uber for {target}", "Netflix for {target}", "SaaS for {target} optimization",
    "AI-powered {target} assistant", "Decentralized {target} market"
]

TARGETS = [
    "dog walkers", "space miners", "plumbers", "legal firms", "drone pilots"
]

def generate_ideas(count=1000):
    ideas = []
    while len(ideas) < count:
        seed = random.choice(RAW_SEEDS)
        target = random.choice(TARGETS)
        idea = seed.format(target=target)
        if idea not in ideas:
            ideas.append(idea)
    return ideas

async def judge_response(idea, report):
    key = get_next_key()
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key={key}"
    
    report_summary = {
        "market": report.get("market"),
        "verdict": report.get("god_mode", {}).get("macro_verdict"),
        "competitors": len(report.get("competitors", []))
    }

    judge_prompt = f"""
    RATE THIS STARTUP REPORT (1-10): "{idea}"
    DATA: {json.dumps(report_summary)}
    
    CRITERIA: 
    1. Realistic TAM numbers? 
    2. Professional tone? 
    3. Competitors identified?
    
    OUTPUT JSON ONLY: {{"score": float, "reason": "why"}}
    """
    
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(url, json={ "contents": [{ "parts": [{"text": judge_prompt}] }] }, timeout=30.0)
            if res.status_code == 200:
                raw_text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                clean_text = raw_text.replace("```json", "").replace("```", "").strip()
                return json.loads(clean_text)
            return {"score": 0, "reason": f"Judge 429/Err: {res.status_code}"}
        except Exception as e:
            return {"score": 0, "reason": f"Judge Timeout/Error: {e}"}

async def stress_worker(worker_id, idea_queue, results, progress):
    async with httpx.AsyncClient() as client:
        while not idea_queue.empty():
            idea = await idea_queue.get()
            start_time = time.time()
            try:
                response = await client.post(TARGET_URL, json={"idea": idea}, timeout=120.0)
                duration = time.time() - start_time
                if response.status_code == 200:
                    rating = await judge_response(idea, response.json())
                    result = {"idea": idea, "status": "PASS", "latency": f"{duration:.2f}s", "score": rating.get("score", 0), "critique": rating.get("reason", "N/A")}
                else:
                    result = {"idea": idea, "status": f"FAIL ({response.status_code})", "latency": f"{duration:.2f}s", "score": 0, "critique": response.text[:100]}
            except Exception as e:
                result = {"idea": idea, "status": "ERROR", "latency": f"60s+", "score": 0, "critique": str(e)[:100]}
            
            results.append(result)
            progress["done"] += 1
            color = "🟢" if "PASS" in result["status"] else "🔴"
            logger.info(f"{color} [W{worker_id}] {progress['done']}/{progress['total']} | Score: {result['score']}/10 | {idea}")
            await asyncio.sleep(2)
            idea_queue.task_done()

async def main(num_requests=25, workers_count=2):
    logger.info(f"🔥 STARTING PLATINUM AUDIT: {num_requests} Requests")
    ideas = generate_ideas(num_requests)
    queue = asyncio.Queue()
    for idea in ideas: await queue.put(idea)
    results = []
    progress = {"done": 0, "total": num_requests}
    workers = [stress_worker(i, queue, results, progress) for i in range(workers_count)]
    await asyncio.gather(*workers)
    
    passed = [r for r in results if r["status"] == "PASS"]
    avg_score = sum([r["score"] for r in passed]) / len(passed) if passed else 0
    print(f"\n⭐ FINAL SCORE: {avg_score:.1f}/10 | SUCCESS: {len(passed)}/{num_requests}")

if __name__ == "__main__":
    import sys
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    workers = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    asyncio.run(main(count, workers))
