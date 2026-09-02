from app.services.github_ingestion import ingest_github_file


result = ingest_github_file(
    "BarathThanigai/WebScope",
    "crawler.py"
)

print("\n==============================")
print("CRAWLER INGESTION COMPLETE")
print("==============================")

print("\nGRAPH:")
print(result["graph"])

print("\nCHUNKS:")
print(result["chunks"])

print("\nKNOWLEDGE:")
print(result["knowledge"])
