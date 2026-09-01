from app.services.vector_store import store_document, search_documents


document = """
During the March architecture meeting, the engineering team
discussed increasing database load in the authentication service.

Rahul proposed introducing Redis caching to reduce repeated
database queries.

The team agreed to introduce Redis because the authentication
service was experiencing high database load.

The decision was implemented through Pull Request #428.
"""


print("STORING DOCUMENT...")

result = store_document(
    document_id="doc_redis_001",
    text=document,
    metadata={
        "source": "test",
        "type": "architecture_decision"
    }
)

print("\nSTORE RESULT:")
print(result)


print("\nSEARCHING...")

results = search_documents(
    "Who proposed using Redis to reduce database load?",
    n_results=3
)

print("\nSEARCH RESULTS:")

print(results)