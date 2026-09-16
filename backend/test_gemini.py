from app.services.ai_client import generate_json


prompt = """
Extract the knowledge graph from this text.

TEXT:
Barath attended VIT Chennai and worked on ChronicleAI.
"""


result = generate_json(prompt)

print("\n========== GEMINI RESPONSE ==========\n")
print(result)