"""Grounded retrieval-augmented generation for MemoryMap queries."""

import re
from datetime import datetime

from app.services.ai_client import generate_text
from app.services.graph_retrieval import search_graph_by_id
from app.services.retrieval import retrieve_documents


MAX_DOCUMENTS = 5
MAX_CONTEXT_CHARS = 14_000
MAX_GRAPH_RECORDS = 20
MAX_EVIDENCE_CHARS = 800
STOP_WORDS = {"what", "when", "where", "which", "this", "that", "from", "with", "does", "have", "about"}
SUBSTANTIVE_ENTITY_TYPES = {
    "person",
    "organization",
    "institution",
    "technology",
    "decision",
    "pullrequest",
    "project",
    "meeting",
}
NEAR_DUPLICATE_THRESHOLD = 0.75
RECENCY_METADATA_KEYS = ("ingested_at", "modified_at", "updated_at", "created_at")
_VERSION_SUFFIX_PATTERN = re.compile(
    r"\s*[\(\[](?:old|copy|draft|final|backup|v\d+|\d+)[\)\]]\s*$",
    re.IGNORECASE,
)
TIMELINE_RELATIONSHIPS = {
    "PROPOSED",
    "DISCUSSED_IN",
    "IMPLEMENTED_BY",
    "CAUSED_BY",
    "ATTENDED",
}


def extract_entity_ids(documents: list[dict]) -> list[str]:
    entity_ids = []
    for document in documents:
        values = document.get("metadata", {}).get("entity_ids", "")
        for entity_id in values.split(","):
            entity_id = entity_id.strip()
            if entity_id and entity_id not in entity_ids:
                entity_ids.append(entity_id)
    return entity_ids


def _retrieve_graph_context(entity_ids: list[str]) -> list[dict]:
    records = []
    # Graph context is optional: an unavailable graph must not block answers
    # grounded in the local vector index.
    for entity_id in entity_ids:
        try:
            records.extend(search_graph_by_id(entity_id))
        except Exception:
            # Do not retry every entity when the graph service itself is down.
            break
        if len(records) >= MAX_GRAPH_RECORDS:
            break
    return [
        record
        for record in records
        if not _is_generic_entity(record.get("entity") or {}, record.get("entity_labels"))
        and not _is_generic_entity(record.get("connected_entity") or {}, record.get("connected_labels"))
    ][:MAX_GRAPH_RECORDS]


def _relevant_documents(documents: list[dict]) -> list[dict]:
    """Keep documents that are meaningfully close to the best semantic hit."""
    scored = [document for document in documents if isinstance(document.get("distance"), (int, float))]
    if not scored:
        return documents

    best_distance = min(document["distance"] for document in scored)
    # Chroma's default L2 distance is corpus-dependent. A relative margin
    # preserves strong neighbours while rejecting distant, unrelated sources.
    max_distance = best_distance + max(0.25, best_distance * 0.35)
    relevant = [document for document in documents if document.get("distance") is None or document["distance"] <= max_distance]
    return relevant or [min(scored, key=lambda document: document["distance"])]


def _normalize_source_key(value: str) -> str:
    normalized = value.strip().lower().rsplit("/", 1)[-1]
    stem, separator, extension = normalized.rpartition(".")
    if not separator:
        return _VERSION_SUFFIX_PATTERN.sub("", normalized).strip()
    stem = _VERSION_SUFFIX_PATTERN.sub("", stem).strip()
    return f"{stem}.{extension}"


def _source_key(metadata: dict, document: dict) -> str:
    repo = metadata.get("repo")
    file_path = metadata.get("file")
    stable_id = metadata.get("document_id") or metadata.get("source_id")
    if repo and file_path:
        return f"{str(repo).strip().lower()}:{_normalize_source_key(str(file_path))}"
    raw = stable_id or metadata.get("filename") or document.get("id", "")
    return _normalize_source_key(str(raw))


def _deduplicate_by_source(documents: list[dict]) -> list[dict]:
    """Keep the most relevant retrieved chunk for each source file."""
    deduplicated = []
    seen = set()
    for document in documents:
        key = _source_key(document.get("metadata", {}), document)
        if key and key in seen:
            continue
        if key:
            seen.add(key)
        deduplicated.append(document)
    return deduplicated


def _content_tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def _content_similarity(first: str, second: str) -> float:
    first_tokens = _content_tokens(first)
    second_tokens = _content_tokens(second)
    if not first_tokens or not second_tokens:
        return 0.0
    return len(first_tokens & second_tokens) / min(len(first_tokens), len(second_tokens))


def _recency(metadata: dict) -> float:
    for key in RECENCY_METADATA_KEYS:
        value = metadata.get(key)
        if value:
            try:
                return datetime.fromisoformat(str(value)).timestamp()
            except ValueError:
                continue
    return float("-inf")


def _drop_near_duplicates(documents: list[dict]) -> list[dict]:
    kept = []
    for document in documents:
        duplicate = next(
            (
                existing
                for existing in kept
                if _content_similarity(document.get("text", ""), existing.get("text", "")) >= NEAR_DUPLICATE_THRESHOLD
            ),
            None,
        )
        if duplicate is None:
            kept.append(document)
        elif _recency(document.get("metadata", {})) > _recency(duplicate.get("metadata", {})):
            kept[kept.index(duplicate)] = document
    return kept


def _lexically_relevant(documents: list[dict], query: str) -> list[dict]:
    terms = _query_terms(query)
    if not terms:
        return documents
    matching = [
        document
        for document in documents
        if any(term in document.get("text", "").lower() for term in terms)
    ]
    return matching or documents


def build_context(query: str, n_results: int = MAX_DOCUMENTS) -> tuple[str, list[dict], list[dict]]:
    limit = max(1, min(n_results, MAX_DOCUMENTS))
    documents = retrieve_documents(query, n_results=limit * 2)
    documents = _relevant_documents(documents)
    documents = _lexically_relevant(documents, query)
    documents = _deduplicate_by_source(documents)
    documents = _drop_near_duplicates(documents)[:limit]
    graph_records = _retrieve_graph_context(extract_entity_ids(documents))

    parts = []
    used_chars = 0
    for index, document in enumerate(documents, start=1):
        metadata = document.get("metadata", {})
        source = metadata.get("filename") or metadata.get("file") or "Indexed source"
        remaining = MAX_CONTEXT_CHARS - used_chars
        if remaining <= 0:
            break
        text, line_start, line_end = _relevant_excerpt(document.get("text", ""), query, remaining)
        parts.append(f"[Document {index}: {source}, lines {line_start}-{line_end}]\n{text}")
        used_chars += len(text)

    for record in graph_records:
        entity = record.get("entity", {})
        connected = record.get("connected_entity", {})
        relation = record.get("relationship") or "RELATED_TO"
        parts.append(
            "[Graph relationship]\n"
            f"{entity.get('name', entity.get('id', 'Unknown'))} {relation} "
            f"{connected.get('name', connected.get('id', 'Unknown'))}"
        )

    return "\n\n".join(parts), documents, graph_records


def _query_terms(query: str) -> list[str]:
    return [term for term in re.findall(r"[a-z0-9][a-z0-9+#.-]+", query.lower()) if len(term) > 2 and term not in STOP_WORDS]


def _relevant_excerpt(text: str, query: str, max_chars: int = MAX_EVIDENCE_CHARS) -> tuple[str, int, int]:
    lines = text.strip().splitlines() or [""]
    terms = _query_terms(query)
    scores = [sum(line.lower().count(term) for term in terms) for line in lines]
    best_index = max(range(len(lines)), key=lambda index: scores[index]) if lines else 0
    if not terms or scores[best_index] == 0:
        best_index = 0
    start = max(0, best_index - 1)
    end = min(len(lines), best_index + 2)
    excerpt = "\n".join(lines[start:end]).strip()
    while len(excerpt) > max_chars and end - start > 1:
        if start < best_index:
            start += 1
        else:
            end -= 1
        excerpt = "\n".join(lines[start:end]).strip()
    return excerpt[:max_chars], start + 1, end


def _evidence(documents: list[dict], query: str) -> list[dict]:
    evidence = []
    seen_sources = set()
    for document in documents:
        metadata = document.get("metadata", {})
        source_id = _source_key(metadata, document)
        if source_id in seen_sources:
            continue
        seen_sources.add(source_id)
        source_type = metadata.get("source_type", "document")
        title = metadata.get("file") or metadata.get("filename") or "Indexed source"
        excerpt, line_start, line_end = _relevant_excerpt(document.get("text", ""), query)
        evidence.append({
            "id": document["id"],
            "type": source_type,
            "title": title,
            "subtitle": (
                f"GitHub: {metadata.get('repo')}"
                if source_type == "github" and metadata.get("repo")
                else "Repository file" if source_type == "github" else "Indexed document"
            ),
            "excerpt": excerpt,
            "citation": f"Lines {line_start}-{line_end}",
        })
    return evidence


def _entity_name(entity: dict) -> str:
    return entity.get("name") or entity.get("title") or entity.get("number") or entity.get("id") or "Unknown"


def _entity_types(entity: dict, labels=None) -> list[str]:
    values = labels or entity.get("labels") or entity.get("type") or entity.get("entity_type") or []
    if isinstance(values, str):
        values = [values]
    return [str(value).strip().casefold() for value in values if value]


def _is_generic_entity(entity: dict, labels=None) -> bool:
    return not entity or not any(entity_type in SUBSTANTIVE_ENTITY_TYPES for entity_type in _entity_types(entity, labels))


def _timeline(graph_records: list[dict]) -> list[dict]:
    """Build factual context steps from stored graph relationships."""
    steps = []
    seen = set()
    for record in graph_records:
        entity = record.get("entity") or {}
        connected = record.get("connected_entity") or {}
        relationship = record.get("relationship")
        if (
            not entity
            or not connected
            or relationship not in TIMELINE_RELATIONSHIPS
        ):
            continue
        names = (_entity_name(entity), _entity_name(connected))
        key = (frozenset(names), relationship)
        if key in seen:
            continue
        seen.add(key)
        steps.append({
            "label": f"{names[0]} {relationship.replace('_', ' ').lower()} {names[1]}",
        })
    return steps


def _related(graph_records: list[dict]) -> dict[str, list[str]]:
    related = {"people": [], "technologies": [], "decisions": [], "pullRequests": []}
    type_map = {
        "Person": "people",
        "Technology": "technologies",
        "Decision": "decisions",
        "PullRequest": "pullRequests",
    }
    for record in graph_records:
        for key, labels_key in (("entity", "entity_labels"), ("connected_entity", "connected_labels")):
            entity = record.get(key) or {}
            labels = record.get(labels_key) or entity.get("labels") or entity.get("type") or entity.get("entity_type")
            if isinstance(labels, str):
                labels = [labels]
            target = next((type_map.get(label) for label in labels or [] if label in type_map), None)
            name = _entity_name(entity)
            if target and name != "Unknown" and name not in related[target]:
                related[target].append(name)
    return related


def answer_query(query: str, n_results: int = MAX_DOCUMENTS) -> dict:
    context, documents, graph_records = build_context(query, n_results=n_results)
    evidence = _evidence(documents, query)
    if not documents:
        return {
            "question": query,
            "answer": "I could not find relevant indexed knowledge for this question.",
            "evidenceBacked": False,
            "evidence": [],
            "timeline": [],
            "related": {"people": [], "technologies": [], "decisions": [], "pullRequests": []},
        }

    prompt = f"""You are an evidence-grounded organizational assistant. Answer the user's question directly using only the supplied evidence.

Return only the final answer for the user: no preamble, reasoning, markdown fences, labels such as "ANSWER:", similarity scores, distances, document numbers, or phrases such as "from Document 1". Use 2-5 concise sentences, or a short bullet list when the question asks for multiple items. Do not repeat the evidence verbatim or invent facts. If the evidence does not support an answer, say so clearly. Mention a source filename only when it helps explain the answer.

EVIDENCE:
{context}

QUESTION: {query}
ANSWER:"""
    answer = _clean_answer(generate_text(prompt))
    # A similarity score or placeholder is never a valid user answer.
    if _is_invalid_answer(answer):
        answer = _clean_answer(generate_text(
            "Return a plain-language answer to the question using the evidence below. "
            "Return only the final answer, with no reasoning, labels, scores, or document indexes.\n\n"
            f"EVIDENCE:\n{context}\n\nQUESTION: {query}\nANSWER:"
        ))
    if _is_invalid_answer(answer):
        answer = "I could not produce a grounded answer from the indexed evidence."
    return {
        "question": query,
        "answer": answer,
        "evidenceBacked": True,
        "evidence": evidence,
        "timeline": _timeline(graph_records),
        "related": _related(graph_records),
        "graph_records_used": len(graph_records),
    }


def _is_similarity_score(answer: str) -> bool:
    normalized = answer.strip().lower()
    if not normalized:
        return True
    compact = normalized.replace("(from document 1)", "").strip()
    try:
        float(compact)
        return True
    except ValueError:
        return False


def _is_invalid_answer(answer: str) -> bool:
    normalized = " ".join(answer.strip().lower().split())
    return (
        _is_similarity_score(answer)
        or normalized in {"here", "answer", "response", "n/a", "none"}
        or len(normalized.split()) < 3
    )


def _clean_answer(answer: str) -> str:
    """Remove common provider wrappers before returning text to the UI."""
    cleaned = (answer or "").strip()
    if cleaned.startswith("```") and cleaned.endswith("```"):
        lines = cleaned.splitlines()
        cleaned = "\n".join(lines[1:-1]).strip()
    if cleaned.lower().startswith("answer:"):
        cleaned = cleaned[7:].strip()
    return cleaned
