import requests

from app import config


def generate_embedding(text: str) -> list[float]:
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

    response = requests.post(
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