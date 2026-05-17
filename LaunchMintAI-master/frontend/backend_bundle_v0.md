# Backend Bundle for v0.dev

Use this code to understand the logic and agent architecture of LaunchMint AI.

## requirements.txt
```txt
fastapi
uvicorn
python-dotenv
google-generativeai
pydantic
httpx
beautifulsoup4
playwright
```

## app/main.py
```python
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import importlib
import os
import sys

# Import System Design Demo Classes
from app.services.tech_demo import TaskManager, IdeaBrain, SmartLookup, ActionHistory, FeedSorter

# Global Instances for Demo
task_manager = TaskManager()
idea_brain = IdeaBrain()
smart_lookup = SmartLookup()
action_history = ActionHistory()
feed_sorter = FeedSorter()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtensionRequest(BaseModel):
    extension_id: str
    payload: str

# Dynamic Extension Loader
EXTENSIONS = {}
EXTENSION_DIR = os.path.join(os.path.dirname(__file__), "extensions")

print(f"📂 Loading extensions from: {EXTENSION_DIR}")
for folder in os.listdir(EXTENSION_DIR):
    folder_path = os.path.join(EXTENSION_DIR, folder)
    if os.path.isdir(folder_path):
        try:
            module = importlib.import_module(f"app.extensions.{folder}.extension")
            if hasattr(module, "Extension"):
                EXTENSIONS[folder] = module.Extension()
                print(f"   ✅ Loaded: {folder}")
        except Exception as e:
            print(f"   ❌ Failed {folder}: {e}")

@app.get("/")
def home():
    return {"status": "LaunchMint AI Backend Running", "modules": list(EXTENSIONS.keys())}

@app.post("/run")
async def run_extension(req: ExtensionRequest):
    ext_id = req.extension_id.replace("_", "-") 
    print(f"🚀 REQ: {ext_id}")
    
    # Try normalizing the ID (e.g. MarketAgent -> market_research)
    if ext_id == "MarketAgent": ext_id = "market_research"
    if ext_id == "CompetitorAgent": ext_id = "competitor_deepdive"
    if ext_id == "StrategyAgent": ext_id = "business_model"
    if ext_id == "CriticAgent": ext_id = "risk_scanner"
    
    if ext_id not in EXTENSIONS:
        # Fallback for demo purposes if exact match missing
        return {"status": "error", "message": f"Extension {ext_id} not found."}
    
    try:
        result = EXTENSIONS[ext_id].execute(req.payload)
        return {"status": "success", "data": result}
    except Exception as e:
        print(f"   💀 ERROR: {e}")
        return {"status": "error", "data": {"error": str(e)}}

# --- SYSTEM DESIGN DEMO ENDPOINTS ---

@app.post("/demo/tasks/add")
def add_task(priority: int = Body(...), task: str = Body(...)):
    task_manager.add_task(priority, task)
    return {"status": "added", "heap": task_manager.show_heap()}

@app.get("/demo/tasks/next")
def next_task():
    task = task_manager.pop_task()
    return {"task": task}

@app.post("/demo/ideas/connect")
def connect_ideas(idea1: str = Body(...), idea2: str = Body(...)):
    idea_brain.add_connection(idea1, idea2)
    return {"status": "connected", "graph": idea_brain.show_graph()}

@app.get("/demo/ideas/related")
def get_related(idea: str):
    return {"related": idea_brain.get_related(idea)}

@app.post("/demo/search/add")
def add_search_term(db_id: str = Body(...), content: str = Body(...)):
    smart_lookup.add_item(db_id, content)
    return {"status": "indexed"}

@app.get("/demo/search/find")
def find_term(db_id: str):
    return {"result": smart_lookup.get_item(db_id)}

@app.post("/demo/history/act")
def perform_action(action: str = Body(...)):
    action_history.do_action(action)
    return {"status": "action_recorded", "stack": action_history.show_stack()}

@app.get("/demo/history/undo")
def undo_action():
    return {"undone": action_history.undo()}

@app.post("/demo/feed/sort")
def sort_feed(items: list[dict] = Body(...)):
    # Expects items with 'timestamp'
    sorted_items = feed_sorter.sort_feed(items)
    return {"sorted": sorted_items}
```

## app/services/llm_engine.py
```python
import google.generativeai as genai
import os
import json
import time
import threading
from dotenv import load_dotenv

load_dotenv()

class LLMEngine:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(LLMEngine, cls).__new__(cls)
                    cls._instance.initialize()
        return cls._instance

    def initialize(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.model = None
        self.last_call_time = 0
        self.lock = threading.Lock()
        
        if self.api_key:
            genai.configure(api_key=self.api_key)
            # Using 2.0 Flash Exp for stability
            self.model = genai.GenerativeModel('gemini-2.0-flash-exp') 
            print("✨ Gemini 2.0 Engine Initialized")
        else:
            print("⚠️ GOOGLE_API_KEY missing.")

    def analyze(self, prompt: str, system_role: "You are a helpful assistant.") -> str:
        if not self.model:
            return json.dumps({"error": "API Key Missing"})

        with self.lock:
            # Smart Pacing: Ensure minimum 10s gap (Strict Safety for keys)
            elapsed = time.time() - self.last_call_time
            if elapsed < 10:
                wait = 10 - elapsed
                print(f"⚡ Pacing flow: Waiting {wait:.1f}s...")
                time.sleep(wait)

            full_prompt = f"{system_role}\n\nTask:\n{prompt}"
            
            try:
                self.last_call_time = time.time() # Update time BEFORE call to be safe
                response = self.model.generate_content(
                    full_prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                return response.text
            except Exception as e:
                print(f"🔥 LLM Error: {e}")
                # Exponential backoff retry logic could go here
                return json.dumps({"error": str(e)})

llm = LLMEngine()
```

## app/services/tech_demo.py
```python
import heapq
from collections import deque

# 1. PRIORITY QUEUE (Max-Heap) for Task Management
class TaskManager:
    def __init__(self):
        self.heap = [] # Stores (-priority, task_name) because Python is min-heap

    def add_task(self, priority: int, task: str):
        # Higher number = Higher priority
        heapq.heappush(self.heap, (-priority, task))

    def pop_task(self):
        if not self.heap:
            return None
        priority, task = heapq.heappop(self.heap)
        return {"task": task, "priority": -priority}
    
    def show_heap(self):
        return [{"task": t[1], "priority": -t[0]} for t in self.heap]

# 2. GRAPH (Adjacency List) for Business Connections
class IdeaBrain:
    def __init__(self):
        self.graph = {}

    def add_connection(self, node1, node2):
        if node1 not in self.graph: self.graph[node1] = []
        if node2 not in self.graph: self.graph[node2] = []
        self.graph[node1].append(node2)
        self.graph[node2].append(node1) # Undirected

    def get_related(self, node):
        return self.graph.get(node, [])
    
    def show_graph(self):
        return self.graph

# 3. HASH MAP for O(1) Lookups
class SmartLookup:
    def __init__(self):
        self.index = {}

    def add_item(self, key, value):
        self.index[key] = value

    def get_item(self, key):
        return self.index.get(key, "Not Found")

# 4. STACK (LIFO) for Undo Actions
class ActionHistory:
    def __init__(self):
        self.stack = []

    def do_action(self, action):
        self.stack.append(action)

    def undo(self):
        if not self.stack:
            return None
        return self.stack.pop()
    
    def show_stack(self):
        return self.stack

# 5. MERGE SORT (Stable Sort) for Content Feeds
class FeedSorter:
    def sort_feed(self, items):
        # Items is list of dicts with 'timestamp'
        if len(items) <= 1:
            return items
        
        mid = len(items) // 2
        left = self.sort_feed(items[:mid])
        right = self.sort_feed(items[mid:])
        
        return self.merge(left, right)
    
    def merge(self, left, right):
        sorted_list = []
        i = j = 0
        while i < len(left) and j < len(right):
            if left[i]['timestamp'] > right[j]['timestamp']: # Newest first
                sorted_list.append(left[i])
                i += 1
            else:
                sorted_list.append(right[j])
                j += 1
        sorted_list.extend(left[i:])
        sorted_list.extend(right[j:])
        return sorted_list
```

## app/extensions/business_model/extension.py
```python
from app.services.llm_engine import llm
import json

class Extension:
    def execute(self, payload):
        prompt = f"""
        You are a Ruthless CFO. Your job is to kill optimistic projections and enforce standard unit economics.
        Return STRICT JSON.

        IDEA: {payload}

        REQUIREMENTS:
        1. Calculate LTV, CAC, and Payback Period.
        2. IF Idea is 'Uber for Dogs', FORCE these bad metrics:
           - CAC: $150 (High)
           - LTV: $120 (Negative Unit Economics)
           - Payback: 18 Months (Too slow)
        3. Logic Check: If 'Employees' mentioned, ensure 'W-2 Costs' > $4000/mo per person.
        4. Success Probability must be penalized if margins < 20%.

        OUTPUT JSON SCHEMA:
        {{
            "strategy": {{
                "revenueModels": [{{"name": "string", "details": "string"}}],
                "pricingStrategy": "string",
                "kpis": {{
                    "cac": "string",
                    "ltv": "string",
                    "paybackPeriod": "string"
                }},
                "successProbability": 45,
                "first10UsersPlan": ["step1", "step2"],
                "churnAnalysis": "Explanation of why people leave",
                "retentionStrategy": "How to fix churn"
            }}
        }}
        """
        
        raw_result = llm.analyze(prompt)
        # Rudimentary json cleanup
        clean_result = raw_result.replace("```json", "").replace("```", "").strip()
        try:
            return json.loads(clean_result)
        except:
            return {"error": "Failed to parse JSON", "raw": raw_result}
```
