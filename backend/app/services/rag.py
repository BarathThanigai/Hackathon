from app.services.retrieval import retrieve_documents
from app.services.graph_retrieval import search_graph_by_id
from app.services.ai_client import generate_text


def extract_entity_ids(documents):
    """
    Extract Neo4j entity IDs from ChromaDB metadata.
    """

    entity_ids = set()

    for document in documents:
        metadata = document.get("metadata", {})

        ids = metadata.get("entity_ids", "")

        if not ids:
            continue

        for entity_id in ids.split(","):
            entity_id = entity_id.strip()

            if entity_id:
                entity_ids.add(entity_id)

    return list(entity_ids)


def build_context(query: str):

    # --------------------------------
    # 1. ChromaDB semantic retrieval
    # --------------------------------

    documents = retrieve_documents(
        query=query,
        n_results=3
    )

    # --------------------------------
    # 2. Get Neo4j entity IDs from
    #    ChromaDB metadata
    # --------------------------------

    entity_ids = extract_entity_ids(documents)

    print("\nENTITY IDS FROM CHROMADB:")
    print(entity_ids)

    # --------------------------------
    # 3. Retrieve graph context
    # --------------------------------

    graph_results = []

    for entity_id in entity_ids:

        results = search_graph_by_id(entity_id)

        graph_results.extend(results)

    # --------------------------------
    # 4. Build combined context
    # --------------------------------

    context_parts = []

    context_parts.append("DOCUMENT CONTEXT:")

    for document in documents:
        context_parts.append(document["text"])

    context_parts.append("\nGRAPH CONTEXT:")

    for item in graph_results:

        context_parts.append(
            f"Entity: {item['entity']}\n"
            f"Relationship: {item['relationship']}\n"
            f"Connected Entity: {item['connected_entity']}"
        )

    return "\n\n".join(context_parts)


def answer_query(query: str):

    context = build_context(query)

    prompt = f"""
You are an organizational knowledge assistant.

Answer the user's question using ONLY the provided context.

Do not invent information.

If the answer cannot be found in the context,
say that the information is not available.

CONTEXT:
{context}

USER QUESTION:
{query}

ANSWER:
"""

    answer = generate_text(prompt)

    return {
        "query": query,
        "answer": answer,
        "context": context
    }