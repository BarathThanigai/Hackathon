from pathlib import Path
import logging

from app.processors.document_parser import extract_text
from app.database.chroma import add_chunks
from app.services.graph import store_knowledge
from app.services.knowledge_extractor import extract_knowledge


logger = logging.getLogger(__name__)


def ingest_document(
    file_path: str,
    document_id: str,
    filename: str,
    checkpoint=None,
) -> dict:
    text = extract_text(file_path)

    if not text.strip():
        raise ValueError(
            "No text could be extracted from the document"
        )

    if checkpoint:
        checkpoint("text_extracted", "Text extracted")

    chunks = create_chunks(text)
    knowledge_chunks = create_chunks(text, chunk_size=1200, overlap=100)
    if checkpoint:
        checkpoint(
            "extracting_knowledge",
            "Extracting knowledge with AI",
            chunks_total=len(knowledge_chunks),
            chunk_current=0,
        )

    knowledge = merge_knowledge_chunks(knowledge_chunks, checkpoint=checkpoint)

    if checkpoint:
        checkpoint("storing_graph", "Storing knowledge graph")
    graph_result = store_knowledge(knowledge)

    if checkpoint:
        checkpoint("chunking", "Chunked")
    entity_ids = [entity["id"] for entity in knowledge["entities"]]

    if checkpoint:
        checkpoint("indexing", "Indexed for semantic search")
    vector_result = add_chunks(
        chunks=chunks,
        document_id=document_id,
        filename=filename,
        entity_ids=entity_ids,
    )

    return {
        "text_length": len(text),
        "chunks_created": len(chunks),
        "entities_created": graph_result["entities_created"],
        "relationships_created": graph_result["relationships_created"],
        **vector_result,
    }


def create_chunks(
    text: str,
    chunk_size: int = 4000,
    overlap: int = 200
) -> list[str]:

    words = text.split()

    chunks = []

    start = 0

    while start < len(words):

        end = start + chunk_size

        chunk = " ".join(
            words[start:end]
        )

        if chunk.strip():
            chunks.append(chunk)

        start += chunk_size - overlap

    return chunks


def merge_knowledge_chunks(chunks: list[str], checkpoint=None) -> dict:
    """Extract bounded chunks and merge their graph facts safely."""
    entities = []
    relationships = []
    entity_keys: dict[tuple[str, str], str] = {}
    entity_ids: dict[str, str] = {}

    for chunk_index, chunk in enumerate(chunks):
        if checkpoint:
            checkpoint(
                "extracting_knowledge",
                "Extracting knowledge with AI",
                chunks_total=len(chunks),
                chunk_current=chunk_index + 1,
            )
        try:
            extracted = extract_knowledge(chunk)
        except Exception as exc:
            logger.warning(
                "Skipping knowledge extraction chunk %s/%s: %s",
                chunk_index + 1,
                len(chunks),
                exc,
            )
            continue
        local_ids = {}
        for entity in extracted.get("entities", []):
            key = (entity["type"], entity["name"].casefold())
            entity_id = entity_keys.get(key)
            if entity_id is None:
                entity_id = f"e{len(entities) + 1}"
                entity_keys[key] = entity_id
                entities.append({"id": entity_id, "type": entity["type"], "name": entity["name"]})
            local_ids[entity["id"]] = entity_id

        for relationship in extracted.get("relationships", []):
            source = local_ids.get(relationship["source"])
            target = local_ids.get(relationship["target"])
            if not source or not target:
                continue
            value = {"source": source, "type": relationship["type"], "target": target}
            if value not in relationships:
                relationships.append(value)

    return {"entities": entities, "relationships": relationships}
