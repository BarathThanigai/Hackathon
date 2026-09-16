import unittest
from unittest.mock import patch

from app.services.rag import answer_query


class RagServiceTests(unittest.TestCase):
    @patch("app.services.rag.search_graph_by_id")
    @patch("app.services.rag.generate_text")
    @patch("app.services.rag.retrieve_documents")
    def test_generates_a_grounded_answer_with_evidence(self, mock_retrieve, mock_generate, mock_graph):
        mock_retrieve.return_value = [{
            "id": "source-1",
            "text": "Redis was introduced to reduce repeated database reads.",
            "metadata": {"filename": "decision.md", "entity_ids": "e1"},
        }]
        mock_graph.return_value = []
        mock_generate.return_value = "Redis reduced repeated database reads."

        result = answer_query("Why was Redis introduced?")

        self.assertTrue(result["evidenceBacked"])
        self.assertEqual(result["answer"], "Redis reduced repeated database reads.")
        self.assertEqual(result["evidence"][0]["title"], "decision.md")
        self.assertEqual(result["timeline"], [])

    @patch("app.services.rag.search_graph_by_id", return_value=[])
    @patch("app.services.rag.generate_text", side_effect=["Here", "Here"])
    @patch("app.services.rag.retrieve_documents")
    def test_replaces_placeholder_answers(self, mock_retrieve, _mock_generate, _mock_graph):
        mock_retrieve.return_value = [{
            "id": "source-1",
            "text": "The project used React and MediaPipe.",
            "metadata": {"filename": "README.md"},
        }]

        result = answer_query("What project was this part of?")

        self.assertEqual(result["answer"], "I could not produce a grounded answer from the indexed evidence.")
        self.assertEqual(result["timeline"], [])

    @patch("app.services.rag.search_graph_by_id")
    @patch("app.services.rag.generate_text", return_value="Redis answer")
    @patch("app.services.rag.retrieve_documents")
    def test_deduplicates_chunks_and_builds_graph_context(self, mock_retrieve, _mock_generate, mock_graph):
        mock_retrieve.return_value = [
            {
                "id": "chunk-1",
                "text": "Redis was introduced for the authentication service.",
                "metadata": {"document_id": "doc-1", "filename": "decision.md", "entity_ids": "redis"},
            },
            {
                "id": "chunk-2",
                "text": "The same decision continues in this chunk.",
                "metadata": {"document_id": "doc-1", "filename": "decision.md", "entity_ids": "redis"},
            },
        ]
        mock_graph.return_value = [
            {
                "entity_labels": ["Technology"],
                "entity": {"id": "redis", "name": "Redis"},
                "relationship": "PROPOSED",
                "connected_labels": ["Project"],
                "connected_entity": {"id": "auth", "name": "Authentication Service"},
            }
        ]

        result = answer_query("Why was Redis introduced?")

        self.assertEqual(len(result["evidence"]), 1)
        self.assertEqual(result["timeline"][0]["label"], "Redis proposed Authentication Service")
        self.assertEqual(result["related"]["technologies"], ["Redis"])

    @patch("app.services.rag.retrieve_documents", return_value=[])
    def test_does_not_call_the_llm_when_no_evidence_exists(self, _mock_retrieve):
        result = answer_query("What changed?")
        self.assertFalse(result["evidenceBacked"])
        self.assertEqual(result["evidence"], [])

    @patch("app.services.rag.search_graph_by_id", return_value=[])
    @patch("app.services.rag.generate_text", return_value="Grounded answer")
    @patch("app.services.rag.retrieve_documents")
    def test_filters_distant_retrieval_results(self, mock_retrieve, _mock_generate, _mock_graph):
        mock_retrieve.return_value = [
            {"id": "best", "text": "Relevant", "distance": 1.0, "metadata": {"filename": "resume.pdf"}},
            {"id": "distant", "text": "Unrelated", "distance": 1.8, "metadata": {"filename": "other.pdf"}},
        ]

        result = answer_query("What projects did Thasshien work on?")

        self.assertEqual([item["id"] for item in result["evidence"]], ["best"])

    @patch("app.services.rag.search_graph_by_id")
    @patch("app.services.rag.generate_text", return_value="Redis answer")
    @patch("app.services.rag.retrieve_documents")
    def test_filters_graph_neighbors_to_evidence_entities(self, mock_retrieve, _mock_generate, mock_graph):
        mock_retrieve.return_value = [{
            "id": "decision",
            "text": "Rahul proposed Redis to reduce authentication database load.",
            "metadata": {"filename": "decision.md", "entity_ids": "redis"},
        }]
        mock_graph.return_value = [
            {
                "entity_labels": ["Technology"],
                "entity": {"id": "redis", "name": "Redis"},
                "relationship": "PROPOSED",
                "connected_labels": ["Person"],
                "connected_entity": {"id": "rahul", "name": "Rahul"},
            },
            {
                "entity_labels": ["Technology"],
                "entity": {"id": "redis", "name": "Redis"},
                "relationship": "USES",
                "connected_labels": ["Technology"],
                "connected_entity": {"id": "postgresql", "name": "PostgreSQL"},
            },
            {
                "entity_labels": ["Person"],
                "entity": {"id": "thasshien", "name": "Thasshien"},
                "relationship": "ATTENDED",
                "connected_labels": ["Institution"],
                "connected_entity": {"id": "vit", "name": "Vellore Institute of Technology"},
            },
            {
                "entity_labels": ["Organization"],
                "entity": {"id": "backend", "name": "Backend Service"},
                "relationship": "USES",
                "connected_labels": ["Technology"],
                "connected_entity": {"id": "mongodb", "name": "MongoDB"},
            },
        ]

        result = answer_query("Why was Redis introduced?")

        self.assertEqual(
            [step["label"] for step in result["timeline"]],
            ["Redis proposed Rahul"],
        )
        self.assertEqual(result["related"]["people"], ["Rahul"])
        self.assertEqual(result["related"]["technologies"], ["Redis", "PostgreSQL"])

    @patch("app.services.rag.search_graph_by_id", return_value=[])
    @patch("app.services.rag.generate_text")
    @patch("app.services.rag.retrieve_documents")
    def test_retries_when_model_returns_reasoning_dump(self, mock_retrieve, mock_generate, _mock_graph):
        mock_retrieve.return_value = [{
            "id": "source-1",
            "text": "Rahul proposed Redis for the authentication service.",
            "metadata": {"filename": "decision.md"},
        }]
        reasoning_dump = "Here's a thinking process:\n" + ("1. **Analyze the evidence** and inspect the context. " * 80)
        mock_generate.side_effect = [reasoning_dump, "Rahul proposed Redis."]

        result = answer_query("Who proposed Redis?")

        self.assertEqual(result["answer"], "Rahul proposed Redis.")
        self.assertEqual(mock_generate.call_count, 2)
