from app.services.document_ingestion import ingest_document


document = """
During the March architecture meeting, the engineering team
discussed increasing database load in the authentication service.

Rahul proposed introducing Redis caching to reduce repeated
database queries.

The team agreed to introduce Redis because the authentication
service was experiencing high database load.

The decision was implemented through Pull Request #428.
"""


print("STARTING DOCUMENT INGESTION...\n")


result = ingest_document(
    document_id="doc_redis_002",
    text=document,
    metadata={
        "source": "test",
        "type": "architecture_decision"
    }
)


print("\n==============================")
print("INGESTION COMPLETE")
print("==============================")

print("\nENTITY IDS:")
print(result["entity_ids"])

print("\nFINAL RESULT:")
print(result)