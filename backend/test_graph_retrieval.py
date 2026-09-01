from app.services.graph_retrieval import search_graph


entity = "Redis"

print("GRAPH SEARCH:")
print(entity)

results = search_graph(entity)

print("\nGRAPH RESULTS:")

for result in results:
    print(result)