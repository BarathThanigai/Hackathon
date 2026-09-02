import json

from app.services.ai_client import generate_text


EXTRACTION_PROMPT = """
You are a knowledge graph extraction API.

Your entire response MUST be exactly ONE valid JSON object.

DO NOT:
- explain your answer
- provide reasoning
- provide analysis
- describe your process
- use markdown
- use code fences
- output text before or after the JSON
- invent entities
- invent relationships
- use placeholder examples such as Alice or React

Extract only entities and relationships explicitly present in the document.

The JSON structure MUST be:

{
  "entities": [
    {
      "id": "unique_id",
      "type": "Technology",
      "name": "entity name"
    }
  ],
  "relationships": [
    {
      "source": "entity_id",
      "type": "USES",
      "target": "entity_id"
    }
  ]
}

Allowed entity types:
Person, Technology, Service, Project, Meeting, Decision, PullRequest, Issue, Document

Allowed relationship types:
PROPOSED, DISCUSSED_IN, USES, RELATED_TO, IMPLEMENTED_BY, MADE_BY, WORKED_ON, CAUSED_BY, AFFECTS, MENTIONED_IN

Rules:
- Extract only explicitly mentioned entities.
- Extract only relationships explicitly supported by the document.
- Imports and direct usage of a library can be represented using USES.
- Reuse the same ID when the same entity appears multiple times.
- Every relationship source must reference an entity.
- Every relationship target must reference an entity.
- Do not invent people, projects, technologies, or relationships.
- If nothing can be extracted, return:
{"entities":[],"relationships":[]}

Return ONLY the JSON object.

DOCUMENT:
"""


def extract_json_object(response: str) -> dict:
    """
    Extract the first valid JSON object from an AI response.
    Handles models that incorrectly add reasoning or markdown.
    """

    decoder = json.JSONDecoder()

    # Try to find every possible JSON object start.
    for index, char in enumerate(response):

        if char != "{":
            continue

        try:
            data, end = decoder.raw_decode(response[index:])

            if isinstance(data, dict):
                return data

        except json.JSONDecodeError:
            continue

    raise ValueError(
        "AI did not return a valid knowledge graph JSON object:\n"
        + response
    )


def extract_knowledge(text: str) -> dict:

    prompt = EXTRACTION_PROMPT + "\n" + text

    response = generate_text(prompt).strip()

    print("\nRAW AI RESPONSE:")
    print(response)

    data = extract_json_object(response)

    # -------------------------
    # Validate top-level object
    # -------------------------

    if set(data.keys()) != {"entities", "relationships"}:
        raise ValueError(
            "AI response must contain exactly "
            "'entities' and 'relationships'"
        )

    if not isinstance(data["entities"], list):
        raise ValueError("'entities' must be a list")

    if not isinstance(data["relationships"], list):
        raise ValueError("'relationships' must be a list")

    # -------------------------
    # Validate entities
    # -------------------------

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

        if not isinstance(entity, dict):
            raise ValueError(
                f"Invalid entity: {entity}"
            )

        if not all(
            key in entity
            for key in ("id", "type", "name")
        ):
            raise ValueError(
                f"Invalid entity structure: {entity}"
            )

        if entity["type"] not in allowed_entity_types:
            raise ValueError(
                f"Invalid entity type: {entity['type']}"
            )

        entity_ids.add(entity["id"])

    # -------------------------
    # Validate relationships
    # -------------------------

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

        if not isinstance(relationship, dict):
            raise ValueError(
                f"Invalid relationship: {relationship}"
            )

        if not all(
            key in relationship
            for key in ("source", "type", "target")
        ):
            raise ValueError(
                f"Invalid relationship structure: {relationship}"
            )

        if relationship["type"] not in allowed_relationship_types:
            raise ValueError(
                f"Invalid relationship type: "
                f"{relationship['type']}"
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