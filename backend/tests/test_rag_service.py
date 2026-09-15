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
                "relationship": "USED_BY",
                "connected_labels": ["Service"],
                "connected_entity": {"id": "auth", "name": "Authentication Service"},
            }
        ]

        result = answer_query("Why was Redis introduced?")

        self.assertEqual(len(result["evidence"]), 1)
        self.assertEqual(result["timeline"][0]["label"], "Redis used by Authentication Service")
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
