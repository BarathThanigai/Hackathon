from pathlib import Path
from uuid import uuid4
from urllib.parse import urlparse

from fastapi import APIRouter, BackgroundTasks, UploadFile, File, HTTPException
from pydantic import BaseModel

from app.services.ingestion_service import ingest_document
from app.services.ingestion_jobs import create_job, fail_job, finish_job, get_job, update_job
from app.services.github_ingestion import ingest_github_repository


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


class RepositoryRequest(BaseModel):
    url: str


@router.post("/document")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
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

        create_job(document_id, file.filename, kind="document")
        background_tasks.add_task(
            _process_document, document_id, file_path, file.filename
        )
        return {
            "status": "processing",
            "document_id": document_id,
            "filename": file.filename,
            "file_type": extension,
            "checkpoint": "uploaded",
            "checkpoints": ["Uploaded"],
        }

    except Exception as e:
        import traceback
        traceback.print_exc()

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/document/{document_id}")
def get_document_ingestion_status(document_id: str):
    job = get_job(document_id)
    if not job:
        raise HTTPException(status_code=404, detail="Ingestion job not found.")
    return job


@router.post("/repository")
def ingest_repository(request: RepositoryRequest, background_tasks: BackgroundTasks):
    repo_name = _repository_name_from_url(request.url)
    job_id = str(uuid4())
    create_job(job_id, repo_name, kind="repository")
    background_tasks.add_task(_process_repository, job_id, repo_name)
    return {
        "status": "processing",
        "document_id": job_id,
        "filename": repo_name,
        "kind": "repository",
        "checkpoint": "queued",
        "checkpoints": ["Repository queued"],
    }


def _repository_name_from_url(url: str) -> str:
    parsed = urlparse(url.strip())
    if parsed.scheme not in {"http", "https"} or parsed.netloc.lower() != "github.com":
        raise HTTPException(status_code=400, detail="Enter a GitHub repository URL, e.g. https://github.com/owner/repository.")
    parts = [part for part in parsed.path.strip("/").split("/") if part]
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="Enter a GitHub repository URL with an owner and repository name.")
    return f"{parts[0]}/{parts[1].removesuffix('.git')}"


def _process_document(document_id: str, file_path: Path, filename: str) -> None:
    def checkpoint(name: str, label: str, **details) -> None:
        update_job(document_id, name, label, **details)

    try:
        result = ingest_document(
            file_path=str(file_path),
            document_id=document_id,
            filename=filename,
            checkpoint=checkpoint,
        )
        finish_job(document_id, result)
    except Exception as exc:
        import traceback
        traceback.print_exc()
        fail_job(document_id, str(exc))
        if file_path.exists():
            file_path.unlink()


def _process_repository(job_id: str, repo_name: str) -> None:
    def checkpoint(name: str, label: str, **details) -> None:
        update_job(job_id, name, label, **details)

    try:
        result = ingest_github_repository(repo_name, checkpoint=checkpoint)
        finish_job(job_id, result)
    except Exception as exc:
        import traceback
        traceback.print_exc()
        fail_job(job_id, str(exc))
