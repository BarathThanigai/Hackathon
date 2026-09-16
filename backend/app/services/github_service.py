import os
from github import Github


GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

github = Github(GITHUB_TOKEN)


def get_latest_commit_details(repo, file_path: str) -> dict:
    """Return the latest commit author and timestamp for a repository file."""
    commits = repo.get_commits(path=file_path)
    latest_commit = next(iter(commits), None)
    if latest_commit is None:
        return {"commit_author": None, "commit_time": None}

    commit_author = (
        latest_commit.commit.author.name
        if latest_commit.commit.author and latest_commit.commit.author.name
        else latest_commit.author.login
        if latest_commit.author
        else None
    )
    commit_time = (
        latest_commit.commit.author.date
        if latest_commit.commit.author
        else latest_commit.commit.committer.date
        if latest_commit.commit.committer
        else None
    )
    return {
        "commit_author": commit_author,
        "commit_time": commit_time.isoformat() if commit_time else None,
    }


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
                commit_details = get_latest_commit_details(repo, item.path)
                files.append({
                    "path": item.path,
                    "name": item.name,
                    "download_url": item.download_url,
                    **commit_details,
                })

    return files

def get_file_content(repo_name: str, file_path: str):
    """
    Fetch the text content of a single file from GitHub.
    """

    repo = github.get_repo(repo_name)

    file = repo.get_contents(file_path)
    commit_details = get_latest_commit_details(repo, file_path)

    if file.encoding == "base64":
        content = file.decoded_content.decode("utf-8", errors="ignore")
    else:
        content = file.decoded_content.decode("utf-8", errors="ignore")

    return {
        "path": file.path,
        "name": file.name,
        "content": content,
        **commit_details,
    }