import unittest

from app.services.ingestion_jobs import create_job, fail_job, finish_job, get_job, update_job
from app.api.ingestion import _repository_name_from_url
from app.services.github_ingestion import _is_useful_file
from fastapi import HTTPException


class IngestionJobTests(unittest.TestCase):
    def test_job_tracks_checkpoints_and_completion(self):
        job_id = "test-ingestion-job"
        create_job(job_id, "notes.txt")
        update_job(job_id, "extracting_knowledge", "Extracting knowledge with AI")
        finish_job(job_id, {"chunks_created": 2})

        job = get_job(job_id)
        self.assertEqual(job["status"], "completed")
        self.assertEqual(job["checkpoint"], "completed")
        self.assertIn("Extracting knowledge with AI", job["checkpoints"])
        self.assertEqual(job["result"]["chunks_created"], 2)

    def test_job_keeps_the_failure_message(self):
        job_id = "test-failed-ingestion-job"
        create_job(job_id, "notes.txt")
        fail_job(job_id, "Ollama request timed out")

        job = get_job(job_id)
        self.assertEqual(job["status"], "failed")
        self.assertEqual(job["error"], "Ollama request timed out")

    def test_accepts_a_standard_github_repository_url(self):
        self.assertEqual(
            _repository_name_from_url("https://github.com/openai/example.git"),
            "openai/example",
        )

    def test_rejects_a_non_github_repository_url(self):
        with self.assertRaises(HTTPException):
            _repository_name_from_url("https://example.com/openai/example")

    def test_accepts_frontend_source_files_for_repository_ingestion(self):
        self.assertTrue(_is_useful_file("src/index.html"))
        self.assertTrue(_is_useful_file("src/styles.css"))
        self.assertTrue(_is_useful_file("src/package.json"))
