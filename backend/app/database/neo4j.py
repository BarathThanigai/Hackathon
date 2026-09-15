import os
import certifi
from neo4j import GraphDatabase

from app.config import (
    NEO4J_URI,
    NEO4J_USERNAME,
    NEO4J_PASSWORD,
    NEO4J_DATABASE,
    NEO4J_CONNECTION_TIMEOUT_SECONDS,
)

os.environ["SSL_CERT_FILE"] = certifi.where()

driver = GraphDatabase.driver(
    NEO4J_URI,
    auth=(NEO4J_USERNAME, NEO4J_PASSWORD),
    connection_timeout=NEO4J_CONNECTION_TIMEOUT_SECONDS,
)


def verify_connection():
    try:
        driver.verify_connectivity()
        print("Neo4j connected successfully")
        return True
    except Exception as e:
        print(f"NEO4J ERROR: {type(e).__name__}: {e}")
        return False


def get_session():
    return driver.session(database=NEO4J_DATABASE)


def close_connection():
    driver.close()
