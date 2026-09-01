from app.services.rag import answer_query


query = "Why was Redis introduced?"

print("USER QUERY:")
print(query)

result = answer_query(query)

print("\nAI ANSWER:")
print(result["answer"])

print("\n--- CONTEXT USED ---")
print(result["context"])