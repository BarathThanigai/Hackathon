import os
from dotenv import load_dotenv

load_dotenv()

# =========================
# MemoryMap AI Configuration
# =========================

MEMORYMAP_AI_PROVIDER = os.getenv(
    "MEMORYMAP_AI_PROVIDER",
    "nvidia"
)

MEMORYMAP_AI_API_KEY = os.getenv("MEMORYMAP_AI_API_KEY")

MEMORYMAP_AI_BASE_URL = os.getenv(
    "MEMORYMAP_AI_BASE_URL",
    "https://integrate.api.nvidia.com/v1"
)

MEMORYMAP_AI_MODEL = os.getenv(
    "MEMORYMAP_AI_MODEL",
    "nvidia/nemotron-3.5-lightning-30b-a3b"
)

MEMORYMAP_AI_TIMEOUT_SECONDS = int(
    os.getenv("MEMORYMAP_AI_TIMEOUT_SECONDS", "180")
)

# =========================
# Embedding Configuration
# =========================

MEMORYMAP_EMBEDDING_MODEL = os.getenv(
    "MEMORYMAP_EMBEDDING_MODEL",
    "nvidia/nemotron-3-embed-1b"
)


# =========================
# Neo4j Configuration
# =========================

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "neo4j")