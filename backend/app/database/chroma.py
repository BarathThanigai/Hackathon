import chromadb
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
):
    ids = []
    metadatas = []

    for index, _ in enumerate(chunks):

        ids.append(
            f"{document_id}_chunk_{index}"
        )

        metadatas.append({
            "document_id": document_id,
            "filename": filename,
            "chunk_index": index,
            "source_type": "document",
            "entity_ids": ",".join(entity_ids or []),
        })

    collection.add(
        documents=chunks,
        ids=ids,
        metadatas=metadatas
    )


def search_chunks(
    query: str,
    n_results: int = 5
):
    return collection.query(
        query_texts=[query],
        n_results=n_results
    )
