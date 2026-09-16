"""
Shared allow-lists for extracted knowledge and Neo4j storage.
"""


ALLOWED_ENTITY_TYPES = {
    "Person",
    "Organization",
    "Institution",
    "Technology",
    "Service",
    "Project",
    "Meeting",
    "Event",
    "Decision",
    "PullRequest",
    "Issue",
    "Certification",
    "Document",
}


ALLOWED_RELATIONSHIP_TYPES = {
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
    "AFFILIATED_WITH",
    "ATTENDED",
    "EARNED",
    "PROVIDES",
}


RELATIONSHIP_TYPE_ALIASES = {
    "EARNED_BY": "EARNED",
    "WORKED ON": "WORKED_ON",
    "OFFERS": "PROVIDES",
    "SUPPORTS": "PROVIDES",
}


# These are the relationships for which the endpoint types are meaningful
# enough to validate. Other relationships remain intentionally flexible.
RELATIONSHIP_TYPE_CONSTRAINTS = {
    "IMPLEMENTED_BY": ({"Decision", "Project", "Service"}, {"PullRequest"}),
    "WORKED_ON": ({"Person"}, {"Project"}),
    "EARNED": ({"Person"}, {"Certification"}),
    "ATTENDED": ({"Person"}, {"Event", "Meeting", "Institution"}),
}


def is_relationship_compatible(relationship_type: str, source_type: str, target_type: str) -> bool:
    constraints = RELATIONSHIP_TYPE_CONSTRAINTS.get(relationship_type)
    return constraints is None or (
        source_type in constraints[0] and target_type in constraints[1]
    )
