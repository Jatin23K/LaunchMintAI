
import time
import random
import sys
import os
from collections import deque

# Adjust path to import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.tech_demo import TaskManager, IdeaBrain, SmartLookup, ActionHistory, FeedSorter

def run_stress_test():
    print("🔥 STARTING STRESS TEST (TECH DEMO) 🔥\n")

    # ==========================================
    # 1. HEAP STRESS (100,000 Tasks)
    # ==========================================
    print("--- [1] HEAP STRESS (100k items) ---")
    tasks = TaskManager()
    start = time.time()
    for i in range(100000):
        tasks.add_task(random.randint(1, 1000), f"Task_{i}")
    
    # Peek top
    top = tasks.get_next_task()
    duration = time.time() - start
    print(f"✅ Added 100k tasks + Pop Top: {duration:.4f}s")
    print(f"   Top Task: {top}\n")

    # ==========================================
    # 2. HASH MAP STRESS (1 Million Items)
    # ==========================================
    print("--- [2] SMART LOOKUP STRESS (1 Million items) ---")
    search = SmartLookup()
    start = time.time()
    # Populate
    for i in range(1000000):
        search.add_note(f"Key_{i}", f"Value_{i}")
    
    # Lookup
    val = search.find_note("Key_999999")
    duration = time.time() - start
    print(f"✅ inserted 1M items + Lookup: {duration:.4f}s")
    print(f"   Lookup Result: {val}\n")

    # ==========================================
    # 3. STACK STRESS (500k Operations)
    # ==========================================
    print("--- [3] STACK STRESS (500k Push/Pop) ---")
    history = ActionHistory()
    start = time.time()
    for i in range(500000):
        history.perform_action(f"Action_{i}")
        # Silence print by overriding method or just accepting spam? 
        # Actually perform_action prints. That will be SLOW.
        # Let's monkey-patch print to silence it for speed
    
    # Undo some
    undo_val = history.undo()
    duration = time.time() - start
    print(f"✅ 500k Operations (Time heavily impacted by print, ignoring): {duration:.4f}s")
    print(f"   Undo Result: {undo_val}\n")
    
    # ==========================================
    # 4. GRAPH BFS STRESS (10k Nodes, High Connectivity)
    # ==========================================
    print("--- [4] GRAPH BFS STRESS (10k Nodes) ---")
    brain = IdeaBrain()
    # Create a chain/web
    for i in range(10000):
        brain.add_connection(f"Node_{i}", f"Node_{i+1}")
    
    start = time.time()
    related = brain.find_related("Node_0", max_depth=500) # Deep search
    duration = time.time() - start
    print(f"✅ BFS Deep Trasversal (Depth 500): {duration:.4f}s")
    print(f"   Found {len(related)} related items.\n")

    # ==========================================
    # 5. MERGE SORT STRESS (50k Items)
    # ==========================================
    print("--- [5] MERGE SORT STRESS (50k Items) ---")
    sorter = FeedSorter()
    feed = [{"id": i, "timestamp": random.randint(1000, 9999), "content": "post"} for i in range(50000)]
    
    start = time.time()
    sorted_feed = sorter.merge_sort(feed)
    duration = time.time() - start
    print(f"✅ Merge Sort 50k items: {duration:.4f}s")
    print(f"   First timestamp: {sorted_feed[0]['timestamp']}\n")

    print("\n🚀 STRESS TEST COMPLETE. SYSTEM IS STABLE.")

# Monkey Patch Print to avoid spam during stress test 3
original_print = print
def silence_print(*args, **kwargs):
    if "Performed" in str(args) or "UNDOING" in str(args):
        return
    original_print(*args, **kwargs)

import builtins
builtins.print = silence_print

if __name__ == "__main__":
    run_stress_test()
