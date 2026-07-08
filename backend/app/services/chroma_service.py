import os
import re
import uuid
from typing import Optional

import chromadb
from chromadb.config import Settings as ChromaSettings
import google.generativeai as genai

from app.config import get_settings

settings = get_settings()


def _get_client() -> chromadb.PersistentClient:
    os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
    return chromadb.PersistentClient(
        path=settings.CHROMA_PERSIST_DIR,
        settings=ChromaSettings(anonymized_telemetry=False),
    )


def _get_collection():
    client = _get_client()
    return client.get_or_create_collection(
        name=settings.CHROMA_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )


def _api_key() -> str:
    key = settings.GEMINI_API_KEY or os.getenv("GOOGLE_API_KEY") or ""
    return key


def _generate_embedding(text: str) -> list[float]:
    key = _api_key()
    if not key:
        raise ValueError(
            "Gemini API key not configured. "
            "Set GEMINI_API_KEY in .env or export GOOGLE_API_KEY."
        )
    genai.configure(api_key=key)
    result = genai.embed_content(model=settings.EMBEDDING_MODEL, content=text)
    return result["embedding"]


def chunk_text(text: str, chunk_size: int = None, chunk_overlap: int = None) -> list[str]:
    if chunk_size is None:
        chunk_size = settings.CHUNK_SIZE
    if chunk_overlap is None:
        chunk_overlap = settings.CHUNK_OVERLAP

    chunks = []
    paragraphs = re.split(r"\n\s*\n", text.strip())
    current_chunk = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        if len(current_chunk) + len(para) + 1 <= chunk_size:
            current_chunk = (current_chunk + "\n\n" + para).strip()
        else:
            if current_chunk:
                chunks.append(current_chunk)
            if len(para) > chunk_size:
                sentences = re.split(r"(?<=[.!?])\s+", para)
                temp = ""
                for sent in sentences:
                    if len(temp) + len(sent) + 1 <= chunk_size:
                        temp = (temp + " " + sent).strip()
                    else:
                        if temp:
                            chunks.append(temp)
                        temp = sent
                if temp:
                    current_chunk = temp
                else:
                    current_chunk = ""
            else:
                current_chunk = para

    if current_chunk:
        chunks.append(current_chunk)
    return chunks


def index_document(document_id: int, text: str, metadata: dict) -> int:
    if not text or not text.strip():
        return 0

    chunks = chunk_text(text)
    if not chunks:
        return 0

    collection = _get_collection()
    ids = []
    documents = []
    metadatas = []

    for i, chunk in enumerate(chunks):
        ids.append(str(uuid.uuid4()))
        documents.append(chunk)
        meta = {
            "document_id": document_id,
            "chunk_index": i,
            "total_chunks": len(chunks),
        }
        meta.update(metadata)
        metadatas.append(meta)

    embeddings = [_generate_embedding(chunk) for chunk in chunks]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas,
    )
    return len(chunks)


def delete_document_chunks(document_id: int):
    collection = _get_collection()
    results = collection.get(where={"document_id": document_id})
    if results and results["ids"]:
        collection.delete(ids=results["ids"])


def query_similar(query: str, top_k: int = 5, where: Optional[dict] = None) -> list[dict]:
    collection = _get_collection()
    query_embedding = _generate_embedding(query)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where=where,
    )
    hits = []
    if results and results["ids"]:
        for i in range(len(results["ids"][0])):
            hits.append({
                "id": results["ids"][0][i],
                "document": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "distance": results["distances"][0][i] if results.get("distances") else None,
            })
    return hits
