from app.services.retrieval import retrieve_documents


query = "Why was Redis introduced?"

print("QUERY:")
print(query)

results = retrieve_documents(query)

print("\nRETRIEVED DOCUMENTS:")

for result in results:
    print("\nID:", result["id"])
    print("Distance:", result["distance"])
    print("Metadata:", result["metadata"])
    print("Text:", result["text"])