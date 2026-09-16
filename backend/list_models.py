from google import genai
from app import config


client = genai.Client(
    api_key=config.GEMINI_API_KEY
)

print("\n========== AVAILABLE GEMINI MODELS ==========\n")

for model in client.models.list():
    if model.supported_actions and "generateContent" in model.supported_actions:
        print(model.name)

print("\n=============================================\n")