"""Shared allow-lists for extracted knowledge and Neo4j storage."""

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

# Explicit model aliases are normalized before strict relationship validation.
RELATIONSHIP_TYPE_ALIASES = {
    "EARNED_BY": "EARNED",
    "WORKED ON": "WORKED_ON",
    "OFFERS": "PROVIDES",
    "SUPPORTS": "PROVIDES",
}
