from dotenv import load_dotenv
from app.services.github_service import get_repository

load_dotenv()

repo = get_repository("BarathThanigai/WebScope")

print(repo)