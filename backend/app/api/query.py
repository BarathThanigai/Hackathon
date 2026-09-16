from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.rag import answer_query


router = APIRouter(
    prefix="/api/query",
    tags=["Query"]
)


class QueryRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    n_results: int = Field(default=5, ge=1, le=5)
    project_id: str = Field(default="all", min_length=1, max_length=200)
    project_name: str | None = Field(default=None, max_length=200)


@router.post("")
def query_documents(request: QueryRequest):

    try:
        return answer_query(
            request.question,
            n_results=request.n_results,
            project_id=request.project_id,
            project_name=request.project_name,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"RAG query failed: {exc}") from exc
