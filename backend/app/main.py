from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.ingestion import router as ingestion_router
from app.api.query import router as query_router
from app.database.neo4j import verify_connection
from app.services.seed_graph import seed_redis_example

app = FastAPI(
    title="MemoryMap API",
    description="AI-powered Organizational Memory Platform"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
@app.post("/graph/seed")
def seed_graph():
    result = seed_redis_example()

    return {
        "status": "success",
        "message": "Redis example added to knowledge graph",
        "graph": result,
    }
    
app.include_router(ingestion_router)
app.include_router(query_router)
