from app.services.ai_client import generate_text


prompt = """
Explain in one sentence why Redis caching might be introduced
when an authentication service has high database load.
"""

try:
    result = generate_text(prompt)

    print("\nAI RESPONSE:")
    print(result)

except Exception as e:
    print("\nAI ERROR:")
    print(type(e).__name__, e)