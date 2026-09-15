import hashlib
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
- Extract only relationships explicitly supported by the text.
- Reuse the same ID for the same entity within this extraction.
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

TEXT:
"""


JSON_FENCE_PATTERN = re.compile(
    r"^```(?:json)?\s*(?P<body>.*?)\s*```$",
    re.DOTALL | re.IGNORECASE,
)


def _unwrap_json_fence(response: str) -> str:
    """Accept a single Markdown JSON fence."""
    match = JSON_FENCE_PATTERN.fullmatch(response)
    if match:
        return match.group("body")
    return response


def _remove_trailing_commas(response: str) -> str:
    """
    Remove commas immediately before ] or } outside JSON strings.
    """
    result = []
    in_string = False
    escaped = False
    index = 0

    while index < len(response):
        char = response[index]

        if char == '"' and not escaped:
            in_string = not in_string

        if (
            not in_string
            and char == ","
        ):
            lookahead = index + 1

            while (
                lookahead < len(response)
                and response[lookahead].isspace()
            ):
                lookahead += 1

            if (
                lookahead < len(response)
                and response[lookahead] in "}]"
            ):
                index += 1
                escaped = False
                continue

        result.append(char)

        if char == "\\" and not escaped:
            escaped = True
        else:
            escaped = False

        index += 1

    return "".join(result)


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
    normalized_response = _unwrap_json_fence(normalized_response)
    normalized_response = _remove_trailing_commas(normalized_response)

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
    Validate one NVIDIA extraction response.
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
            "AI extraction response must contain exactly "
            "'entities' and 'relationships'."
        )

    if not isinstance(data["entities"], list):
        raise ValueError(
            "AI extraction 'entities' must be a list."
        )

    if not isinstance(data["relationships"], list):
        raise ValueError(
            "AI extraction 'relationships' must be a list."
        )

    entity_ids = set()

    for entity in data["entities"]:
        if not isinstance(entity, dict):
            raise ValueError(
                "Each entity must be a JSON object."
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
                "Each entity must contain exactly "
                "'id', 'type', and 'name'."
            )

        if not all(
            isinstance(entity[key], str)
            and entity[key].strip()
            for key in ("id", "type", "name")
        ):
            raise ValueError(
                "Entity id, type, and name must be non-empty strings."
            )

        if entity["type"] not in ALLOWED_ENTITY_TYPES:
            raise ValueError(
                f"Invalid entity type: {entity['type']}"
            )

        if entity["id"] in entity_ids:
            raise ValueError(
                f"Duplicate entity ID: {entity['id']}"
            )

        entity_ids.add(entity["id"])

    for relationship in data["relationships"]:
        if not isinstance(relationship, dict):
            raise ValueError(
                "Each relationship must be a JSON object."
            )

        if set(relationship.keys()) != {
            "source",
            "type",
            "target",
        }:
            raise ValueError(
                "Each relationship must contain exactly "
                "'source', 'type', and 'target'."
            )

        if not all(
            isinstance(relationship[key], str)
            and relationship[key].strip()
            for key in ("source", "type", "target")
        ):
            raise ValueError(
                "Relationship source, type, and target "
                "must be non-empty strings."
            )

        relationship_type = RELATIONSHIP_TYPE_ALIASES.get(
            relationship["type"],
            relationship["type"],
        )

        if relationship_type not in ALLOWED_RELATIONSHIP_TYPES:
            logger.warning("Dropping relationship with unknown type: %s", relationship_type)
            continue

        relationship["type"] = relationship_type

        if relationship["source"] not in entity_ids:
            raise ValueError(
                f"Relationship source does not exist: "
                f"{relationship['source']}"
            )

        if relationship["target"] not in entity_ids:
            raise ValueError(
                f"Relationship target does not exist: "
                f"{relationship['target']}"
            )

    return data

# not in resin boy code
def extract_knowledge(text: str) -> dict:
    """
    Extract knowledge from a single manageable text chunk.

    This function intentionally handles only one chunk.
    Larger documents should use extract_knowledge_from_chunks().
    """
    if not isinstance(text, str) or not text.strip():
        return {
            "entities": [],
            "relationships": [],
        }

    prompt = EXTRACTION_PROMPT + "\n" + text

    response = generate_json(prompt).strip()

    print("\n========== RAW AI RESPONSE ==========")
    print(response)
    print("====================================\n")

    data = extract_json_object(response)

    return _validate_extraction(data)


def _normalize_entity_name(name: str) -> str:
    """
    Normalize an entity name for deduplication.
    """
    normalized = name.strip().lower()
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized


def _entity_key(entity_type: str, name: str) -> str:
    """
    Create a canonical identity key for an entity.
    """
    return (
        f"{entity_type.strip().lower()}:"
        f"{_normalize_entity_name(name)}"
    )


def _stable_entity_id(entity_type: str, name: str) -> str:
    """
    Create a deterministic ID from entity type + normalized name.

    The same entity appearing in multiple documents/chunks will
    therefore receive the same ID.
    """
    key = _entity_key(entity_type, name)

    digest = hashlib.sha256(
        key.encode("utf-8")
    ).hexdigest()[:24]

    return f"entity_{digest}"


def merge_knowledge(extractions: list[dict]) -> dict:
    """
    Merge multiple chunk-level extraction results.

    Local AI IDs such as e1/e2 are replaced with stable canonical IDs.
    Duplicate entities and relationships are removed.
    """

    canonical_entities = {}
    canonical_relationships = set()

    for extraction in extractions:
        local_to_canonical = {}

        for entity in extraction.get("entities", []):
            entity_type = entity["type"].strip()
            entity_name = entity["name"].strip()

            key = _entity_key(
                entity_type,
                entity_name,
            )

            stable_id = _stable_entity_id(
                entity_type,
                entity_name,
            )

            if key not in canonical_entities:
                canonical_entities[key] = {
                    "id": stable_id,
                    "type": entity_type,
                    "name": entity_name,
                }

            local_to_canonical[entity["id"]] = (
                canonical_entities[key]["id"]
            )

        for relationship in extraction.get(
            "relationships",
            [],
        ):
            source_local_id = relationship["source"]
            target_local_id = relationship["target"]

            source_id = local_to_canonical.get(
                source_local_id
            )

            target_id = local_to_canonical.get(
                target_local_id
            )

            if not source_id or not target_id:
                continue

            relationship_type = RELATIONSHIP_TYPE_ALIASES.get(
                relationship["type"],
                relationship["type"],
            )

            if relationship_type not in ALLOWED_RELATIONSHIP_TYPES:
                continue

            canonical_relationships.add(
                (
                    source_id,
                    relationship_type,
                    target_id,
                )
            )

    relationships = [
        {
            "source": source_id,
            "type": relationship_type,
            "target": target_id,
        }
        for (
            source_id,
            relationship_type,
            target_id,
        ) in sorted(canonical_relationships)
    ]

    return {
        "entities": list(canonical_entities.values()),
        "relationships": relationships,
    }


def extract_knowledge_from_chunks(
    chunks: list[str],
) -> dict:
    """
    Extract knowledge from multiple manageable chunks
    and merge/deduplicate the results.
    """
    extractions = []

    for index, chunk in enumerate(chunks):
        if not chunk.strip():
            continue

        print(
            f"\n========== EXTRACTING CHUNK "
            f"{index + 1}/{len(chunks)} =========="
        )

        extraction = extract_knowledge(chunk)

        extractions.append(extraction)

    return merge_knowledge(extractions)


def extract_chunk_knowledge(
    chunks: list[str],
) -> list[dict]:
    """
    Extract knowledge independently for each chunk.

    The returned list preserves chunk boundaries so the caller
    can associate canonical entity IDs with the correct
    ChromaDB chunks.
    """
    results = []

    for index, chunk in enumerate(chunks):
        if not chunk.strip():
            results.append(
                {
                    "entities": [],
                    "relationships": [],
                }
            )
            continue

        print(
            f"\n========== EXTRACTING CHUNK "
            f"{index + 1}/{len(chunks)} =========="
        )

        results.append(
            extract_knowledge(chunk)
        )

    return results
