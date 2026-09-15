import requests

from app import config


def generate_embedding(text: str) -> list[float]:
    if config.get_ai_provider() == "ollama":
        return _generate_ollama_embedding(text)

    url = f"{config.MEMORYMAP_AI_BASE_URL}/embeddings"

    headers = {
        "Authorization": f"Bearer {config.MEMORYMAP_AI_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": config.MEMORYMAP_EMBEDDING_MODEL,
        "input": text,
        "input_type": "query",
    }

    # Do not inherit a broken local HTTP(S) proxy for the hosted NVIDIA API.
    session = requests.Session()
    session.trust_env = False
    response = session.post(
        url,
        headers=headers,
        json=payload,
        timeout=config.MEMORYMAP_AI_TIMEOUT_SECONDS,
    )

    if not response.ok:
        print("NVIDIA EMBEDDING STATUS:", response.status_code)
        print("NVIDIA EMBEDDING RESPONSE:", response.text)

    response.raise_for_status()

    data = response.json()

    return data["data"][0]["embedding"]


def _generate_ollama_embedding(text: str) -> list[float]:
    try:
        response = requests.post(
            f"{config.MEMORYMAP_OLLAMA_BASE_URL}/api/embed",
            json={"model": config.MEMORYMAP_OLLAMA_EMBEDDING_MODEL, "input": text},
            timeout=config.MEMORYMAP_AI_TIMEOUT_SECONDS,
        )
    except requests.exceptions.RequestException as exc:
        raise RuntimeError(f"Ollama embedding request failed. Is Ollama running? {exc}") from exc
    if not response.ok:
        raise RuntimeError(f"Ollama embedding request failed with status {response.status_code}: {response.text}")
    try:
        return response.json()["embeddings"][0]
    except (ValueError, KeyError, IndexError, TypeError) as exc:
        raise RuntimeError("Unexpected Ollama embedding response format.") from exc
