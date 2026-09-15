from pathlib import Path

import chromadb


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
    chunk_entity_ids: list[list[str]] | None = None,
):
    """
    Store document chunks in ChromaDB.

    Each chunk receives only the entity IDs associated
    with that specific chunk.
    """

    ids = []
    metadatas = []

    chunk_entity_ids = (
        chunk_entity_ids
        or [[] for _ in chunks]
    )

    if len(chunk_entity_ids) != len(chunks):
        raise ValueError(
            "chunk_entity_ids must contain exactly one "
            "entity-ID list for every chunk."
        )

    for index, _ in enumerate(chunks):

        ids.append(
            f"{document_id}_chunk_{index}"
        )

        entity_ids = chunk_entity_ids[index]

        metadatas.append({
            "document_id": document_id,
            "filename": filename,
            "chunk_index": index,
            "source_type": "document",
            "entity_ids": ",".join(
                entity_ids
            ),
        })

    collection.upsert(
        documents=chunks,
        ids=ids,
        metadatas=metadatas,
    )


def search_chunks(
    query: str,
    n_results: int = 5,
):
    return collection.query(
        query_texts=[query],
        n_results=n_results,
    )