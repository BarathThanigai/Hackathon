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
                "role": "system",
                "content": (
                    "You are a JSON-only knowledge graph extraction system. "
                    "Return ONLY one valid JSON object. "
                    "The JSON object must contain exactly two fields: "
                    "\"entities\" and \"relationships\". "
                    "Never provide reasoning, analysis, explanations, "
                    "markdown, or code fences."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "temperature": 0.0,
        "top_p": 1.0,
        "max_tokens": 2048,
    }

    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=(10, 180),
        )

    except requests.exceptions.Timeout as exc:
        raise RuntimeError(
            "NVIDIA AI request timed out."
        ) from exc

    except requests.exceptions.RequestException as exc:
        raise RuntimeError(
            f"NVIDIA AI request failed: {exc}"
        ) from exc

    if not response.ok:
        print("NVIDIA STATUS:", response.status_code)
        print("NVIDIA RESPONSE:", response.text)

    response.raise_for_status()

    data = response.json()

    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(
            f"Unexpected NVIDIA API response:\n{data}"
        ) from exc