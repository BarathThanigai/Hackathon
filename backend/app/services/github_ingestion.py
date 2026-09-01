from app.services.github_service import github
from app.services.knowledge_extractor import extract_knowledge
from app.services.graph import store_knowledge
from app.services.vector_store import store_document


def ingest_github_readme(repo_name: str, document_id: str):

    repo = github.get_repo(repo_name)
    readme = repo.get_readme()

    text = readme.decoded_content.decode("utf-8")[:3000] # Limit to 3000 characters for processing

    print("STEP 1: EXTRACTING KNOWLEDGE...")
    knowledge = extract_knowledge(text)

    print("STEP 2: STORING KNOWLEDGE...")
    graph_result = store_knowledge(knowledge)

    print("STEP 3: STORING DOCUMENT...")
    vector_result = store_document(
        document_id=document_id,
        text=text,
        metadata={
            "source": "github",
            "repo": repo_name,
            "type": "README"
        }
    )

    return {
        "repository": repo_name,
        "knowledge": knowledge,
        "graph": graph_result,
        "vector": vector_result
    }