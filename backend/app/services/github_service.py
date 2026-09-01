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