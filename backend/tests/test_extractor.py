from app.services.knowledge_extractor import extract_knowledge


document = """
# Redis Architecture Decision

During the March architecture meeting, the engineering team
discussed increasing database load in the authentication service.

Rahul proposed introducing Redis caching to reduce repeated
database queries.

The team agreed to introduce Redis because the authentication
service was experiencing high database load.

The decision was implemented through Pull Request #428.
"""


try:
    result = extract_knowledge(document)

    print("\nEXTRACTED KNOWLEDGE:")
    print(result)

except Exception as e:
    print("\nEXTRACTION ERROR:")
    print(type(e).__name__, e)