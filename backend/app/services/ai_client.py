import requests

from app import config


def generate_text(prompt: str) -> str:
    url = f"{config.MEMORYMAP_AI_BASE_URL}/chat/completions"

    headers = {
        "Authorization": f"Bearer {config.MEMORYMAP_AI_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
    "model": config.MEMORYMAP_AI_MODEL,
    "messages": [
        {
            "role": "user",
            "content": prompt,
        }
    ],
    "temperature": 0.0,
    "top_p": 1.0,
    "max_tokens": 8192,
}

    response = requests.post(
        url,
        headers=headers,
        json=payload,
        timeout=config.MEMORYMAP_AI_TIMEOUT_SECONDS,
    )

    if not response.ok:
        print("NVIDIA STATUS:", response.status_code)
        print("NVIDIA RESPONSE:", response.text)

    response.raise_for_status()

    data = response.json()

    return data["choices"][0]["message"]["content"]