from app.services.embedding_client import generate_embedding


text = """
Rahul proposed introducing Redis caching
to reduce repeated database queries.
"""

try:
    embedding = generate_embedding(text)

    print("EMBEDDING SUCCESS")
    print("Vector dimensions:", len(embedding))
    print("First 10 values:", embedding[:10])

except Exception as e:
    print("EMBEDDING ERROR:")
    print(type(e).__name__, e)