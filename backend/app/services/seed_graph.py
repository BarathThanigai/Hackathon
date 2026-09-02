from app.services.graph import store_knowledge


def seed_redis_example():
    """Seed the sample graph through the same graph writer as ingestion."""
    return store_knowledge({
        "entities": [
            {"id": "seed-rahul", "type": "Person", "name": "Rahul"},
            {"id": "seed-redis", "type": "Technology", "name": "Redis"},
            {
                "id": "seed-redis-decision",
                "type": "Decision",
                "name": "Introduce Redis caching",
            },
            {
                "id": "seed-march-meeting",
                "type": "Meeting",
                "name": "March Architecture Meeting",
            },
            {"id": "seed-pr-428", "type": "PullRequest", "name": "PR #428"},
        ],
        "relationships": [
            {"source": "seed-rahul", "type": "PROPOSED", "target": "seed-redis-decision"},
            {"source": "seed-redis-decision", "type": "USES", "target": "seed-redis"},
            {"source": "seed-redis-decision", "type": "DISCUSSED_IN", "target": "seed-march-meeting"},
            {"source": "seed-redis-decision", "type": "IMPLEMENTED_BY", "target": "seed-pr-428"},
        ],
    })
