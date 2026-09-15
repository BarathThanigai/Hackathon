from app.services.github_service import github
from app.services.knowledge_extractor import extract_knowledge
from app.services.graph import store_knowledge
from app.database.chroma import add_chunks


# Files worth ingesting into organizational memory.
ALLOWED_EXTENSIONS = {
    ".astro",
    ".c",
    ".cpp",
    ".cs",
    ".css",
    ".go",
    ".html",
    ".py",
    ".js",
    ".jsx",
    ".json",
    ".php",
    ".rb",
    ".rs",
    ".scss",
    ".sh",
    ".ts",
    ".tsx",
    ".vue",
    ".sql",
    ".txt",
    ".yml",
    ".yaml",
    ".md",
}

IGNORED_FILES = {
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
}


def _is_useful_file(path: str) -> bool:
    """
    Decide whether a GitHub file should be ingested.
    """

    if path in IGNORED_FILES:
        return False

    # Ignore hidden/generated directories.
    ignored_parts = {
        "node_modules",
        "__pycache__",
        ".git",
        ".cypress",
        "dist",
        "build",
    }

    parts = path.split("/")

    if any(part in ignored_parts for part in parts):
        return False

    if "." not in path:
        return False

    extension = "." + path.rsplit(".", 1)[-1].lower()

    return extension in ALLOWED_EXTENSIONS


def _chunk_text(text: str, max_chars: int = 6000) -> list[str]:
    """
    Split large files into manageable chunks.

    We split primarily on lines so that code structure
    remains reasonably intact.
    """

    if len(text) <= max_chars:
        return [text]

    chunks = []
    current = []

    current_length = 0

    for line in text.splitlines():

        line_length = len(line) + 1

        if current and current_length + line_length > max_chars:
            chunks.append("\n".join(current))
            current = []
            current_length = 0

        current.append(line)
        current_length += line_length

    if current:
        chunks.append("\n".join(current))

    return chunks


def ingest_github_file(
    repo_name: str,
    file_path: str,
    checkpoint=None,
    repo=None,
):
    """
    Ingest one GitHub file.

    The file is:
    1. Retrieved from GitHub
    2. Split into manageable chunks
    3. Sent to the LLM for knowledge extraction
    4. Stored in Neo4j
    5. Stored in ChromaDB
    """

    repo = repo or github.get_repo(repo_name)

    file = repo.get_contents(file_path)

    if isinstance(file, list):
        raise ValueError(
            f"{file_path} is a directory, not a file."
        )

    text = file.decoded_content.decode(
        "utf-8",
        errors="ignore"
    )

    chunks = _chunk_text(text)

    if checkpoint:
        checkpoint("chunking_file", "Chunked repository file", chunks_total=len(chunks))

    print(f"\nFILE: {file_path}")
    print(f"SIZE: {len(text)} characters")
    print(f"CHUNKS: {len(chunks)}")

    all_knowledge = {
        "entities": [],
        "relationships": []
    }

    total_graph_entities = 0
    total_graph_relationships = 0
    total_vector_chunks = 0
    embedding_dimensions = None

    for index, chunk in enumerate(chunks):

        if checkpoint:
            checkpoint(
                "extracting_knowledge",
                "Extracting knowledge with AI",
                chunk_current=index + 1,
                chunks_total=len(chunks),
            )

        print(
            f"\nPROCESSING CHUNK "
            f"{index + 1}/{len(chunks)}..."
        )

        # --------------------------------
        # 1. Extract knowledge
        # --------------------------------

        knowledge = extract_knowledge(chunk)

        all_knowledge["entities"].extend(
            knowledge.get("entities", [])
        )

        all_knowledge["relationships"].extend(
            knowledge.get("relationships", [])
        )

        # --------------------------------
        # 2. Store knowledge in Neo4j
        # --------------------------------

        if checkpoint:
            checkpoint("storing_graph", "Storing knowledge graph")
        graph_result = store_knowledge(knowledge)

        total_graph_entities += graph_result[
            "entities_created"
        ]

        total_graph_relationships += graph_result[
            "relationships_created"
        ]

        # --------------------------------
        # 3. Store chunk in ChromaDB
        # --------------------------------

        chunk_id = (
            f"github:{repo_name}:"
            f"{file_path}:chunk:{index}"
        )

        if checkpoint:
            checkpoint("indexing", "Indexing repository file")
        vector_result = add_chunks(
            chunks=[chunk],
            document_id=chunk_id,
            filename=file_path,
            entity_ids=[entity["id"] for entity in knowledge.get("entities", [])],
            source_type="github",
            extra_metadata={
                "repo": repo_name,
                "file": file_path,
            },
        )
        total_vector_chunks += vector_result["vector_chunks"]
        embedding_dimensions = vector_result["embedding_dimensions"]

    return {
        "repository": repo_name,
        "file": file_path,
        "chunks": len(chunks),
        "knowledge": all_knowledge,
        "graph": {
            "entities_created": total_graph_entities,
            "relationships_created": total_graph_relationships,
        },
        "vector_chunks": total_vector_chunks,
        "embedding_dimensions": embedding_dimensions,
    }


def ingest_github_repository(
    repo_name: str,
    checkpoint=None,
):
    """
    Ingest all useful files from a GitHub repository.
    """

    repo = github.get_repo(repo_name)

    if checkpoint:
        checkpoint("discovering_files", "Finding supported repository files")

    contents = repo.get_contents("")

    files = []

    def collect_files(items):

        for item in items:

            if item.type == "file":

                if _is_useful_file(item.path):
                    files.append(item.path)

            elif item.type == "dir":

                # Avoid unnecessary directories.
                if item.path.split("/")[-1] in {
                    "node_modules",
                    "__pycache__",
                    ".git",
                    "dist",
                    "build",
                    ".cypress",
                }:
                    continue

                try:
                    children = repo.get_contents(
                        item.path
                    )

                    collect_files(children)

                except Exception as exc:
                    print(
                        f"Skipping directory "
                        f"{item.path}: {exc}"
                    )

    collect_files(contents)

    print(
        f"\nFOUND {len(files)} USEFUL FILES"
    )

    if checkpoint:
        checkpoint("processing_files", "Processing repository files", files_total=len(files), files_processed=0)

    results = []

    for index, file_path in enumerate(files):

        if checkpoint:
            checkpoint(
                "processing_file",
                "Processing repository file",
                current_file=file_path,
                files_current=index + 1,
                files_total=len(files),
                files_processed=len(results),
            )

        print(
            f"\n=============================="
            f"\nFILE {index + 1}/{len(files)}"
            f"\n=============================="
        )

        try:

            result = ingest_github_file(
                repo_name,
                file_path,
                checkpoint=checkpoint,
                repo=repo,
            )

            results.append(result)

            if checkpoint:
                checkpoint(
                    "processing_file",
                    "Repository file indexed",
                    current_file=file_path,
                    files_current=index + 1,
                    files_total=len(files),
                    files_processed=len(results),
                )

        except Exception as exc:

            print(
                f"FAILED: {file_path}"
            )

            print(exc)

    return {
        "repository": repo_name,
        "files_found": len(files),
        "files_processed": len(results),
        "results": results,
    }
