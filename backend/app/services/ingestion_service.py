from pathlib import Path

from app.processors.document_parser import extract_text
from app.database.chroma import add_chunks


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

    chunks = create_chunks(text)

    add_chunks(
        chunks=chunks,
        document_id=document_id,
        filename=filename
    )

    return {
        "text_length": len(text),
        "chunks_created": len(chunks)
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