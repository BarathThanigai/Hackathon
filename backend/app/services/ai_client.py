import requests

from app import config


JSON_EXTRACTION_SYSTEM_PROMPT = (
    "You extract knowledge graphs. Return only a valid JSON object with "
    "exactly the keys entities and relationships. Do not include reasoning, "
    "analysis, markdown, or any text outside that JSON object."
)

DEFAULT_MAX_TOKENS = 2048
EXTRACTION_MAX_TOKENS = 8192


class ExtractionLimitError(RuntimeError):
    """Raised when the model stops before it can finish extraction JSON."""


def _generate_completion(
    prompt: str,
    *,
    response_format: dict | None = None,
    disable_thinking: bool = False,
    max_tokens: int = DEFAULT_MAX_TOKENS,
    extraction_request: bool = False,
) -> str:
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
                "content": JSON_EXTRACTION_SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "temperature": 0.0,
        "top_p": 1.0,
        "max_tokens": max_tokens,
    }

    if response_format:
        payload["response_format"] = response_format

    if disable_thinking:
        # Nemotron 3.5 exposes this OpenAI-compatible template option.
        # Keep reasoning out of the model content returned to ingestion.
        payload["chat_template_kwargs"] = {"enable_thinking": False}

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
        raise RuntimeError(
            f"NVIDIA AI request failed with status {response.status_code}."
        )

    try:
        data = response.json()
    except ValueError as exc:
        raise RuntimeError("NVIDIA AI returned a non-JSON API response.") from exc

    try:
        choice = data["choices"][0]
        content = choice["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(
            "Unexpected NVIDIA AI response format."
        ) from exc

    if extraction_request and choice.get("finish_reason") in {"length", "max_tokens"}:
        raise ExtractionLimitError(
            "AI extraction output limit reached before the JSON response completed. "
            "Reduce the extraction scope or increase the extraction token limit."
        )

    if not isinstance(content, str):
        raise RuntimeError("NVIDIA AI returned non-text completion content.")

    return content


def generate_text(prompt: str) -> str:
    return _generate_completion(prompt)


def generate_json(prompt: str) -> str:
    """Request a JSON object while disabling Nemotron's thinking output."""
    return _generate_completion(
        prompt,
        response_format={"type": "json_object"},
        disable_thinking=True,
        max_tokens=EXTRACTION_MAX_TOKENS,
        extraction_request=True,
    )
