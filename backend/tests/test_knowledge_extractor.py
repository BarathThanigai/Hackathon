import json
import unittest
from unittest.mock import patch

from app.services.ai_client import ExtractionLimitError, generate_json
from app import config
from app.services.graph import ALLOWED_LABELS
from app.services.knowledge_extractor import extract_json_object, extract_knowledge
from app.services.knowledge_schema import ALLOWED_ENTITY_TYPES


class KnowledgeExtractorTests(unittest.TestCase):
    def setUp(self):
        # Individual request-shape tests exercise the NVIDIA path even when
        # the developer's environment intentionally falls back to Ollama.
        previous_provider = config.get_ai_provider()
        previous_key = config.MEMORYMAP_AI_API_KEY
        config.MEMORYMAP_AI_API_KEY = "test-key"
        config.set_ai_provider("nvidia")
        self.addCleanup(setattr, config, "MEMORYMAP_AI_API_KEY", previous_key)
        self.addCleanup(config.set_ai_provider, previous_provider)

    def test_rejects_reasoning_or_text_outside_json(self):
        with self.assertRaisesRegex(ValueError, "only valid JSON"):
            extract_json_object('Here is my thinking: {"entities": [], "relationships": []}')

        with self.assertRaisesRegex(ValueError, "only valid JSON"):
            extract_json_object('{"entities": [], "relationships": []}\nDone.')

    def test_accepts_fenced_json_with_trailing_commas(self):
        response = '''```json
{
  "entities": [
    {"id": "person-1", "type": "Person", "name": "Ada Lovelace",},
  ],
  "relationships": [],
}
```'''

        knowledge = extract_json_object(response)

        self.assertEqual(knowledge["entities"][0]["name"], "Ada Lovelace")
        self.assertEqual(knowledge["relationships"], [])

    def test_rejects_unterminated_json_without_repairing_it(self):
        response = '{"entities":[{"id":"person-1","type":"Person","name":"Ada'

        with self.assertRaisesRegex(ValueError, "only valid JSON"):
            extract_json_object(response)

    @patch("app.services.knowledge_extractor.generate_json")
    def test_normalizes_earned_by_to_the_canonical_relationship(self, mock_generate_json):
        mock_generate_json.return_value = json.dumps({
            "entities": [
                {"id": "person-1", "type": "Person", "name": "Ada Lovelace"},
                {"id": "cert-1", "type": "Certification", "name": "Cloud Architect"},
            ],
            "relationships": [
                {"source": "person-1", "type": "EARNED_BY", "target": "cert-1"},
            ],
        })

        knowledge = extract_knowledge("Ada earned a cloud certification.")

        self.assertEqual(knowledge["relationships"][0]["type"], "EARNED")

    @patch("app.services.knowledge_extractor.generate_json")
    def test_accepts_resume_entity_types(self, mock_generate_json):
        mock_generate_json.return_value = json.dumps({
            "entities": [
                {"id": "person-1", "type": "Person", "name": "Ada Lovelace"},
                {"id": "org-1", "type": "Organization", "name": "Analytical Society"},
                {"id": "cert-1", "type": "Certification", "name": "Cloud Architect"},
                {"id": "event-1", "type": "Event", "name": "Engineering Summit"},
            ],
            "relationships": [
                {"source": "person-1", "type": "AFFILIATED_WITH", "target": "org-1"},
                {"source": "person-1", "type": "EARNED", "target": "cert-1"},
                {"source": "person-1", "type": "ATTENDED", "target": "event-1"},
            ],
        })

        knowledge = extract_knowledge("Ada attended an engineering summit.")

        self.assertEqual(knowledge["entities"][1]["type"], "Organization")
        self.assertEqual(len(knowledge["relationships"]), 3)

    @patch("app.services.ai_client.requests.Session")
    def test_generate_json_requests_json_mode_and_no_thinking(self, mock_session):
        mock_post = mock_session.return_value.post
        mock_post.return_value.ok = True
        mock_post.return_value.json.return_value = {
            "choices": [{"message": {"content": '{"entities":[],"relationships":[]}'}}]
        }

        generate_json("extract this")

        payload = mock_post.call_args.kwargs["json"]
        self.assertEqual(payload["response_format"], {"type": "json_object"})
        self.assertEqual(payload["chat_template_kwargs"], {"enable_thinking": False})
        self.assertEqual(payload["max_tokens"], 8192)
        self.assertFalse(mock_session.return_value.trust_env)

    @patch("app.services.ai_client.requests.Session")
    def test_generate_json_reports_an_extraction_limit(self, mock_session):
        mock_post = mock_session.return_value.post
        mock_post.return_value.ok = True
        mock_post.return_value.json.return_value = {
            "choices": [{
                "finish_reason": "length",
                "message": {"content": '{"entities":['},
            }]
        }

        with self.assertRaisesRegex(ExtractionLimitError, "output limit reached"):
            generate_json("extract this")

    @patch("app.services.ai_client.requests.post")
    def test_generate_json_uses_ollama_when_selected(self, mock_post):
        previous_provider = config.get_ai_provider()
        self.addCleanup(config.set_ai_provider, previous_provider)
        config.set_ai_provider("ollama")
        mock_post.return_value.ok = True
        mock_post.return_value.json.return_value = {
            "message": {"content": '{"entities":[],"relationships":[]}'},
            "done_reason": "stop",
        }

        generate_json("extract this")

        request_url = mock_post.call_args.args[0]
        payload = mock_post.call_args.kwargs["json"]
        self.assertTrue(request_url.endswith("/api/chat"))
        self.assertEqual(payload["format"], "json")
        self.assertFalse(payload["stream"])

    def test_missing_nvidia_key_falls_back_to_ollama(self):
        previous_provider = config.get_ai_provider()
        previous_key = config.MEMORYMAP_AI_API_KEY
        self.addCleanup(config.set_ai_provider, previous_provider)
        self.addCleanup(setattr, config, "MEMORYMAP_AI_API_KEY", previous_key)
        config.set_ai_provider("nvidia")
        config.MEMORYMAP_AI_API_KEY = None

        self.assertEqual(config.get_ai_provider(), "ollama")

    def test_graph_storage_uses_the_same_entity_allow_list(self):
        self.assertIs(ALLOWED_LABELS, ALLOWED_ENTITY_TYPES)
        self.assertTrue({"Organization", "Institution", "Event", "Certification"} <= ALLOWED_LABELS)


if __name__ == "__main__":
    unittest.main()
