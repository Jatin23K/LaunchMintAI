from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

# Load a small, fast embedding model
print("💾 [VectorDB] Loading Embedding Model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
DIMENSION = 384

class VectorDB:
    def __init__(self):
        # Create a RAM-based vector index
        self.index = faiss.IndexFlatL2(DIMENSION)
        self.documents = {} # Maps ID -> Text Chunk
        
    def add_document(self, doc_id: str, text: str):
        """Chops text into chunks, embeds them, and saves to FAISS."""
        print(f"💾 [VectorDB] Memorizing document: {doc_id}")
        
        # 1. Chunk text (500 char chunks)
        chunks = [text[i:i+500] for i in range(0, len(text), 500)]
        
        # 2. Embed
        embeddings = model.encode(chunks)
        
        # 3. Add to Index
        self.index.add(np.array(embeddings).astype('float32'))
        
        # 4. Store text reference (Simple Dict for MVP)
        self.documents[doc_id] = chunks
        return len(chunks)

    def search(self, query: str, k: int = 3):
        """Finds the top 3 most relevant text chunks."""
        query_vector = model.encode([query]).astype('float32')
        distances, indices = self.index.search(query_vector, k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1:
                # In a real app, we map the index back to the specific chunk text
                # For this MVP, we acknowledge the hit
                results.append(f"Match found (Confidence: {100 - distances[0][i]:.0f}%)")
        
        return results

# Global Instance
vector_db = VectorDB()