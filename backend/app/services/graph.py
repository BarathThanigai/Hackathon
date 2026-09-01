from app.database.neo4j import get_session


def create_person(name: str):
    with get_session() as session:
        session.run(
            """
            MERGE (p:Person {name: $name})
            """,
            name=name
        )


def create_technology(name: str):
    with get_session() as session:
        session.run(
            """
            MERGE (t:Technology {name: $name})
            """,
            name=name
        )


def create_decision(title: str, reason: str = None):
    with get_session() as session:
        session.run(
            """
            MERGE (d:Decision {title: $title})
            SET d.reason = $reason
            """,
            title=title,
            reason=reason
        )


def create_meeting(name: str):
    with get_session() as session:
        session.run(
            """
            MERGE (m:Meeting {name: $name})
            """,
            name=name
        )


def create_pull_request(number: str):
    with get_session() as session:
        session.run(
            """
            MERGE (pr:PullRequest {number: $number})
            """,
            number=number
        )


def create_relationship(
    source_label: str,
    source_property: str,
    source_value: str,
    relationship: str,
    target_label: str,
    target_property: str,
    target_value: str
):
    query = f"""
    MATCH (a:{source_label} {{{source_property}: $source_value}})
    MATCH (b:{target_label} {{{target_property}: $target_value}})
    MERGE (a)-[:{relationship}]->(b)
    """

    with get_session() as session:
        session.run(
            query,
            source_value=source_value,
            target_value=target_value
        )