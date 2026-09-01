from app.services.vector_store import search_documents


def retrieve_documents(query: str, n_results: int = 5):
    """
    Retrieve semantically relevant document chunks
    from ChromaDB.
    """

    results = search_documents(
        query=query,
        n_results=n_results
    )

    documents = results.get("documents", [[]])[0]
    distances = results.get("distances", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    ids = results.get("ids", [[]])[0]

    retrieved = []

    for i in range(len(documents)):
        retrieved.append({
            "id": ids[i],
            "text": documents[i],
            "distance": distances[i],
            "metadata": metadatas[i]
        })

    return retrieved