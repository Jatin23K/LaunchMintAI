import chromadb
from chromadb.utils import embedding_functions
import os
import json
import time
import hashlib
from loguru import logger

# Setup ChromaDB (Local Persist)
CHROMA_DATA_PATH = os.path.join(os.getcwd(), "chroma_data")
client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)

# Using a standard, reliable embedding function
default_ef = embedding_functions.DefaultEmbeddingFunction()

# Collections: 
startups_collection = client.get_or_create_collection(
    name="startup_knowledge_base", 
    embedding_function=default_ef
)

giants_collection = client.get_or_create_collection(
    name="corporate_giants", 
    embedding_function=default_ef
)

# --- SEMANTIC CACHE ---
cache_collection = client.get_or_create_collection(
    name="semantic_cache", 
    embedding_function=default_ef
)

def get_semantic_cache(query: str, threshold: float = 0.15):
    """
    Finds a semantically similar query in the cache.
    Distance < 0.15 is roughly 85%+ similarity.
    """
    try:
        results = cache_collection.query(
            query_texts=[query],
            n_results=1
        )
        if not results or not results['ids'] or not results['ids'][0]:
            return None
            
        distance = results['distances'][0][0]
        if distance <= threshold:
            logger.info(f"🧠 [SEMANTIC CACHE] Hit for '{query}' (Distance: {distance:.4f})")
            return json.loads(results['metadatas'][0][0]['json'])
        return None
    except Exception as e:
        logger.warning(f"⚠️ Cache query failed: {e}")
        return None

def set_semantic_cache(query: str, report: dict):
    """Stores report in cache keyed by query embedding."""
    try:
        doc_id = hashlib.md5(query.lower().strip().encode()).hexdigest()
        cache_collection.upsert(
            documents=[query],
            metadatas=[{"json": json.dumps(report), "timestamp": time.time()}],
            ids=[doc_id]
        )
        logger.info(f"💾 [SEMANTIC CACHE] Persisted: {query[:30]}...")
    except Exception as e:
        logger.error(f"❌ Cache store failed: {e}")

# --- EXISTING INTEL ---

def add_startup_intel(idea: str, report: dict):
    doc_id = idea.lower().strip().replace(" ", "_")[:50]
    content = f"Idea: {idea}\nTam: {report.get('market', {}).get('current_tam')}\nVerdict: {report.get('god_mode', {}).get('macro_verdict')}"
    startups_collection.upsert(
        documents=[content],
        metadatas=[{"json": json.dumps(report), "idea": idea}],
        ids=[doc_id]
    )

def query_similar_startups(query: str, n=3):
    results = startups_collection.query(
        query_texts=[query],
        n_results=n
    )
    return results

def add_giant_intel(name: str, intel: dict):
    doc_id = name.lower().strip().replace(" ", "_")
    content = f"Company: {name}\nFeatures: {intel.get('product_intel', {}).get('features')}\nWeakness: {intel.get('product_intel', {}).get('swot')}"
    giants_collection.upsert(
        documents=[content],
        metadatas=[{"json": json.dumps(intel), "name": name}],
        ids=[doc_id]
    )

def query_giants(query: str, n=1):
    results = giants_collection.query(query_texts=[query], n_results=n)
    if results and results['metadatas'] and results['metadatas'][0]:
        return json.loads(results['metadatas'][0][0]['json'])
    return None

def bootstrap_giants(giant_intel_dict: dict):
    for name, data in giant_intel_dict.items():
        try: add_giant_intel(name, data)
        except: pass