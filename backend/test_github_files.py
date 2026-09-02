from app.services.github_service import get_repository_files


files = get_repository_files("BarathThanigai/WebScope")


print("FILES FOUND:", len(files))

for file in files:
    print(file["path"])