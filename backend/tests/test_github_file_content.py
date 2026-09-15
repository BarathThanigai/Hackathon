from app.services.github_service import get_file_content


file = get_file_content(
    "BarathThanigai/WebScope",
    "crawler.py"
)

print("FILE:", file["path"])
print("\nCONTENT:\n")
print(file["content"])