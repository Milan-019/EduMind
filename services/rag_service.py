"""
rag_service.py
--------------
Handles everything related to the knowledge base:
  - Ingest a PDF into ChromaDB
  - Retrieve relevant chunks for a query

Global collection: all uploaded PDFs share one ChromaDB collection.
Embeddings: chromadb's built-in sentence-transformers (no extra API key needed).
"""

import os
import hashlib
from pathlib import Path

import chromadb
from chromadb.utils import embedding_functions
import pdfplumber

# ── Config ────────────────────────────────────────────────────────────────────

CHROMA_PATH = "./chroma_db"          # persisted to disk
COLLECTION_NAME = "edumind_knowledge"
CHUNK_SIZE = 1000                    # characters per chunk
CHUNK_OVERLAP = 200                  # overlap to preserve context across chunks
TOP_K = 10                           # how many chunks to retrieve per query

# ── Client + Collection ───────────────────────────────────────────────────────

_client = chromadb.PersistentClient(path=CHROMA_PATH)

_embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"   # fast, small, good enough for study content
)

_collection = _client.get_or_create_collection(
    name=COLLECTION_NAME,
    embedding_function=_embed_fn,
    metadata={"hnsw:space": "cosine"},
)

# ── Helpers ───────────────────────────────────────────────────────────────────

def _chunk_text(text: str) -> list[str]:
    """Split text into overlapping chunks, preventing splitting mid-word."""
    chunks = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        end = min(start + CHUNK_SIZE, text_len)
        
        # Adjust 'end' to the next space so we don't chop a word
        if end < text_len:
            space_idx = text.find(" ", end, min(end + 50, text_len))
            if space_idx != -1:
                end = space_idx
            else:
                space_idx_back = text.rfind(" ", start, end)
                if space_idx_back != -1:
                    end = space_idx_back
                    
        chunks.append(text[start:end])
        
        if end >= text_len:
            break
            
        start = end - CHUNK_OVERLAP
        # Adjust 'start' to the next space boundary
        if start > 0 and start < text_len:
            space_idx = text.find(" ", start, end)
            if space_idx != -1:
                start = space_idx + 1

    return [c.strip() for c in chunks if c.strip() and len(c.strip()) > 50]


def _file_hash(path: str) -> str:
    """MD5 of file — used to skip re-ingesting the same PDF."""
    h = hashlib.md5()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            h.update(block)
    return h.hexdigest()


# ── Public API ────────────────────────────────────────────────────────────────

def ingest_pdf(pdf_path: str) -> dict:
    """
    Parse a PDF, chunk it, embed + store in ChromaDB.
    Skips if this exact file was already ingested (by hash).

    Returns: { "status": "ingested" | "skipped", "chunks": int, "filename": str }
    """
    path = Path(pdf_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    file_id = _file_hash(pdf_path)
    filename = path.name

    # Check if already ingested
    existing = _collection.get(where={"file_id": {"$eq": file_id}}, limit=1)
    if existing["ids"]:
        return {"status": "skipped", "chunks": 0, "filename": filename}

    # Extract text
    full_text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                full_text += page_text + "\n"

    if not full_text.strip():
        raise ValueError(f"Could not extract text from {filename}. Is it a scanned PDF?")

    # Chunk + store
    chunks = _chunk_text(full_text)
    ids = [f"{file_id}_{i}" for i in range(len(chunks))]
    metadatas = [{"filename": filename, "file_id": file_id, "chunk_index": i}
                 for i in range(len(chunks))]

    # ChromaDB handles batching internally but we cap at 500 to be safe
    batch_size = 500
    for i in range(0, len(chunks), batch_size):
        _collection.add(
            documents=chunks[i:i + batch_size],
            ids=ids[i:i + batch_size],
            metadatas=metadatas[i:i + batch_size],
        )

    return {"status": "ingested", "chunks": len(chunks), "filename": filename}


def retrieve(query: str, top_k: int = TOP_K, filename: str = None) -> list[str]:
    """
    Semantic search — returns the top_k most relevant text chunks.
    Optionally restrict search to a specific filename.
    Returns empty list if collection is empty.
    """
    if _collection.count() == 0:
        return []

    query_params = {
        "query_texts": [query],
        "n_results": min(top_k, _collection.count()),
    }
    if filename:
        query_params["where"] = {"filename": {"$eq": filename}}

    try:
        results = _collection.query(**query_params)
    except Exception:
        return []

    if not results or not results.get("documents") or not results["documents"][0]:
        return []

    return results["documents"][0]  # list of chunk strings


def list_ingested_files() -> list[str]:
    """Return names of all PDFs currently in the knowledge base."""
    if _collection.count() == 0:
        return []
    all_meta = _collection.get(include=["metadatas"])["metadatas"]
    seen = set()
    names = []
    for m in all_meta:
        if m["filename"] not in seen:
            seen.add(m["filename"])
            names.append(m["filename"])
    return sorted(names)


def delete_pdf(filename: str) -> dict:
    """Remove all chunks belonging to a specific PDF filename."""
    results = _collection.get(where={"filename": {"$eq": filename}})
    if not results["ids"]:
        return {"status": "not_found", "filename": filename}
    _collection.delete(ids=results["ids"])
    return {"status": "deleted", "chunks_removed": len(results["ids"]), "filename": filename}