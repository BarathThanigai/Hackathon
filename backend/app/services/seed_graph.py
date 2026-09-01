from app.services.graph import (
    create_person,
    create_technology,
    create_decision,
    create_meeting,
    create_pull_request,
    create_relationship,
)


def seed_redis_example():

    # Nodes

    create_person("Rahul")

    create_technology("Redis")

    create_decision(
        "Introduce Redis caching",
        "Reduce repeated database queries and high database load"
    )

    create_meeting("March Architecture Meeting")

    create_pull_request("428")

    # Relationships

    create_relationship(
        "Person",
        "name",
        "Rahul",
        "PROPOSED",
        "Decision",
        "title",
        "Introduce Redis caching"
    )

    create_relationship(
        "Decision",
        "title",
        "Introduce Redis caching",
        "USES",
        "Technology",
        "name",
        "Redis"
    )

    create_relationship(
        "Decision",
        "title",
        "Introduce Redis caching",
        "DISCUSSED_IN",
        "Meeting",
        "name",
        "March Architecture Meeting"
    )

    create_relationship(
        "Decision",
        "title",
        "Introduce Redis caching",
        "IMPLEMENTED_BY",
        "PullRequest",
        "number",
        "428"
    )