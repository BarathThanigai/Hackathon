import json

from app.services.ai_client import generate_text


EXTRACTION_PROMPT = """
You are a knowledge graph extraction API.

Extract explicitly stated entities and relationships from the document.

IMPORTANT:
- Return ONLY one valid JSON object.
- Do NOT provide reasoning.
- Do NOT explain anything.
- Do NOT use markdown.
- Do NOT include ```json fences.
- Do NOT write anything before or after the JSON.
- Keep the response concise.
- Extract only information explicitly present in the document.
- Never invent entities or relationships.
- Reuse the same ID when an entity appears multiple times.

The JSON must have exactly this structure:

{
  "entities": [
    {
      "id": "unique_id",
      "type": "Person",
      "name": "entity name"
    }
  ],
  "relationships": [
    {
      "source": "entity_id",
      "type": "PROPOSED",
      "target": "entity_id"
    }
  ]
}

Allowed entity types:
Person, Technology, Service, Project, Meeting, Decision, PullRequest, Issue, Document

Allowed relationship types:
PROPOSED, DISCUSSED_IN, USES, RELATED_TO, IMPLEMENTED_BY, MADE_BY, WORKED_ON, CAUSED_BY, AFFECTS, MENTIONED_IN

Rules:
- Every relationship source must reference an entity ID.
- Every relationship target must reference an entity ID.
- Do not create entities merely because they could be inferred.
- Use concise entity names.
- Return empty arrays if nothing can be extracted.

DOCUMENT:
"""


def extract_knowledge(text: str) -> dict:
    prompt = EXTRACTION_PROMPT + "\n" + text

    response = generate_text(prompt).strip()

    print("\nRAW AI RESPONSE:")
    print(response)

    # Remove markdown fences if the model ignores the instruction.
    if "```json" in response:
        response = response.split("```json", 1)[1]
        response = response.split("```", 1)[0].strip()

    elif "```" in response:
        response = response.split("```", 1)[1]
        response = response.split("```", 1)[0].strip()

    # Find JSON object if the model adds unwanted text.
    start = response.find("{")
    end = response.rfind("}")

    if start == -1 or end == -1:
        raise ValueError(
            f"AI returned no JSON object:\n{response}"
        )

    json_text = response[start:end + 1]

    try:
        data = json.loads(json_text)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"AI returned invalid JSON:\n{json_text}"
        ) from e

    # Validate top-level structure.
    if set(data.keys()) != {"entities", "relationships"}:
        raise ValueError(
            "AI response must contain exactly 'entities' and 'relationships'"
        )

    if not isinstance(data["entities"], list):
        raise ValueError("'entities' must be a list")

    if not isinstance(data["relationships"], list):
        raise ValueError("'relationships' must be a list")

    # Validate entities.
    allowed_entity_types = {
        "Person",
        "Technology",
        "Service",
        "Project",
        "Meeting",
        "Decision",
        "PullRequest",
        "Issue",
        "Document",
    }

    entity_ids = set()

    for entity in data["entities"]:
        if not all(key in entity for key in ("id", "type", "name")):
            raise ValueError(
                f"Invalid entity structure: {entity}"
            )

        if entity["type"] not in allowed_entity_types:
            raise ValueError(
                f"Invalid entity type: {entity['type']}"
            )

        entity_ids.add(entity["id"])

    # Validate relationships.
    allowed_relationship_types = {
        "PROPOSED",
        "DISCUSSED_IN",
        "USES",
        "RELATED_TO",
        "IMPLEMENTED_BY",
        "MADE_BY",
        "WORKED_ON",
        "CAUSED_BY",
        "AFFECTS",
        "MENTIONED_IN",
    }

    for relationship in data["relationships"]:
        if not all(
            key in relationship
            for key in ("source", "type", "target")
        ):
            raise ValueError(
                f"Invalid relationship structure: {relationship}"
            )

        if relationship["type"] not in allowed_relationship_types:
            raise ValueError(
                f"Invalid relationship type: {relationship['type']}"
            )

        if relationship["source"] not in entity_ids:
            raise ValueError(
                f"Unknown relationship source: "
                f"{relationship['source']}"
            )

        if relationship["target"] not in entity_ids:
            raise ValueError(
                f"Unknown relationship target: "
                f"{relationship['target']}"
            )

    return data