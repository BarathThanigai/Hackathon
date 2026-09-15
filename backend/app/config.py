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
    os.getenv("MEMORYMAP_AI_TIMEOUT_SECONDS", "600")
)

# Ollama runs on the same machine as the API by default.  It deliberately has
# no API key: Ollama's local HTTP API should not be exposed to an untrusted
# network without putting authentication in front of it.
MEMORYMAP_OLLAMA_BASE_URL = os.getenv(
    "MEMORYMAP_OLLAMA_BASE_URL", "http://127.0.0.1:11434"
).rstrip("/")
MEMORYMAP_OLLAMA_MODEL = os.getenv(
    "MEMORYMAP_OLLAMA_MODEL", "llama3.2"
)
MEMORYMAP_OLLAMA_EMBEDDING_MODEL = os.getenv(
    "MEMORYMAP_OLLAMA_EMBEDDING_MODEL", "nomic-embed-text"
)
MEMORYMAP_OLLAMA_TIMEOUT_SECONDS = int(
    os.getenv("MEMORYMAP_OLLAMA_TIMEOUT_SECONDS", "600")
)

# =========================
# Embedding Configuration
# =========================

MEMORYMAP_EMBEDDING_MODEL = os.getenv(
    "MEMORYMAP_EMBEDDING_MODEL",
    "nvidia/nemotron-3-embed-1b"
)


# The selected provider is intentionally process-local.  This makes switching
# immediate while keeping API keys server-side; set MEMORYMAP_AI_PROVIDER to
# choose the provider again after a backend restart.
_requested_ai_provider = MEMORYMAP_AI_PROVIDER.lower()
_active_ai_provider = (
    "ollama"
    if _requested_ai_provider == "nvidia" and not MEMORYMAP_AI_API_KEY
    else _requested_ai_provider
)


def get_ai_provider() -> str:
    # Keep the service usable if a key is removed after the app has started
    # (for example by a deployment secret rotation).
    if _active_ai_provider == "nvidia" and not MEMORYMAP_AI_API_KEY:
        return "ollama"
    return _active_ai_provider


def set_ai_provider(provider: str) -> str:
    global _active_ai_provider
    provider = provider.lower()
    if provider not in {"nvidia", "ollama"}:
        raise ValueError("provider must be either 'nvidia' or 'ollama'")
    _active_ai_provider = provider
    return _active_ai_provider


def get_public_ai_config() -> dict:
    """Return provider details safe to expose to the frontend (never a key)."""
    active = get_ai_provider()
    return {
        "active_provider": active,
        "providers": {
            "nvidia": {
                "label": "API key (NVIDIA NIM)",
                "model": MEMORYMAP_AI_MODEL,
                "configured": bool(MEMORYMAP_AI_API_KEY),
            },
            "ollama": {
                "label": "Ollama (local)",
                "model": MEMORYMAP_OLLAMA_MODEL,
                "configured": True,
            },
        },
    }


# =========================
# Neo4j Configuration
# =========================

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "neo4j")
