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

BASE_URL = "http://127.0.0.1:8000"

ENDPOINTS = {
    "STRATEGIST": "/analyze",
    "SPY": "/war_room",
    "SKEPTIC": "/vc_roast",
    "SALESMAN": "/pitch_forge"
}

IDEAS = [
    "Uber for dog walkers", "AI debt collector for small business", 
    "Decentralized space mining insurance", "Netflix for indie hackers",
    "Solar powered crypto mining rig"
]

async def judge_quad(pillar, idea, response_data):
    key = get_next_key()
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key={key}"
    
    prompts = {
        "STRATEGIST": f"Rate this Strategic Market Report for '{idea}'. Check for: 1. Realistic TAM numbers. 2. Specific competitor links. 3. Professional tone.",
        "SPY": f"Rate this Competitive War Room report for '{idea}'. Check for: 1. Tactical 'Kill Strategies'. 2. Feasible bootstrap steps. 3. Zero generic advice.",
        "SKEPTIC": f"Rate this VC Roast for '{idea}'. Check for: 1. Brutal honesty. 2. Logic-grounded critiques. 3. No compliments.",
        "SALESMAN": f"Rate these Sales Assets for '{idea}'. Check for: 1. Punchy taglines. 2. No AI buzzwords (like 'leverage'). 3. High-conversion scripts."
    }
    
    judge_prompt = f"""
    YOU ARE THE OMEGA JUDGE.
    PILLAR: {pillar}
    TARGET: {idea}
    DATA: {json.dumps(response_data)}
    
    CRITERIA: {prompts.get(pillar)}
    
    OUTPUT JSON ONLY: {{"score": float, "reason": "short sentence"}}
    """
    
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(url, json={ "contents": [{ "parts": [{"text": judge_prompt}] }] }, timeout=30.0)
            if res.status_code == 200:
                raw_text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(raw_text.replace("```json", "").replace("```", "").strip())
            return {"score": 0, "reason": f"Judge API Error: {res.status_code}"}
        except:
            return {"score": 0, "reason": "Judge Timeout"}

async def stress_worker(worker_id, task_queue, results):
    async with httpx.AsyncClient() as client:
        while not task_queue.empty():
            pillar, idea = await task_queue.get()
            url = f"{BASE_URL}{ENDPOINTS[pillar]}"
            payload = {"idea": idea} if pillar != "SKEPTIC" and pillar != "SALESMAN" else {"user_idea": idea}
            
            start = time.time()
            try:
                # 120s timeout because Strategist/Spy do deep research
                res = await client.post(url, json=payload, timeout=120.0)
                latency = time.time() - start
                
                if res.status_code == 200:
                    audit = await judge_quad(pillar, idea, res.json())
                    results.append({"pillar": pillar, "idea": idea, "status": "PASS", "score": audit["score"], "latency": latency})
                    logger.info(f"🟢 [W{worker_id}] {pillar} | Score: {audit['score']}/10 | {idea[:20]}...")
                else:
                    results.append({"pillar": pillar, "idea": idea, "status": f"FAIL ({res.status_code})", "score": 0, "latency": latency})
                    logger.warning(f"🔴 [W{worker_id}] {pillar} | FAIL {res.status_code}")
            except Exception as e:
                results.append({"pillar": pillar, "idea": idea, "status": "ERROR", "score": 0, "latency": 120})
                logger.error(f"💀 [W{worker_id}] {pillar} | CRASH: {str(e)[:50]}")
            
            await asyncio.sleep(1)
            task_queue.task_done()

async def main():
    logger.info("🚀 INITIATING OMEGA QUAD-PILLAR STRESS TEST")
    queue = asyncio.Queue()
    results = []
    
    # Generate 40 tasks (10 for each pillar)
    for pillar in ENDPOINTS.keys():
        for _ in range(10):
            await queue.put((pillar, random.choice(IDEAS)))
            
    workers = [stress_worker(i, queue, results) for i in range(5)]
    await asyncio.gather(*workers)
    
    # SUMMARY
    print("\n" + "="*50)
    print("🏆 FINAL OMEGA AUDIT RESULTS")
    print("="*50)
    for pillar in ENDPOINTS.keys():
        p_res = [r for r in results if r["pillar"] == pillar and r["status"] == "PASS"]
        avg = sum([r["score"] for r in p_res]) / len(p_res) if p_res else 0
        print(f"🔹 {pillar:10} | Success: {len(p_res)}/10 | Avg Score: {avg:.1f}/10")
    print("="*50)

if __name__ == "__main__":
    asyncio.run(main())
