
import heapq
from collections import deque
from typing import List, Tuple, Dict, Set, Any

# ==========================================
# FEATURE 1: Priority Task Engine (Max Heap)
# Complexity: O(1) to get max priority
# ==========================================
class TaskManager:
    """
    Implements a Priority Queue using a Max Heap.
    
    Why Heap?
    - A List would require O(N log N) to sort every time we add a task.
    - A Scannable List would be O(N) to find the max.
    - A Heap gives us the most important task instantly in O(1).
    """
    def __init__(self):
        # Python's heap is a Min-Heap. 
        # To make it a Max-Heap (Highest Priority first), we store priority as NEGATIVE.
        self.task_heap: List[Tuple[int, str]] = []

    def add_task(self, priority: int, task_name: str):
        """
        Adds a task to the heap.
        Complexity: O(log N) - efficient insertion.
        """
        # Priority 100 becomes -100 (so it floats to the top of Min Heap)
        # We explicitly cast to int just in case
        heapq.heappush(self.task_heap, (-int(priority), task_name))

    def get_next_task(self) -> str:
        """
        Retrieves the highest priority task.
        Complexity: O(1) access (O(log N) to reconstruct heap after pop).
        """
        if not self.task_heap:
            return "No tasks pending."
        
        # Pop the smallest number (e.g. -100), convert back to positive
        priority, task_name = heapq.heappop(self.task_heap)
        return f"DO NOW: {task_name} (Priority: {-priority})"

    def peek_next_task(self) -> str:
        """
        Just looks at the top task without removing it.
        Complexity: O(1)
        """
        if not self.task_heap:
            return "No tasks pending."
        priority, task_name = self.task_heap[0]
        return f"NEXT UP: {task_name} (Priority: {-priority})"


# ==========================================
# FEATURE 2: Related Ideas Engine (Graph + BFS)
# Complexity: O(V + E) for Breadth First Search
# ==========================================
class IdeaBrain:
    """
    Implements an Idea Knowledge Graph.
    
    Why Graph?
    - Ideas aren't linear lists; they are interconnected webs.
    - Graphs allow finding 'six degrees of separation' or immediate clusters.
    """
    def __init__(self):
        self.graph: Dict[str, List[str]] = {} # Adjacency List

    def add_connection(self, idea_a: str, idea_b: str):
        """
        Connects two concepts.
        """
        # Undirected Graph (Two-way link)
        if idea_a not in self.graph: self.graph[idea_a] = []
        if idea_b not in self.graph: self.graph[idea_b] = []
        
        # Avoid duplicates
        if idea_b not in self.graph[idea_a]:
            self.graph[idea_a].append(idea_b)
        if idea_a not in self.graph[idea_b]:
            self.graph[idea_b].append(idea_a)

    def find_related(self, start_idea: str, max_depth: int = 2) -> List[str]:
        """
        Uses Breadth-First Search (BFS) to find related concepts.
        BFS is ideal here because it explores immediate neighbors first (closest relevance).
        """
        if start_idea not in self.graph: return []
        
        related = []
        queue = deque([(start_idea, 0)]) # (Idea, Depth)
        visited = set([start_idea])

        while queue:
            current_idea, depth = queue.popleft()
            
            # If we've gone too deep, stop exploring this branch
            if depth >= max_depth:
                continue

            # Add neighbors
            for neighbor in self.graph[current_idea]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, depth + 1))
                    related.append(neighbor)
        
        return related

# ==========================================
# DEMO EXECUTION
# ==========================================
if __name__ == "__main__":
    print("--- 🔬 SYSTEM DESIGN: TECHNICAL DEMO ---")
    
    print("\n[1] Testing Max Heap (Priority Task Engine)...")
    tasks = TaskManager()
    tasks.add_task(10, "Email Investor")
    tasks.add_task(99, "Fix Server Crash")  # High Priority!
    tasks.add_task(50, "Write Blog Post")
    
    # Validation: Should get priority 99 first
    print(tasks.get_next_task())  # Expect: Fix Server Crash
    print(tasks.get_next_task())  # Expect: Write Blog Post
    
    print("\n[2] Testing Graph BFS (Related Ideas Engine)...")
    brain = IdeaBrain()
    brain.add_connection("Startup", "Funding")
    brain.add_connection("Funding", "VCs")
    brain.add_connection("Startup", "Product")
    brain.add_connection("Product", "Design")
    
    # Validation: Related to Startup
    # Level 1: Funding, Product
    # Level 2: VCs, Design
    related = brain.find_related("Startup", max_depth=2)
    print(f"Related to 'Startup': {related}")

# ==========================================
# FEATURE 3: Smart Lookup (Hash Map)
# Complexity: O(1) Average Case Lookup
# ==========================================
class SmartLookup:
    """
    Implements an In-Memory Index using a Hash Map.
    
    Why Hash Map?
    - Scanning a list of notes for "Revenue" is O(N).
    - A Hash Map gives us O(1) lookup speed.
    """
    def __init__(self):
        self.index: Dict[str, str] = {}

    def add_note(self, topic: str, content: str):
        self.index[topic] = content

    def find_note(self, topic: str) -> str:
        # Key lookup is O(1)
        return self.index.get(topic, "Note not found.")

# ==========================================
# FEATURE 4: Undo Action (Stack)
# Complexity: O(1) Push/Pop
# ==========================================
class ActionHistory:
    """
    Implements Undo logic using a Stack (LIFO).
    
    Why Stack?
    - The last thing done must be the first thing undone.
    - Lists in Python act as stacks with append() and pop().
    """
    def __init__(self):
        self.history: List[str] = []

    def perform_action(self, action: str):
        print(f"  -> Performed: {action}")
        self.history.append(action)

    def undo(self) -> str:
        if not self.history:
            return "Nothing to undo."
        last_action = self.history.pop()
        return f"<- UNDOING: {last_action}"

# ==========================================
# FEATURE 5: Feed Order (Merge Sort)
# Complexity: O(N log N) - STABLE Sort
# ==========================================
class FeedSorter:
    """
    Implements Merge Sort to order feed items.
    
    Why Merge Sort?
    - We need Stability: If two items have the same timestamp, 
      their relative order must NOT change (no random flipping).
    - QuickSort is NOT stable. Merge Sort IS stable.
    """
    def merge_sort(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        # Base case
        if len(items) <= 1:
            return items

        # Divide
        mid = len(items) // 2
        left_half = items[:mid]
        right_half = items[mid:]

        # Recursive sort
        left_sorted = self.merge_sort(left_half)
        right_sorted = self.merge_sort(right_half)

        # Merge
        return self.merge(left_sorted, right_sorted)

    def merge(self, left: List[Dict], right: List[Dict]) -> List[Dict]:
        sorted_list = []
        i = j = 0
        
        while i < len(left) and j < len(right):
            # Sort by 'timestamp' (Descending - Newest First)
            if left[i]['timestamp'] >= right[j]['timestamp']:
                sorted_list.append(left[i])
                i += 1
            else:
                sorted_list.append(right[j])
                j += 1
        
        # Add remaining
        sorted_list.extend(left[i:])
        sorted_list.extend(right[j:])
        
        return sorted_list

if __name__ == "__main__":
    print("--- 🔬 SYSTEM DESIGN: 5-FEATURE TECH DEMO ---")
    
    # 1. Heap
    print("\n[1] Priority Task Engine (Max Heap)")
    tasks = TaskManager()
    tasks.add_task(10, "Email Investor")
    tasks.add_task(99, "Fix Server Crash") 
    print(tasks.get_next_task()) 
    
    # 2. Graph
    print("\n[2] Related Ideas Engine (Graph BFS)")
    brain = IdeaBrain()
    brain.add_connection("Startup", "Funding")
    brain.add_connection("Funding", "VCs")
    print(f"Related to 'Startup': {brain.find_related('Startup')}")

    # 3. Hash Map
    print("\n[3] Smart Lookup (Hash Map)")
    search = SmartLookup()
    search.add_note("Revenue", "Q3 Revenue was $50k")
    search.add_note("Churn", "Churn rate is 2%")
    print(f"Searching 'Revenue': {search.find_note('Revenue')}")
    print(f"Complexity: O(1)")

    # 4. Stack
    print("\n[4] Undo Action (Stack)")
    history = ActionHistory()
    history.perform_action("Delete File")
    history.perform_action("Rename Folder")
    print(history.undo()) # Expect: Rename Folder
    print(history.undo()) # Expect: Delete File

    # 5. Merge Sort
    print("\n[5] Feed Order (Merge Sort)")
    sorter = FeedSorter()
    feed = [
        {"id": "A", "timestamp": 100, "content": "Old Post"},
        {"id": "B", "timestamp": 200, "content": "New Post"},
        {"id": "C", "timestamp": 200, "content": "Also New Post (Stable Check)"} 
    ]
    # Id 'B' comes before 'C' in input. Since timestamps are equal, 
    # Stable Sort must keep 'B' before 'C'.
    sorted_feed = sorter.merge_sort(feed)
    for item in sorted_feed:
        print(f"[{item['timestamp']}] {item['content']}")
