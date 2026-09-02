import os
from github import Github


GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

github = Github(GITHUB_TOKEN)


def get_repository(repo_name: str):
    repo = github.get_repo(repo_name)

    return {
        "name": repo.full_name,
        "description": repo.description,
        "url": repo.html_url,
    }


def get_repository_files(repo_name: str):
    """
    Return useful source/documentation files
    from a GitHub repository.
    """

    repo = github.get_repo(repo_name)

    contents = repo.get_contents("")

    files = []

    while contents:

        item = contents.pop(0)

        if item.type == "dir":
            contents.extend(repo.get_contents(item.path))

        elif item.type == "file":

            allowed_extensions = (
                ".py",
                ".js",
                ".jsx",
                ".ts",
                ".tsx",
                ".md",
                ".json",
                ".yaml",
                ".yml",
            )

            if item.name.endswith(allowed_extensions):

                files.append({
                    "path": item.path,
                    "name": item.name,
                    "download_url": item.download_url,
                })

    return files

def get_file_content(repo_name: str, file_path: str):
    """
    Fetch the text content of a single file from GitHub.
    """

    repo = github.get_repo(repo_name)

    file = repo.get_contents(file_path)

    if file.encoding == "base64":
        content = file.decoded_content.decode("utf-8", errors="ignore")
    else:
        content = file.decoded_content.decode("utf-8", errors="ignore")

    return {
        "path": file.path,
        "name": file.name,
        "content": content,
    }