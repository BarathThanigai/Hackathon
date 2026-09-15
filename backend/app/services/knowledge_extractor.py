import json
import logging
import re

from app.services.ai_client import generate_json
from app.services.knowledge_schema import (
    ALLOWED_ENTITY_TYPES,
    ALLOWED_RELATIONSHIP_TYPES,
    RELATIONSHIP_TYPE_ALIASES,
)


logger = logging.getLogger(__name__)


EXTRACTION_PROMPT = """
You are a knowledge graph extraction API.

Return exactly one minified JSON object:
{"entities":[...],"relationships":[...]}

No markdown, prose, reasoning, code fences, or fields beyond that shape.

Each entity must be exactly:
{"id":"e1","type":"Type","name":"short source name"}

Each relationship must be exactly:
{"source":"e1","type":"RELATED_TO","target":"e2"}

Use short sequential IDs (e1, e2, ...).
Use concise source names.
Do not include descriptions.

Allowed entity types:
Person, Organization, Institution, Technology, Service, Project, Meeting,
Event, Decision, PullRequest, Issue, Certification, Document

Allowed relationship types:
PROPOSED, DISCUSSED_IN, USES, RELATED_TO, IMPLEMENTED_BY, MADE_BY,
WORKED_ON, CAUSED_BY, AFFECTS, MENTIONED_IN, AFFILIATED_WITH, ATTENDED, EARNED,
PROVIDES

For certifications:
Person -> EARNED -> Certification

Never use EARNED_BY.

Rules:
- Extract only explicitly mentioned entities.
- Extract only relationships explicitly supported by the document.
- Reuse the same ID for the same entity.
- Every relationship source and target must reference an existing entity.
- Do not invent entities or relationships.
- For resumes, prioritize the person, organizations, institutions,
  substantive projects, certifications, and events.
- Add Technology only when it is central to demonstrated work or a
  certification.
- Do not create an entity for every listed skill or tool.
- Do not create an entity for a section heading, category label, or document
    structure marker (e.g. "Education", "Agenda", "Action Items", "Summary").
    Extract the specific named entity described by the surrounding text instead.
- Maximum 40 total entities.
- Maximum 20 Technology entities.
- Maximum 60 relationships.

If nothing qualifies:
{"entities":[],"relationships":[]}

DOCUMENT:
"""


JSON_FENCE_PATTERN = re.compile(
    r"```(?:json)?[ \t]*\n(?P<body>[\s\S]*?)\n```",
    re.IGNORECASE,
)


def _unwrap_json_fence(response: str) -> str:
    """
    Accept a single Markdown JSON fence, but reject surrounding prose.
    """
    match = JSON_FENCE_PATTERN.fullmatch(response)

    if match:
        return match.group("body")

    return response


def _remove_trailing_commas(response: str) -> str:
    """
    Remove commas immediately before ] or } outside JSON strings.
    """

    normalized = []

    in_string = False
    escaped = False
    index = 0

    while index < len(response):
        char = response[index]

        if in_string:
            normalized.append(char)

            if escaped:
                escaped = False

            elif char == "\\":
                escaped = True

            elif char == '"':
                in_string = False

            index += 1
            continue

        if char == '"':
            in_string = True
            normalized.append(char)
            index += 1
            continue

        if char == ",":
            next_index = index + 1

            while (
                next_index < len(response)
                and response[next_index].isspace()
            ):
                next_index += 1

            if (
                next_index < len(response)
                and response[next_index] in "]}"
            ):
                index += 1
                continue

        normalized.append(char)
        index += 1

    return "".join(normalized)


def extract_json_object(response: str) -> dict:
    """
    Parse a complete JSON response.

    Only narrowly scoped formatting cleanup is allowed:
    - UTF-8 BOM removal
    - one Markdown JSON fence
    - trailing comma removal

    Incomplete or malformed JSON is rejected.
    """

    if not isinstance(response, str) or not response.strip():
        raise ValueError(
            "AI extraction response must be a non-empty JSON object."
        )

    normalized_response = response.strip().lstrip("\ufeff")

    normalized_response = _unwrap_json_fence(
        normalized_response
    )

    normalized_response = _remove_trailing_commas(
        normalized_response
    )

    try:
        data = json.loads(normalized_response)

    except json.JSONDecodeError as exc:
        raise ValueError(
            "AI extraction response must contain only valid JSON."
        ) from exc

    if not isinstance(data, dict):
        raise ValueError(
            "AI extraction response must be a JSON object."
        )

    return data


def _normalize_extraction_data(data: dict) -> dict:
    """Map common model omissions and name-based references to our schema."""
    if not isinstance(data, dict) or "entities" not in data or "relationships" not in data:
        return data
    if not isinstance(data["entities"], list) or not isinstance(data["relationships"], list):
        return data

    entities = []
    name_to_id = {}
    for index, raw_entity in enumerate(data["entities"], start=1):
        if not isinstance(raw_entity, dict):
            entities.append(raw_entity)
            continue
        name = str(raw_entity.get("name", "")).strip()
        entity_id = str(raw_entity.get("id") or f"e{index}").strip()
        entity_type = str(raw_entity.get("type", "")).strip()
        if not name or not entity_type:
            continue
        entities.append({"id": entity_id, "type": entity_type, "name": name})
        if name:
            name_to_id[name.casefold()] = entity_id
        name_to_id[entity_id.casefold()] = entity_id

    relationships = []
    for raw_relationship in data["relationships"]:
        if not isinstance(raw_relationship, dict):
            relationships.append(raw_relationship)
            continue
        source = str(raw_relationship.get("source", "")).strip()
        target = str(raw_relationship.get("target", "")).strip()
        relationship_type = str(raw_relationship.get("type", "")).strip().upper().replace(" ", "_").replace("-", "_")
        relationship_type = RELATIONSHIP_TYPE_ALIASES.get(relationship_type, relationship_type)
        normalized_source = name_to_id.get(source.casefold())
        normalized_target = name_to_id.get(target.casefold())
        if not normalized_source or not normalized_target or not relationship_type:
            continue
        relationships.append({
            "source": normalized_source,
            "type": relationship_type,
            "target": normalized_target,
        })

    return {"entities": entities, "relationships": relationships}


def extract_knowledge(text: str) -> dict:
    """
    Extract and validate entities and relationships from document text.
    """

    prompt = EXTRACTION_PROMPT + "\n" + text

    response = generate_json(prompt).strip()

    data = _normalize_extraction_data(extract_json_object(response))

    # --------------------------------------------------
    # Validate top-level object
    # --------------------------------------------------

    if set(data.keys()) != {
        "entities",
        "relationships",
    }:
        raise ValueError(
            "AI response must contain exactly "
            "'entities' and 'relationships'."
        )

    if not isinstance(data["entities"], list):
        raise ValueError(
            "'entities' must be a list."
        )

    if not isinstance(data["relationships"], list):
        raise ValueError(
            "'relationships' must be a list."
        )

    # --------------------------------------------------
    # Validate entities
    # --------------------------------------------------

    entity_ids = set()

    for entity in data["entities"]:

        if not isinstance(entity, dict):
            raise ValueError(
                f"Invalid entity: {entity}"
            )

        # Some model responses use Cypher-style ``:id``. Normalize that
        # single spelling before enforcing the public extraction schema.
        if ":id" in entity and "id" not in entity:
            entity["id"] = entity.pop(":id")

        if set(entity) != {
            "id",
            "type",
            "name",
        }:
            raise ValueError(
                f"Invalid entity structure: {entity}"
            )

        if entity["type"] not in ALLOWED_ENTITY_TYPES:
            raise ValueError(
                f"Invalid entity type: {entity['type']}"
            )

        if not all(
            isinstance(entity[key], str)
            and entity[key].strip()
            for key in (
                "id",
                "type",
                "name",
            )
        ):
            raise ValueError(
                f"Invalid entity values: {entity}"
            )

        if entity["id"] in entity_ids:
            raise ValueError(
                f"Duplicate entity ID: {entity['id']}"
            )

        entity_ids.add(entity["id"])

    # --------------------------------------------------
    # Validate relationships
    # --------------------------------------------------

    for relationship in data["relationships"]:

        if not isinstance(relationship, dict):
            raise ValueError(
                f"Invalid relationship: {relationship}"
            )

        if set(relationship) != {
            "source",
            "type",
            "target",
        }:
            raise ValueError(
                f"Invalid relationship structure: {relationship}"
            )

        if not all(
            isinstance(relationship[key], str)
            and relationship[key].strip()
            for key in (
                "source",
                "type",
                "target",
            )
        ):
            raise ValueError(
                f"Invalid relationship values: {relationship}"
            )

        # --------------------------------------------------
        # Normalize common LLM-generated aliases
        # --------------------------------------------------

        relationship_type = RELATIONSHIP_TYPE_ALIASES.get(
            relationship["type"],
            relationship["type"],
        )

        if relationship_type not in ALLOWED_RELATIONSHIP_TYPES:
            logger.warning("Dropping relationship with unknown type: %s", relationship_type)
            continue

        # Store canonical relationship type.
        relationship["type"] = relationship_type

        # --------------------------------------------------
        # Validate relationship references
        # --------------------------------------------------

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
