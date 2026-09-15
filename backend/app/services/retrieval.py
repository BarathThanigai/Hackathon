from app.database.chroma import search_chunks


def retrieve_documents(query: str, n_results: int = 5):
    """
    Retrieve semantically relevant document chunks
    from ChromaDB.
    """

    results = search_chunks(
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
            "id": ids[i] if i < len(ids) else f"result-{i}",
            "text": documents[i],
            "distance": distances[i] if i < len(distances) else None,
            "metadata": metadatas[i] if i < len(metadatas) else {},
        })

    return retrieved
