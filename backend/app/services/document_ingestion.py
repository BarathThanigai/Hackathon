from app.services.knowledge_extractor import extract_knowledge
from app.services.graph import store_knowledge
from app.services.vector_store import store_document


def ingest_document(
    document_id: str,
    text: str,
    metadata: dict | None = None
):
    """
    Complete document ingestion pipeline.

    1. Extract entities and relationships using the LLM.
    2. Store the knowledge graph in Neo4j.
    3. Store the document embedding in ChromaDB.
    4. Link ChromaDB metadata to the Neo4j entities.
    """

    print("STEP 1: EXTRACTING KNOWLEDGE...")

    knowledge = extract_knowledge(text)

    print("KNOWLEDGE EXTRACTED:")
    print(knowledge)

    # -----------------------------------------
    # Store entities + relationships in Neo4j
    # -----------------------------------------

    print("\nSTEP 2: STORING KNOWLEDGE IN NEO4J...")

    graph_result = store_knowledge(knowledge)

    print("GRAPH RESULT:")
    print(graph_result)

    # -----------------------------------------
    # Extract entity IDs for ChromaDB metadata
    # -----------------------------------------

    entity_ids = [
        entity["id"]
        for entity in knowledge.get("entities", [])
    ]

    # ChromaDB metadata values should be simple types.
    # Store the IDs as a comma-separated string.
    chroma_metadata = metadata.copy() if metadata else {}

    chroma_metadata["entity_ids"] = ",".join(entity_ids)

    # -----------------------------------------
    # Store embedding + document in ChromaDB
    # -----------------------------------------

    print("\nSTEP 3: STORING DOCUMENT IN CHROMADB...")

    vector_result = store_document(
        document_id=document_id,
        text=text,
        metadata=chroma_metadata
    )

    print("VECTOR RESULT:")
    print(vector_result)

    return {
        "document_id": document_id,
        "knowledge": knowledge,
        "graph": graph_result,
        "vector": vector_result,
        "entity_ids": entity_ids
    }