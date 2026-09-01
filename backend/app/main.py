from fastapi import FastAPI

from app.api.ingestion import router as ingestion_router
from app.api.query import router as query_router
from app.database.neo4j import verify_connection

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

@app.get("/health/neo4j")
def neo4j_health():
    connected = verify_connection()

    return {
        "neo4j": "connected" if connected else "disconnected"
    }

app.include_router(ingestion_router)
app.include_router(query_router)
