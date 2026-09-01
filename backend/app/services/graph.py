from app.database.neo4j import get_session


ALLOWED_LABELS = {
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


ALLOWED_RELATIONSHIPS = {
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


def store_knowledge(knowledge: dict):
    entities = knowledge.get("entities", [])
    relationships = knowledge.get("relationships", [])

    with get_session() as session:

        # -------------------------
        # 1. CREATE ENTITIES
        # -------------------------

        entity_map = {}

        for entity in entities:
            entity_id = entity["id"]
            entity_type = entity["type"]
            entity_name = entity["name"]

            if entity_type not in ALLOWED_LABELS:
                continue

            # Store mapping from AI ID -> Neo4j node information
            entity_map[entity_id] = {
                "type": entity_type,
                "name": entity_name,
            }

            query = f"""
            MERGE (n:{entity_type} {{name: $name}})
            SET n.id = $id
            """

            session.run(
                query,
                name=entity_name,
                id=entity_id,
            )

        # -------------------------
        # 2. CREATE RELATIONSHIPS
        # -------------------------

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
            MATCH (a:{source["type"]} {{name: $source_name}})
            MATCH (b:{target["type"]} {{name: $target_name}})
            MERGE (a)-[:{relationship_type}]->(b)
            """

            session.run(
                query,
                source_name=source["name"],
                target_name=target["name"],
            )

    return {
        "entities_created": len(entities),
        "relationships_created": len(relationships),
    }