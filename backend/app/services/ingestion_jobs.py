"""In-memory progress tracking for document ingestion jobs."""

from datetime import datetime, timezone
from threading import Lock


_jobs: dict[str, dict] = {}
_jobs_lock = Lock()


def create_job(job_id: str, filename: str, kind: str = "document") -> dict:
    initial_checkpoint = "uploaded" if kind == "document" else "queued"
    initial_label = "Uploaded" if kind == "document" else "Repository queued"
    job = {
        "id": job_id,
        "filename": filename,
        "kind": kind,
        "status": "processing",
        "checkpoint": initial_checkpoint,
        "checkpoints": [initial_label],
        "error": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    with _jobs_lock:
        _jobs[job_id] = job
    return job.copy()


def update_job(job_id: str, checkpoint: str, label: str, **details) -> None:
    with _jobs_lock:
        job = _jobs[job_id]
        job["checkpoint"] = checkpoint
        if label not in job["checkpoints"]:
            job["checkpoints"].append(label)
        job.update(details)


def finish_job(job_id: str, result: dict) -> None:
    update_job(job_id, "completed", "Completed", status="completed", result=result)


def fail_job(job_id: str, error: str) -> None:
    update_job(job_id, "failed", "Failed", status="failed", error=error)


def get_job(job_id: str) -> dict | None:
    with _jobs_lock:
        job = _jobs.get(job_id)
        return job.copy() if job else None
