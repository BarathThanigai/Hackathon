import os
from dotenv import load_dotenv

load_dotenv()

print("NEO4J_URI:", os.getenv("NEO4J_URI"))
print("NEO4J_USERNAME:", os.getenv("NEO4J_USERNAME"))
print(
    "NEO4J_PASSWORD:",
    "SET" if os.getenv("NEO4J_PASSWORD") else "NOT SET"
)

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")