from fastapi import APIRouter
from pydantic import BaseModel

from app.database.chroma import search_chunks


router = APIRouter(
    prefix="/api/query",
    tags=["Query"]
)


class QueryRequest(BaseModel):
    question: str
    n_results: int = 5


@router.post("")
def query_documents(request: QueryRequest):

    results = search_chunks(
        query=request.question,
        n_results=request.n_results
    )

    return results