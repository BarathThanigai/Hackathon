from app.processors.document_parser import extract_text
from app.database.chroma import add_chunks
from app.services.graph import store_knowledge
from app.services.knowledge_extractor import (
    extract_chunk_knowledge,
    merge_knowledge,
)


CHROMA_CHUNK_SIZE = 4000
CHROMA_CHUNK_OVERLAP = 200

EXTRACTION_CHUNK_SIZE = 1200
EXTRACTION_CHUNK_OVERLAP = 100


def ingest_document(
    file_path: str,
    document_id: str,
    filename: str,
) -> dict:

    text = extract_text(file_path)

    if not text.strip():
        raise ValueError(
            "No text could be extracted from the document"
        )

    # --------------------------------------------------
    # 1. CREATE CHROMA RETRIEVAL CHUNKS
    # --------------------------------------------------

    chroma_chunks = create_chunks(
        text,
        chunk_size=CHROMA_CHUNK_SIZE,
        overlap=CHROMA_CHUNK_OVERLAP,
    )

    # --------------------------------------------------
    # 2. EXTRACT KNOWLEDGE FROM EACH CHROMA CHUNK
    #
    # Each 4000-word retrieval chunk is further divided
    # into smaller ~1200-word NVIDIA extraction chunks.
    # --------------------------------------------------

    all_extractions = []

    chunk_entity_ids = []

    for chunk_index, chroma_chunk in enumerate(
        chroma_chunks
    ):

        extraction_chunks = create_chunks(
            chroma_chunk,
            chunk_size=EXTRACTION_CHUNK_SIZE,
            overlap=EXTRACTION_CHUNK_OVERLAP,
        )

        print(
            f"\n========== DOCUMENT CHUNK "
            f"{chunk_index + 1}/{len(chroma_chunks)} =========="
        )

        print(
            f"Chroma chunk size: "
            f"{len(chroma_chunk.split())} words"
        )

        print(
            f"NVIDIA extraction chunks: "
            f"{len(extraction_chunks)}"
        )

        chunk_extractions = extract_chunk_knowledge(
            extraction_chunks
        )

        all_extractions.extend(
            chunk_extractions
        )

        # --------------------------------------------------
        # Store the entity IDs that were discovered from
        # this particular Chroma chunk.
        #
        # They are still temporary AI IDs here.
        # We resolve them after global merging below.
        # --------------------------------------------------

        chunk_entity_ids.append(
            chunk_extractions
        )

    # --------------------------------------------------
    # 3. MERGE + DEDUPLICATE ALL KNOWLEDGE
    # --------------------------------------------------

    knowledge = merge_knowledge(
        all_extractions
    )

    # --------------------------------------------------
    # 4. BUILD CANONICAL ENTITY ID LOOKUP
    # --------------------------------------------------

    canonical_entity_lookup = {}

    for entity in knowledge["entities"]:
        key = (
            entity["type"].strip().lower(),
            normalize_name(entity["name"]),
        )

        canonical_entity_lookup[key] = entity["id"]

    # --------------------------------------------------
    # 5. RESOLVE ENTITY IDs FOR EACH CHROMA CHUNK
    # --------------------------------------------------

    resolved_chunk_entity_ids = []

    extraction_offset = 0

    for chunk_extractions in chunk_entity_ids:

        resolved_ids = set()

        for extraction in chunk_extractions:

            for entity in extraction.get(
                "entities",
                [],
            ):

                key = (
                    entity["type"].strip().lower(),
                    normalize_name(entity["name"]),
                )

                canonical_id = canonical_entity_lookup.get(
                    key
                )

                if canonical_id:
                    resolved_ids.add(
                        canonical_id
                    )

        resolved_chunk_entity_ids.append(
            sorted(resolved_ids)
        )

        extraction_offset += len(
            chunk_extractions
        )

    # --------------------------------------------------
    # 6. STORE KNOWLEDGE IN NEO4J
    # --------------------------------------------------

    graph_result = store_knowledge(
        knowledge
    )

    # --------------------------------------------------
    # 7. STORE DOCUMENT CHUNKS IN CHROMADB
    # --------------------------------------------------

    add_chunks(
        chunks=chroma_chunks,
        document_id=document_id,
        filename=filename,
        chunk_entity_ids=resolved_chunk_entity_ids,
    )

    return {
        "text_length": len(text),
        "chunks_created": len(chroma_chunks),
        "entities_created": graph_result[
            "entities_created"
        ],
        "relationships_created": graph_result[
            "relationships_created"
        ],
    }


def normalize_name(name: str) -> str:
    """
    Normalize an entity name for matching.
    """
    return " ".join(
        name.strip().lower().split()
    )


def create_chunks(
    text: str,
    chunk_size: int = CHROMA_CHUNK_SIZE,
    overlap: int = CHROMA_CHUNK_OVERLAP,
) -> list[str]:

    if chunk_size <= 0:
        raise ValueError(
            "chunk_size must be greater than zero."
        )

    if overlap < 0:
        raise ValueError(
            "overlap cannot be negative."
        )

    if overlap >= chunk_size:
        raise ValueError(
            "overlap must be smaller than chunk_size."
        )

    words = text.split()

    chunks = []

    start = 0

    step = chunk_size - overlap

    while start < len(words):

        end = start + chunk_size

        chunk = " ".join(
            words[start:end]
        )

        if chunk.strip():
            chunks.append(chunk)

        start += step

    return chunks