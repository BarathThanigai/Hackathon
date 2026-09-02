from pathlib import Path

from app.processors.document_parser import extract_text
from app.database.chroma import add_chunks
from app.services.graph import store_knowledge
from app.services.knowledge_extractor import extract_knowledge


def ingest_document(
    file_path: str,
    document_id: str,
    filename: str
) -> dict:

    text = extract_text(file_path)

    if not text.strip():
        raise ValueError(
            "No text could be extracted from the document"
        )

    knowledge = extract_knowledge(text)
    graph_result = store_knowledge(knowledge)
    chunks = create_chunks(text)
    entity_ids = [entity["id"] for entity in knowledge["entities"]]

    add_chunks(
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
