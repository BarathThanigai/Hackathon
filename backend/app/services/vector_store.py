import chromadb

from app import config
from app.services.embedding_client import generate_embedding


# Persistent local ChromaDB database
client = chromadb.PersistentClient(
    path="./chroma_data"
)


collection = client.get_or_create_collection(
    name="memorymap_documents"
)


def store_document(
    document_id: str,
    text: str,
    metadata: dict | None = None
):
    """
    Generate an embedding for the document and store it in ChromaDB.
    """

    embedding = generate_embedding(text)

    collection.upsert(
        ids=[document_id],
        embeddings=[embedding],
        documents=[text],
        metadatas=[metadata or {}]
    )

    return {
        "id": document_id,
        "stored": True,
        "vector_dimensions": len(embedding)
    }


def search_documents(
    query: str,
    n_results: int = 5
):
    """
    Convert the query into an embedding and find
    semantically similar documents in ChromaDB.
    """

    query_embedding = generate_embedding(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )

    return results