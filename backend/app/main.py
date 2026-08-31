from fastapi import FastAPI

from app.api.ingestion import router as ingestion_router
from app.api.query import router as query_router

app = FastAPI(
    title="MemoryMap API",
    description="AI-powered Organizational Memory Platform"
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "MemoryMap"
    }


app.include_router(ingestion_router)
app.include_router(query_router)
