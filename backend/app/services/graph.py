from app.database.neo4j import get_session
from app.services.knowledge_schema import (
    ALLOWED_ENTITY_TYPES,
    ALLOWED_RELATIONSHIP_TYPES,
)


ALLOWED_LABELS = ALLOWED_ENTITY_TYPES
ALLOWED_RELATIONSHIPS = ALLOWED_RELATIONSHIP_TYPES


def store_knowledge(knowledge: dict):
    entities = knowledge.get(
        "entities",
        []
    )

    relationships = knowledge.get(
        "relationships",
        []
    )

    with get_session() as session:

        # --------------------------------------------------
        # 1. CREATE / MERGE ENTITIES
        # --------------------------------------------------

        entity_map = {}

        for entity in entities:

            entity_id = entity["id"]
            entity_type = entity["type"]
            entity_name = entity["name"]

            if entity_type not in ALLOWED_LABELS:
                continue

            entity_map[entity_id] = {
                "type": entity_type,
                "name": entity_name,
            }

            query = f"""
            MERGE (n:{entity_type} {{id: $id}})
            ON CREATE SET
                n.name = $name
            ON MATCH SET
                n.name = coalesce(n.name, $name)
            """

            session.run(
                query,
                id=entity_id,
                name=entity_name,
            )

        # --------------------------------------------------
        # 2. CREATE / MERGE RELATIONSHIPS
        # --------------------------------------------------

        for relationship in relationships:

            source_id = relationship["source"]
            relationship_type = relationship["type"]
            target_id = relationship["target"]

            if relationship_type not in ALLOWED_RELATIONSHIPS:
                continue

            if source_id not in entity_map:
                continue

            if target_id not in entity_map:
                continue

            source = entity_map[source_id]
            target = entity_map[target_id]

            query = f"""
            MATCH (a:{source["type"]} {{id: $source_id}})
            MATCH (b:{target["type"]} {{id: $target_id}})
            MERGE (a)-[:{relationship_type}]->(b)
            """

            session.run(
                query,
                source_id=source_id,
                target_id=target_id,
            )

    return {
        "entities_created": len(entities),
        "relationships_created": len(relationships),
    }