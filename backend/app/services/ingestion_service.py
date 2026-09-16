from pathlib import Path
import logging

from app.processors.document_parser import extract_text
from app.database.chroma import add_chunks
from app.services.graph import store_knowledge
from app.services.knowledge_extractor import extract_knowledge
from app.services.knowledge_extractor import _stable_entity_id


logger = logging.getLogger(__name__)


def attach_authorship(
    knowledge: dict,
    author_name: str,
    project_name: str,
    commit_time: str | None = None,
) -> dict:
    """Add ground-truth Git authorship without asking the model to infer it."""
    author_id = _stable_entity_id("Person", author_name)
    project_id = _stable_entity_id("Project", project_name)
    entities = list(knowledge.get("entities", []))
    existing_ids = {entity["id"] for entity in entities}

    if author_id not in existing_ids:
        entities.append({"id": author_id, "type": "Person", "name": author_name})
    if project_id not in existing_ids:
        entities.append({"id": project_id, "type": "Project", "name": project_name})

    relationships = list(knowledge.get("relationships", []))
    already_linked = any(
        relationship.get("source") == author_id
        and relationship.get("type") == "WORKED_ON"
        and relationship.get("target") == project_id
        for relationship in relationships
    )
    if not already_linked:
        edge = {"source": author_id, "type": "WORKED_ON", "target": project_id}
        if commit_time:
            edge["timestamp"] = commit_time
        relationships.append(edge)

    return {"entities": entities, "relationships": relationships}


def ingest_document(
    file_path: str,
    document_id: str,
    filename: str,
    checkpoint=None,
    project_id: str = "all",
    project_name: str = "All workspace",
    author_name: str | None = None,
) -> dict:
    text = extract_text(file_path)

    if not text.strip():
        raise ValueError(
            "No text could be extracted from the document"
        )

    if checkpoint:
        checkpoint("text_extracted", "Text extracted")

    chunks = create_chunks(text)
    if checkpoint:
        checkpoint("chunking", "Chunked")
    knowledge_chunks = create_chunks(text, chunk_size=1200, overlap=100)
    if checkpoint:
        checkpoint(
            "extracting_knowledge",
            "Extracting knowledge with AI",
            chunks_total=len(knowledge_chunks),
            chunk_current=0,
        )

    knowledge = merge_knowledge_chunks(knowledge_chunks, checkpoint=checkpoint)

    if author_name:
        knowledge = attach_authorship(knowledge, author_name, project_name)

    if checkpoint:
        checkpoint("storing_graph", "Storing knowledge graph")
    graph_result = store_knowledge(knowledge)

    entity_ids = [entity["id"] for entity in knowledge["entities"]]

    if checkpoint:
        checkpoint("indexing", "Indexed for semantic search")
    vector_result = add_chunks(
        chunks=chunks,
        document_id=document_id,
        filename=filename,
        entity_ids=entity_ids,
        extra_metadata={"project_id": project_id, "project_name": project_name},
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
            entity_type = entity["type"].strip()
            entity_name = entity["name"].strip()
            key = (entity_type.casefold(), entity_name.casefold())
            entity_id = entity_keys.get(key)
            if entity_id is None:
                entity_id = _stable_entity_id(entity_type, entity_name)
                entity_keys[key] = entity_id
                entities.append({"id": entity_id, "type": entity_type, "name": entity_name})
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
