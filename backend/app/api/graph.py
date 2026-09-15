import re

from fastapi import APIRouter

from app.database.neo4j import get_session


router = APIRouter(prefix="/api/graph", tags=["Graph"])


def _node_id(entity: dict) -> str:
    value = entity.get("id") or entity.get("name") or "entity"
    return re.sub(r"[^a-z0-9]+", "-", str(value).lower()).strip("-") or "entity"


@router.get("")
def get_graph():
    query = """
    MATCH (n)
    OPTIONAL MATCH (n)-[r]->(connected)
    RETURN properties(n) AS entity,
           labels(n) AS labels,
           type(r) AS relationship,
           properties(connected) AS connected_entity,
           labels(connected) AS connected_labels
    """

    entities = {}
    relationships = []
    with get_session() as session:
        for record in session.run(query):
            entity = record["entity"] or {}
            labels = record["labels"] or []
            entity_id = _node_id(entity)
            entities[entity_id] = {"entity": entity, "labels": labels}

            connected = record["connected_entity"]
            relationship = record["relationship"]
            if connected and relationship:
                connected_id = _node_id(connected)
                entities[connected_id] = {
                    "entity": connected,
                    "labels": record["connected_labels"] or [],
                }
                relationships.append((entity_id, relationship, connected_id))

    nodes = list(entities.items())
    nodes_payload = []
    details = {}
    for index, (entity_id, value) in enumerate(nodes):
        entity = value["entity"]
        labels = value["labels"]
        entity_type = labels[0] if labels else "Entity"
        nodes_payload.append({
            "id": entity_id,
            "label": entity.get("name") or entity.get("title") or entity.get("number") or entity_id,
            "type": entity_type.lower().replace("pullrequest", "pullrequest"),
            "x": 100 + (index % 5) * 145,
            "y": 100 + (index // 5) * 140,
        })
        details[entity_id] = {
            "name": entity.get("name") or entity.get("title") or entity.get("number") or entity_id,
            "type": entity_type,
            "relatedDecisions": 0,
            "relatedProjects": 0,
            "relatedPeople": 0,
        }

    edges = []
    seen_edges = set()
    for index, (source, relationship, target) in enumerate(relationships):
        key = (source, relationship, target)
        if key in seen_edges or source not in entities or target not in entities:
            continue
        seen_edges.add(key)
        edges.append({
            "id": f"edge-{index}",
            "source": source,
            "target": target,
            "label": relationship,
        })

    return {"nodes": nodes_payload, "edges": edges, "details": details}