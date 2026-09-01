import os
import certifi
from neo4j import GraphDatabase

from app.config import (
    NEO4J_URI,
    NEO4J_USERNAME,
    NEO4J_PASSWORD,
)

# Force Python/OpenSSL to use certifi's CA bundle
os.environ["SSL_CERT_FILE"] = certifi.where()
os.environ["REQUESTS_CA_BUNDLE"] = certifi.where()

driver = GraphDatabase.driver(
    NEO4J_URI,
    auth=(NEO4J_USERNAME, NEO4J_PASSWORD),
)


def verify_connection() -> bool:
    try:
        driver.verify_connectivity()
        return True
    except Exception as e:
        print(f"NEO4J ERROR: {type(e).__name__}: {e}")
        return False


def close_connection():
    driver.close()