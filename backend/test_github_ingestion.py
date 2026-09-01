from dotenv import load_dotenv
from app.services.github_ingestion import ingest_github_readme

load_dotenv()

result = ingest_github_readme(
    "BarathThanigai/WebScope",
    "github_webscope_readme"
)

print("\n==============================")
print("GITHUB INGESTION COMPLETE")
print("==============================")

print("\nGRAPH:")
print(result["graph"])

print("\nVECTOR:")
print(result["vector"])

print("\nKNOWLEDGE:")
print(result["knowledge"])