from google import genai
from google.genai import types

from app import config


if not config.GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not configured.")


client = genai.Client(
    api_key=config.GEMINI_API_KEY
)


# =========================
# Structured Extraction Schema
# =========================

EXTRACTION_SCHEMA = {
    "type": "object",
    "properties": {
        "entities": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string"
                    },
                    "type": {
                        "type": "string"
                    },
                    "name": {
                        "type": "string"
                    }
                },
                "required": [
                    "id",
                    "type",
                    "name"
                ]
            }
        },
        "relationships": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "source": {
                        "type": "string"
                    },
                    "type": {
                        "type": "string"
                    },
                    "target": {
                        "type": "string"
                    }
                },
                "required": [
                    "source",
                    "type",
                    "target"
                ]
            }
        }
    },
    "required": [
        "entities",
        "relationships"
    ]
}


# =========================
# Gemini JSON Generation
# =========================

def generate_json(prompt: str) -> str:
    try:
        response = client.models.generate_content(
            model=config.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.0,
                response_mime_type="application/json",
                response_schema=EXTRACTION_SCHEMA,
            ),
        )

    except Exception as exc:
        raise RuntimeError(
            f"Gemini extraction request failed: {exc}"
        ) from exc

    if not response.text:
        raise RuntimeError(
            "Gemini returned an empty extraction response."
        )

    return response.text


# =========================
# Gemini Text Generation
# =========================

def generate_text(prompt: str) -> str:
    try:
        response = client.models.generate_content(
            model=config.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
            ),
        )

    except Exception as exc:
        raise RuntimeError(
            f"Gemini text generation request failed: {exc}"
        ) from exc

    if not response.text:
        raise RuntimeError(
            "Gemini returned an empty response."
        )

    return response.text