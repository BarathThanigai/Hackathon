from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.ingestion_service import ingest_document


router = APIRouter(
    prefix="/api/ingestion",
    tags=["Ingestion"]
)


UPLOAD_DIR = (
    Path(__file__).resolve().parents[3]
    / "data"
    / "documents"
)


SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".txt",
    ".md",
    ".docx"
}


@router.post("/document")
async def upload_document(
    file: UploadFile = File(...)
):

    extension = Path(file.filename).suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. "
                   "Supported: PDF, TXT, MD, DOCX"
        )

    UPLOAD_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    document_id = str(uuid4())

    safe_filename = (
        f"{document_id}_{file.filename}"
    )

    file_path = UPLOAD_DIR / safe_filename

    try:

        contents = await file.read()

        with open(file_path, "wb") as f:
            f.write(contents)

        result = ingest_document(
            file_path=str(file_path),
            document_id=document_id,
            filename=file.filename
        )

        return {
            "status": "completed",
            "document_id": document_id,
            "filename": file.filename,
            "file_type": extension,
            "text_length": result["text_length"],
            "chunks_created": result["chunks_created"]
        }

    except Exception as e:

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )