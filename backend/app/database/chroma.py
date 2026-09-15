import chromadb
from datetime import datetime, timezone
from pathlib import Path


CHROMA_DIR = (
    Path(__file__).resolve().parents[3]
    / "data"
    / "chroma"
)


client = chromadb.PersistentClient(
    path=str(CHROMA_DIR)
)


collection = client.get_or_create_collection(
    name="memorymap_documents"
)


def add_chunks(
    chunks: list[str],
    document_id: str,
    filename: str,
    entity_ids: list[str] | None = None,
    source_type: str = "document",
    extra_metadata: dict | None = None,
):
    ids = []
    metadatas = []

    for index, _ in enumerate(chunks):

        ids.append(
            f"{document_id}_chunk_{index}"
        )

        metadata = {
            "document_id": document_id,
            "filename": filename,
            "chunk_index": index,
            "source_type": source_type,
            "entity_ids": ",".join(entity_ids or []),
            "ingested_at": datetime.now(timezone.utc).isoformat(),
        }
        metadata.update(extra_metadata or {})
        metadatas.append(metadata)

    collection.upsert(
        documents=chunks,
        ids=ids,
        metadatas=metadatas
    )

    stored = collection.get(ids=ids, include=["embeddings"])
    embeddings = stored.get("embeddings")
    if embeddings is None or len(embeddings) != len(ids) or any(vector is None or len(vector) == 0 for vector in embeddings):
        raise RuntimeError("ChromaDB did not generate embeddings for every indexed chunk.")

    return {
        "vector_chunks": len(embeddings),
        "embedding_dimensions": len(embeddings[0]),
    }


def search_chunks(
    query: str,
    n_results: int = 5
):
    return collection.query(
        query_texts=[query],
        n_results=n_results
    )
