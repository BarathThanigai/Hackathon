from app.services.graph import store_knowledge


knowledge = {
    "entities": [
        {
            "id": "p1",
            "type": "Person",
            "name": "Rahul"
        },
        {
            "id": "t1",
            "type": "Technology",
            "name": "Redis"
        },
        {
            "id": "s1",
            "type": "Service",
            "name": "authentication service"
        },
        {
            "id": "pr1",
            "type": "PullRequest",
            "name": "Pull Request #428"
        },
        {
            "id": "m1",
            "type": "Meeting",
            "name": "March architecture meeting"
        },
        {
            "id": "d1",
            "type": "Decision",
            "name": "Architecture Decision"
        }
    ],
    "relationships": [
        {
            "source": "p1",
            "type": "PROPOSED",
            "target": "t1"
        },
        {
            "source": "s1",
            "type": "DISCUSSED_IN",
            "target": "m1"
        },
        {
            "source": "d1",
            "type": "IMPLEMENTED_BY",
            "target": "pr1"
        }
    ]
}


print("STORING KNOWLEDGE...")

result = store_knowledge(knowledge)

print("\nGRAPH RESULT:")
print(result)