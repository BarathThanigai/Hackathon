import requests

from app import config


JSON_EXTRACTION_SYSTEM_PROMPT = (
    "You extract knowledge graphs. Return only a valid JSON object with "
    "exactly the keys entities and relationships. Do not include reasoning, "
    "analysis, markdown, or any text outside that JSON object."
)

GENERAL_SYSTEM_PROMPT = (
    "You are a helpful organizational knowledge assistant. "
    "Answer accurately and concisely using the context in the user's prompt."
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
    provider = config.get_ai_provider()
    system_prompt = JSON_EXTRACTION_SYSTEM_PROMPT if extraction_request else GENERAL_SYSTEM_PROMPT
    messages = [
        {
            "role": "system",
            "content": system_prompt,
        },
        {
            "role": "user",
            "content": prompt,
        },
    ]

    if provider == "ollama":
        return _generate_ollama_completion(
            messages, response_format=response_format, max_tokens=max_tokens,
            extraction_request=extraction_request,
        )

    if provider != "nvidia":
        raise RuntimeError(f"Unsupported AI provider: {provider}")

    url = f"{config.MEMORYMAP_AI_BASE_URL}/chat/completions"
    headers = {"Authorization": f"Bearer {config.MEMORYMAP_AI_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": config.MEMORYMAP_AI_MODEL,
        "messages": messages,
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

    # Some development shells set HTTP(S)_PROXY to a local proxy that is not
    # available. NVIDIA is a hosted HTTPS API, so use a direct connection.
    session = requests.Session()
    session.trust_env = False

    try:
        response = session.post(
            url,
            headers=headers,
            json=payload,
            timeout=(10, config.MEMORYMAP_AI_TIMEOUT_SECONDS),
        )

    except requests.exceptions.Timeout as exc:
        raise RuntimeError(
            "NVIDIA AI request timed out after "
            f"{config.MEMORYMAP_AI_TIMEOUT_SECONDS} seconds. Increase "
            "MEMORYMAP_AI_TIMEOUT_SECONDS or reduce the extraction scope."
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


def _generate_ollama_completion(
    messages: list[dict], *, response_format: dict | None, max_tokens: int,
    extraction_request: bool,
) -> str:
    """Call Ollama's native local API (not its optional OpenAI compatibility API)."""
    payload = {
        "model": config.MEMORYMAP_OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
        "options": {"temperature": 0, "num_predict": max_tokens},
    }
    if response_format:
        payload["format"] = "json"

    try:
        response = requests.post(
            f"{config.MEMORYMAP_OLLAMA_BASE_URL}/api/chat",
            json=payload,
            timeout=(10, config.MEMORYMAP_OLLAMA_TIMEOUT_SECONDS),
        )
    except requests.exceptions.Timeout as exc:
        raise RuntimeError(
            "Ollama request timed out. The local model did not finish within "
            f"{config.MEMORYMAP_OLLAMA_TIMEOUT_SECONDS} seconds. Check that "
            "Ollama is running, choose a smaller/faster model, or raise "
            "MEMORYMAP_OLLAMA_TIMEOUT_SECONDS."
        ) from exc
    except requests.exceptions.RequestException as exc:
        raise RuntimeError(f"Ollama request failed. Is Ollama running? {exc}") from exc

    if not response.ok:
        raise RuntimeError(f"Ollama request failed with status {response.status_code}: {response.text}")
    try:
        data = response.json()
        content = data["message"]["content"]
    except (ValueError, KeyError, TypeError) as exc:
        raise RuntimeError("Unexpected Ollama response format.") from exc
    if extraction_request and data.get("done_reason") == "length":
        raise ExtractionLimitError("AI extraction output limit reached before the JSON response completed. Reduce the extraction scope or increase the extraction token limit.")
    if not isinstance(content, str):
        raise RuntimeError("Ollama returned non-text completion content.")
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
