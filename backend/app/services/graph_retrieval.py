from app.database.neo4j import get_session


def search_graph(entity_name: str):
    """
    Find an entity and its directly connected
    entities/relationships in Neo4j.
    """

    query = """
    MATCH (n)
    WHERE
        toLower(coalesce(n.name, '')) = toLower($entity_name)
        OR toLower(coalesce(n.title, '')) = toLower($entity_name)
        OR toLower(coalesce(n.number, '')) = toLower($entity_name)

    OPTIONAL MATCH (n)-[r]-(connected)

    RETURN
        labels(n) AS entity_labels,
        properties(n) AS entity,
        type(r) AS relationship,
        labels(connected) AS connected_labels,
        properties(connected) AS connected_entity
    """

    with get_session() as session:
        result = session.run(
            query,
            entity_name=entity_name
        )

        records = []

        for record in result:
            records.append({
                "entity_labels": record["entity_labels"],
                "entity": record["entity"],
                "relationship": record["relationship"],
                "connected_labels": record["connected_labels"],
                "connected_entity": record["connected_entity"]
            })

        return records

def search_graph_by_id(entity_id: str):
    """
    Find a Neo4j entity using its knowledge-extraction ID
    and return its directly connected entities/relationships.
    """

    query = """
    MATCH (n {id: $entity_id})
    OPTIONAL MATCH (n)-[r]-(connected)

    RETURN
        labels(n) AS entity_labels,
        properties(n) AS entity,
        type(r) AS relationship,
        labels(connected) AS connected_labels,
        properties(connected) AS connected_entity
    """

    with get_session() as session:
        result = session.run(
            query,
            entity_id=entity_id
        )

        records = []

        for record in result:
            records.append({
                "entity_labels": record["entity_labels"],
                "entity": record["entity"],
                "relationship": record["relationship"],
                "connected_labels": record["connected_labels"],
                "connected_entity": record["connected_entity"]
            })

        return records